CREATE TABLE IF NOT EXISTS registry_jobs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_type   text NOT NULL CHECK (registry_type IN ('bis','cpcb','eu_nando','un38_3','custom')),
    certificate_no  text NOT NULL DEFAULT '',
    batch_id        uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','success','failed','dead')),
    attempt_count   int NOT NULL DEFAULT 0,
    max_attempts    int NOT NULL DEFAULT 5,
    next_attempt_at timestamptz,
    result_status   text,
    result_trust_tier text,
    result_id       uuid,
    error_message   text,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registry_jobs_status_next ON registry_jobs(status, next_attempt_at) WHERE status IN ('pending','failed');
CREATE INDEX idx_registry_jobs_batch ON registry_jobs(batch_id);
CREATE INDEX idx_registry_jobs_tenant ON registry_jobs(tenant_id);
