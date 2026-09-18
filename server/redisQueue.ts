import Redis from 'ioredis';
import { getSupabase, inMemoryCloudStore } from './supabase';

export interface SyncJobData {
  jobId: string;
  tenantId: string;
  phoneNumber: string;
  deviceId?: string;
  clientVersion?: string;
  deltas: Array<{
    entityType: string;
    action: string;
    entityId: string;
    payload: string;
    timestamp: number;
  }>;
  snapshot?: string;
  receivedAt: number;
}

export interface QueueMetrics {
  isRedisConnected: boolean;
  activeQueueType: 'redis' | 'in-memory';
  totalEnqueued: number;
  totalProcessed: number;
  totalFailed: number;
  pendingJobs: number;
  lastProcessedAt?: number;
}

class SyncQueueService {
  private redisClient: Redis | null = null;
  private isRedisReady = false;
  private inMemoryQueue: SyncJobData[] = [];
  private isProcessing = false;

  private metrics: QueueMetrics = {
    isRedisConnected: false,
    activeQueueType: 'in-memory',
    totalEnqueued: 0,
    totalProcessed: 0,
    totalFailed: 0,
    pendingJobs: 0,
  };

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('ℹ️ [Redis Queue] No REDIS_URL provided. Using resilient In-Memory Job Queue.');
      this.metrics.activeQueueType = 'in-memory';
      this.startInMemoryWorker();
      return;
    }

    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: 4000,
        lazyConnect: true,
      });

      this.redisClient.on('connect', () => {
        this.isRedisReady = true;
        this.metrics.isRedisConnected = true;
        this.metrics.activeQueueType = 'redis';
        console.log('✅ [Redis Queue] Connected to Redis server.');
        this.startRedisWorker();
      });

      this.redisClient.on('error', (err) => {
        if (this.isRedisReady) {
          console.warn('⚠️ [Redis Queue] Redis connection error, fallback to in-memory queue:', err.message);
        }
        this.isRedisReady = false;
        this.metrics.isRedisConnected = false;
        this.metrics.activeQueueType = 'in-memory';
      });

      this.redisClient.connect().catch(() => {
        this.metrics.activeQueueType = 'in-memory';
        this.startInMemoryWorker();
      });
    } catch {
      this.metrics.activeQueueType = 'in-memory';
      this.startInMemoryWorker();
    }
  }

  public async enqueue(job: Omit<SyncJobData, 'jobId' | 'receivedAt'>): Promise<{ jobId: string; status: 'queued' | 'processed' }> {
    const fullJob: SyncJobData = {
      ...job,
      jobId: 'job_' + Math.random().toString(36).substring(2, 10),
      receivedAt: Date.now(),
    };

    this.metrics.totalEnqueued++;

    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.rpush('taraz_sync_queue', JSON.stringify(fullJob));
        this.metrics.pendingJobs = await this.redisClient.llen('taraz_sync_queue');
        return { jobId: fullJob.jobId, status: 'queued' };
      } catch {
        // Fallback to in-memory on redis push failure
        this.inMemoryQueue.push(fullJob);
        this.metrics.pendingJobs = this.inMemoryQueue.length;
        this.triggerProcessInMemory();
        return { jobId: fullJob.jobId, status: 'queued' };
      }
    }

    this.inMemoryQueue.push(fullJob);
    this.metrics.pendingJobs = this.inMemoryQueue.length;
    this.triggerProcessInMemory();
    return { jobId: fullJob.jobId, status: 'queued' };
  }

  private startInMemoryWorker() {
    setInterval(() => {
      this.triggerProcessInMemory();
    }, 2000);
  }

  private async triggerProcessInMemory() {
    if (this.isProcessing || this.inMemoryQueue.length === 0) return;
    this.isProcessing = true;

    while (this.inMemoryQueue.length > 0) {
      const job = this.inMemoryQueue.shift();
      if (!job) break;
      this.metrics.pendingJobs = this.inMemoryQueue.length;
      await this.processJob(job);
    }

    this.isProcessing = false;
  }

  private async startRedisWorker() {
    const workerLoop = async () => {
      if (!this.isRedisReady || !this.redisClient) {
        setTimeout(workerLoop, 2000);
        return;
      }

      try {
        const raw = await this.redisClient.lpop('taraz_sync_queue');
        if (raw) {
          const job: SyncJobData = JSON.parse(raw);
          await this.processJob(job);
          this.metrics.pendingJobs = await this.redisClient.llen('taraz_sync_queue');
        }
      } catch (err) {
        console.error('Redis worker error:', err);
      }

      setTimeout(workerLoop, 500);
    };

    workerLoop();
  }

  private async processJob(job: SyncJobData): Promise<void> {
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      if (supabase) {
        // 1. Upsert Tenant in Supabase
        await supabase
          .from('tenants')
          .upsert({
            id: job.tenantId,
            phone_number: job.phoneNumber,
            last_sync_at: now,
          }, { onConflict: 'id' });

        // 2. Insert Snapshot if provided
        if (job.snapshot) {
          await supabase.from('tenant_snapshots').insert({
            tenant_id: job.tenantId,
            encrypted_payload: job.snapshot,
            device_id: job.deviceId || 'web',
            client_version: job.clientVersion || '1.0.0',
            record_count: job.deltas.length,
          });
        }

        // 3. Batch Insert Incremental Deltas
        if (job.deltas && job.deltas.length > 0) {
          const deltaRows = job.deltas.map((d) => ({
            tenant_id: job.tenantId,
            entity_type: d.entityType,
            action: d.action,
            entity_id: d.entityId,
            encrypted_data: d.payload,
            timestamp: d.timestamp,
          }));
          await supabase.from('tenant_deltas').insert(deltaRows);
        }
      } else {
        // Fallback in-memory database store
        let current = inMemoryCloudStore.get(job.tenantId);
        if (!current) {
          current = {
            tenantId: job.tenantId,
            phoneNumber: job.phoneNumber,
            lastSyncAt: Date.now(),
            syncCount: 0,
            deltas: [],
          };
        }
        current.lastSyncAt = Date.now();
        current.syncCount++;
        if (job.snapshot) {
          current.latestSnapshot = job.snapshot;
        }
        if (job.deltas && job.deltas.length > 0) {
          for (const d of job.deltas) {
            current.deltas.push({
              id: 'delta_' + Math.random().toString(36).substring(2, 9),
              entityType: d.entityType,
              action: d.action,
              entityId: d.entityId,
              encryptedData: d.payload,
              timestamp: d.timestamp,
            });
          }
        }
        inMemoryCloudStore.set(job.tenantId, current);
      }

      this.metrics.totalProcessed++;
      this.metrics.lastProcessedAt = Date.now();
    } catch (err) {
      console.error(`❌ [Sync Queue] Failed processing job for tenant ${job.tenantId}:`, err);
      this.metrics.totalFailed++;
    }
  }

  public getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }
}

export const syncQueueService = new SyncQueueService();
