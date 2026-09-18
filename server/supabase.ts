import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const SUPABASE_SQL_SCHEMA = `
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

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// In-Memory Cloud Storage Fallback for local development/preview before Supabase env vars are set
export interface InMemoryTenantData {
  tenantId: string;
  phoneNumber: string;
  lastSyncAt: number;
  syncCount: number;
  latestSnapshot?: string;
  deltas: Array<{
    id: string;
    entityType: string;
    action: string;
    entityId: string;
    encryptedData: string;
    timestamp: number;
  }>;
}

export const inMemoryCloudStore: Map<string, InMemoryTenantData> = new Map();
