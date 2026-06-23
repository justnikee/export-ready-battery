CREATE TABLE IF NOT EXISTS tally_sync_runs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status          text NOT NULL CHECK (status IN ('running', 'success', 'error')),
    error_message   text,
    items_fetched   int NOT NULL DEFAULT 0,
    items_staged    int NOT NULL DEFAULT 0,
    started_at      timestamptz NOT NULL DEFAULT NOW(),
    completed_at    timestamptz
);

CREATE INDEX idx_tally_sync_runs_tenant ON tally_sync_runs(tenant_id);
CREATE INDEX idx_tally_sync_runs_started_at ON tally_sync_runs(started_at DESC);
