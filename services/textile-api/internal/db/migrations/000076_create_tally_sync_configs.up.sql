CREATE TABLE IF NOT EXISTS tally_sync_configs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tally_host      text NOT NULL DEFAULT 'localhost',
    tally_port      int NOT NULL DEFAULT 9000,
    sync_frequency_minutes int NOT NULL DEFAULT 5 CHECK (sync_frequency_minutes BETWEEN 1 AND 60),
    auto_import     boolean NOT NULL DEFAULT false,
    enabled         boolean NOT NULL DEFAULT false,
    last_sync_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id)
);

CREATE INDEX idx_tally_sync_configs_tenant ON tally_sync_configs(tenant_id);
