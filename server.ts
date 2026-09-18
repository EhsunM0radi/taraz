import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { syncQueueService } from './server/redisQueue';
import { getSupabase, inMemoryCloudStore, SUPABASE_SQL_SCHEMA } from './server/supabase';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 1. Health Check
  app.get('/api/health', (req, res) => {
    const supabase = getSupabase();
    const metrics = syncQueueService.getMetrics();
    res.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: Date.now(),
      services: {
        supabase: {
          configured: !!supabase,
          status: supabase ? 'connected' : 'unconfigured_fallback',
        },
        redis: {
          connected: metrics.isRedisConnected,
          queueType: metrics.activeQueueType,
          pendingJobs: metrics.pendingJobs,
          totalProcessed: metrics.totalProcessed,
        },
      },
    });
  });

  // 2. Supabase SQL Migration Schema Endpoint
  app.get('/api/sync/schema', (req, res) => {
    res.type('text/plain').send(SUPABASE_SQL_SCHEMA);
  });

  // 3. Batch Delta Push (Enqueue into Redis / Worker queue)
  app.post('/api/sync/push', async (req, res) => {
    try {
      const {
        tenantId,
        phoneNumber,
        deltas = [],
        snapshot,
        deviceId,
        clientVersion,
        force = false,
      } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId is required' });
      }

      // Check last sync time (1-day limit policy to save cost)
      let lastSyncAt = 0;
      const supabase = getSupabase();

      if (supabase) {
        const { data } = await supabase
          .from('tenants')
          .select('last_sync_at')
          .eq('id', tenantId)
          .single();
        if (data?.last_sync_at) {
          lastSyncAt = new Date(data.last_sync_at).getTime();
        }
      } else {
        const local = inMemoryCloudStore.get(tenantId);
        if (local) {
          lastSyncAt = local.lastSyncAt;
        }
      }

      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const timeSinceLastSync = Date.now() - lastSyncAt;

      // If user synced less than 24 hours ago and didn't explicitly force manual sync
      if (!force && lastSyncAt > 0 && timeSinceLastSync < ONE_DAY_MS && deltas.length === 0) {
        const nextAllowedSync = lastSyncAt + ONE_DAY_MS;
        return res.json({
          success: true,
          status: 'skipped_within_24h',
          message: 'همگام‌سازی روزانه قبلاً انجام شده است.',
          lastSyncAt,
          nextAllowedSync,
          hoursRemaining: Math.ceil((nextAllowedSync - Date.now()) / (1000 * 60 * 60)),
        });
      }

      // Enqueue the job for Redis background processing
      const enqueued = await syncQueueService.enqueue({
        tenantId,
        phoneNumber: phoneNumber || tenantId,
        deviceId,
        clientVersion,
        deltas,
        snapshot,
      });

      return res.json({
        success: true,
        status: 'enqueued',
        jobId: enqueued.jobId,
        queueType: syncQueueService.getMetrics().activeQueueType,
        deltasCount: deltas.length,
        hasSnapshot: !!snapshot,
        syncedAt: Date.now(),
        nextAllowedSync: Date.now() + ONE_DAY_MS,
      });
    } catch (err: any) {
      console.error('Error in /api/sync/push:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // 4. Batch Delta Pull (Restore latest cloud state for new device or re-install)
  app.get('/api/sync/pull', async (req, res) => {
    try {
      const tenantId = (req.query.tenantId as string) || '';
      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId query parameter is required' });
      }

      const supabase = getSupabase();

      if (supabase) {
        // Fetch latest snapshot
        const { data: snapshotData } = await supabase
          .from('tenant_snapshots')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Fetch deltas after snapshot
        const since = req.query.since ? parseInt(req.query.since as string, 10) : 0;
        const { data: deltasData } = await supabase
          .from('tenant_deltas')
          .select('*')
          .eq('tenant_id', tenantId)
          .gt('timestamp', since)
          .order('timestamp', { ascending: true });

        return res.json({
          success: true,
          tenantId,
          snapshot: snapshotData?.encrypted_payload || null,
          deltas: deltasData || [],
          pulledAt: Date.now(),
        });
      }

      // Fallback in-memory
      const local = inMemoryCloudStore.get(tenantId);
      return res.json({
        success: true,
        tenantId,
        snapshot: local?.latestSnapshot || null,
        deltas: local?.deltas || [],
        pulledAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Error in /api/sync/pull:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // 5. Tenant Sync Status
  app.get('/api/sync/status', async (req, res) => {
    try {
      const tenantId = (req.query.tenantId as string) || '';
      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId is required' });
      }

      const supabase = getSupabase();
      let lastSyncAt = 0;
      let totalSyncCount = 0;

      if (supabase) {
        const { data } = await supabase
          .from('tenants')
          .select('last_sync_at, total_sync_count')
          .eq('id', tenantId)
          .single();
        if (data) {
          lastSyncAt = data.last_sync_at ? new Date(data.last_sync_at).getTime() : 0;
          totalSyncCount = data.total_sync_count || 0;
        }
      } else {
        const local = inMemoryCloudStore.get(tenantId);
        if (local) {
          lastSyncAt = local.lastSyncAt;
          totalSyncCount = local.syncCount;
        }
      }

      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const isEligibleForDailySync = Date.now() - lastSyncAt >= ONE_DAY_MS;

      return res.json({
        tenantId,
        lastSyncAt,
        totalSyncCount,
        isEligibleForDailySync,
        nextAllowedSync: lastSyncAt > 0 ? lastSyncAt + ONE_DAY_MS : Date.now(),
        metrics: syncQueueService.getMetrics(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Taraz Server] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
