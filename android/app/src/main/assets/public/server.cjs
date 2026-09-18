var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/redisQueue.ts
var import_ioredis = __toESM(require("ioredis"), 1);

// server/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseClient = null;
var SUPABASE_SQL_SCHEMA = `
-- 1. Tenants & Sync Metadata Table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  total_sync_count INT DEFAULT 0
);

-- 2. Daily Snapshots Table (Compressed & Encrypted Zero-Knowledge Payloads)
CREATE TABLE IF NOT EXISTS tenant_snapshots (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  encrypted_payload TEXT NOT NULL,
  device_id TEXT,
  client_version TEXT,
  record_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_snapshots_tenant ON tenant_snapshots(tenant_id, created_at DESC);

-- 3. Incremental Delta Changes Table (Transactions & Data Created Offline)
CREATE TABLE IF NOT EXISTS tenant_deltas (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'transactions', 'accounts', 'cards', etc.
  action TEXT NOT NULL,      -- 'create', 'update', 'delete'
  entity_id TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_deltas_lookup ON tenant_deltas(tenant_id, timestamp);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_deltas ENABLE ROW LEVEL SECURITY;
`;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  try {
    supabaseClient = (0, import_supabase_js.createClient)(url, key, {
      auth: { persistSession: false }
    });
    return supabaseClient;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
}
var inMemoryCloudStore = /* @__PURE__ */ new Map();

// server/redisQueue.ts
var SyncQueueService = class {
  constructor() {
    this.redisClient = null;
    this.isRedisReady = false;
    this.inMemoryQueue = [];
    this.isProcessing = false;
    this.metrics = {
      isRedisConnected: false,
      activeQueueType: "in-memory",
      totalEnqueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      pendingJobs: 0
    };
    this.initRedis();
  }
  initRedis() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log("\u2139\uFE0F [Redis Queue] No REDIS_URL provided. Using resilient In-Memory Job Queue.");
      this.metrics.activeQueueType = "in-memory";
      this.startInMemoryWorker();
      return;
    }
    try {
      this.redisClient = new import_ioredis.default(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: 4e3,
        lazyConnect: true
      });
      this.redisClient.on("connect", () => {
        this.isRedisReady = true;
        this.metrics.isRedisConnected = true;
        this.metrics.activeQueueType = "redis";
        console.log("\u2705 [Redis Queue] Connected to Redis server.");
        this.startRedisWorker();
      });
      this.redisClient.on("error", (err) => {
        if (this.isRedisReady) {
          console.warn("\u26A0\uFE0F [Redis Queue] Redis connection error, fallback to in-memory queue:", err.message);
        }
        this.isRedisReady = false;
        this.metrics.isRedisConnected = false;
        this.metrics.activeQueueType = "in-memory";
      });
      this.redisClient.connect().catch(() => {
        this.metrics.activeQueueType = "in-memory";
        this.startInMemoryWorker();
      });
    } catch {
      this.metrics.activeQueueType = "in-memory";
      this.startInMemoryWorker();
    }
  }
  async enqueue(job) {
    const fullJob = {
      ...job,
      jobId: "job_" + Math.random().toString(36).substring(2, 10),
      receivedAt: Date.now()
    };
    this.metrics.totalEnqueued++;
    if (this.isRedisReady && this.redisClient) {
      try {
        await this.redisClient.rpush("taraz_sync_queue", JSON.stringify(fullJob));
        this.metrics.pendingJobs = await this.redisClient.llen("taraz_sync_queue");
        return { jobId: fullJob.jobId, status: "queued" };
      } catch {
        this.inMemoryQueue.push(fullJob);
        this.metrics.pendingJobs = this.inMemoryQueue.length;
        this.triggerProcessInMemory();
        return { jobId: fullJob.jobId, status: "queued" };
      }
    }
    this.inMemoryQueue.push(fullJob);
    this.metrics.pendingJobs = this.inMemoryQueue.length;
    this.triggerProcessInMemory();
    return { jobId: fullJob.jobId, status: "queued" };
  }
  startInMemoryWorker() {
    setInterval(() => {
      this.triggerProcessInMemory();
    }, 2e3);
  }
  async triggerProcessInMemory() {
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
  async startRedisWorker() {
    const workerLoop = async () => {
      if (!this.isRedisReady || !this.redisClient) {
        setTimeout(workerLoop, 2e3);
        return;
      }
      try {
        const raw = await this.redisClient.lpop("taraz_sync_queue");
        if (raw) {
          const job = JSON.parse(raw);
          await this.processJob(job);
          this.metrics.pendingJobs = await this.redisClient.llen("taraz_sync_queue");
        }
      } catch (err) {
        console.error("Redis worker error:", err);
      }
      setTimeout(workerLoop, 500);
    };
    workerLoop();
  }
  async processJob(job) {
    try {
      const supabase = getSupabase();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (supabase) {
        await supabase.from("tenants").upsert({
          id: job.tenantId,
          phone_number: job.phoneNumber,
          last_sync_at: now
        }, { onConflict: "id" });
        if (job.snapshot) {
          await supabase.from("tenant_snapshots").insert({
            tenant_id: job.tenantId,
            encrypted_payload: job.snapshot,
            device_id: job.deviceId || "web",
            client_version: job.clientVersion || "1.0.0",
            record_count: job.deltas.length
          });
        }
        if (job.deltas && job.deltas.length > 0) {
          const deltaRows = job.deltas.map((d) => ({
            tenant_id: job.tenantId,
            entity_type: d.entityType,
            action: d.action,
            entity_id: d.entityId,
            encrypted_data: d.payload,
            timestamp: d.timestamp
          }));
          await supabase.from("tenant_deltas").insert(deltaRows);
        }
      } else {
        let current = inMemoryCloudStore.get(job.tenantId);
        if (!current) {
          current = {
            tenantId: job.tenantId,
            phoneNumber: job.phoneNumber,
            lastSyncAt: Date.now(),
            syncCount: 0,
            deltas: []
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
              id: "delta_" + Math.random().toString(36).substring(2, 9),
              entityType: d.entityType,
              action: d.action,
              entityId: d.entityId,
              encryptedData: d.payload,
              timestamp: d.timestamp
            });
          }
        }
        inMemoryCloudStore.set(job.tenantId, current);
      }
      this.metrics.totalProcessed++;
      this.metrics.lastProcessedAt = Date.now();
    } catch (err) {
      console.error(`\u274C [Sync Queue] Failed processing job for tenant ${job.tenantId}:`, err);
      this.metrics.totalFailed++;
    }
  }
  getMetrics() {
    return { ...this.metrics };
  }
};
var syncQueueService = new SyncQueueService();

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  app.use(import_express.default.urlencoded({ extended: true }));
  app.get("/api/health", (req, res) => {
    const supabase = getSupabase();
    const metrics = syncQueueService.getMetrics();
    res.json({
      status: "ok",
      version: "1.0.0",
      timestamp: Date.now(),
      services: {
        supabase: {
          configured: !!supabase,
          status: supabase ? "connected" : "unconfigured_fallback"
        },
        redis: {
          connected: metrics.isRedisConnected,
          queueType: metrics.activeQueueType,
          pendingJobs: metrics.pendingJobs,
          totalProcessed: metrics.totalProcessed
        }
      }
    });
  });
  app.get("/api/sync/schema", (req, res) => {
    res.type("text/plain").send(SUPABASE_SQL_SCHEMA);
  });
  app.post("/api/sync/push", async (req, res) => {
    try {
      const {
        tenantId,
        phoneNumber,
        deltas = [],
        snapshot,
        deviceId,
        clientVersion,
        force = false
      } = req.body;
      if (!tenantId) {
        return res.status(400).json({ error: "tenantId is required" });
      }
      let lastSyncAt = 0;
      const supabase = getSupabase();
      if (supabase) {
        const { data } = await supabase.from("tenants").select("last_sync_at").eq("id", tenantId).single();
        if (data?.last_sync_at) {
          lastSyncAt = new Date(data.last_sync_at).getTime();
        }
      } else {
        const local = inMemoryCloudStore.get(tenantId);
        if (local) {
          lastSyncAt = local.lastSyncAt;
        }
      }
      const ONE_DAY_MS = 24 * 60 * 60 * 1e3;
      const timeSinceLastSync = Date.now() - lastSyncAt;
      if (!force && lastSyncAt > 0 && timeSinceLastSync < ONE_DAY_MS && deltas.length === 0) {
        const nextAllowedSync = lastSyncAt + ONE_DAY_MS;
        return res.json({
          success: true,
          status: "skipped_within_24h",
          message: "\u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0631\u0648\u0632\u0627\u0646\u0647 \u0642\u0628\u0644\u0627\u064B \u0627\u0646\u062C\u0627\u0645 \u0634\u062F\u0647 \u0627\u0633\u062A.",
          lastSyncAt,
          nextAllowedSync,
          hoursRemaining: Math.ceil((nextAllowedSync - Date.now()) / (1e3 * 60 * 60))
        });
      }
      const enqueued = await syncQueueService.enqueue({
        tenantId,
        phoneNumber: phoneNumber || tenantId,
        deviceId,
        clientVersion,
        deltas,
        snapshot
      });
      return res.json({
        success: true,
        status: "enqueued",
        jobId: enqueued.jobId,
        queueType: syncQueueService.getMetrics().activeQueueType,
        deltasCount: deltas.length,
        hasSnapshot: !!snapshot,
        syncedAt: Date.now(),
        nextAllowedSync: Date.now() + ONE_DAY_MS
      });
    } catch (err) {
      console.error("Error in /api/sync/push:", err);
      return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });
  app.get("/api/sync/pull", async (req, res) => {
    try {
      const tenantId = req.query.tenantId || "";
      if (!tenantId) {
        return res.status(400).json({ error: "tenantId query parameter is required" });
      }
      const supabase = getSupabase();
      if (supabase) {
        const { data: snapshotData } = await supabase.from("tenant_snapshots").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(1).single();
        const since = req.query.since ? parseInt(req.query.since, 10) : 0;
        const { data: deltasData } = await supabase.from("tenant_deltas").select("*").eq("tenant_id", tenantId).gt("timestamp", since).order("timestamp", { ascending: true });
        return res.json({
          success: true,
          tenantId,
          snapshot: snapshotData?.encrypted_payload || null,
          deltas: deltasData || [],
          pulledAt: Date.now()
        });
      }
      const local = inMemoryCloudStore.get(tenantId);
      return res.json({
        success: true,
        tenantId,
        snapshot: local?.latestSnapshot || null,
        deltas: local?.deltas || [],
        pulledAt: Date.now()
      });
    } catch (err) {
      console.error("Error in /api/sync/pull:", err);
      return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });
  app.get("/api/sync/status", async (req, res) => {
    try {
      const tenantId = req.query.tenantId || "";
      if (!tenantId) {
        return res.status(400).json({ error: "tenantId is required" });
      }
      const supabase = getSupabase();
      let lastSyncAt = 0;
      let totalSyncCount = 0;
      if (supabase) {
        const { data } = await supabase.from("tenants").select("last_sync_at, total_sync_count").eq("id", tenantId).single();
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
      const ONE_DAY_MS = 24 * 60 * 60 * 1e3;
      const isEligibleForDailySync = Date.now() - lastSyncAt >= ONE_DAY_MS;
      return res.json({
        tenantId,
        lastSyncAt,
        totalSyncCount,
        isEligibleForDailySync,
        nextAllowedSync: lastSyncAt > 0 ? lastSyncAt + ONE_DAY_MS : Date.now(),
        metrics: syncQueueService.getMetrics()
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} [Taraz Server] Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
