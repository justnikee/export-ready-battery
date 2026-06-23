CREATE TABLE IF NOT EXISTS outbound_webhooks (
    id               UUID        PRIMARY KEY,
    tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url              TEXT        NOT NULL,
    secret           TEXT        NOT NULL,
    event_types      TEXT[]      NOT NULL DEFAULT '{}',
    is_active        BOOLEAN     NOT NULL DEFAULT true,
    failure_count    INTEGER     NOT NULL DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_webhooks_tenant_id ON outbound_webhooks(tenant_id);
