-- Migration 094: Tenant Certificate Verification Jobs
--
-- Async jobs that check a tenant's compliance registration numbers (e.g. BIS
-- R-Number) against an external registry adapter, so epr_status/bis_status/
-- pli_status can move from PENDING to VERIFIED automatically when the
-- registry confirms the registration — without waiting on manual admin
-- review via /api/v1/admin/verify-doc.

CREATE TABLE IF NOT EXISTS tenant_cert_verification_jobs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    doc_type          text NOT NULL CHECK (doc_type IN ('epr','bis','pli')),
    certificate_no    text NOT NULL,
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','success','failed','dead')),
    attempt_count     int NOT NULL DEFAULT 0,
    max_attempts      int NOT NULL DEFAULT 5,
    next_attempt_at   timestamptz,
    result_status     text,
    result_trust_tier text,
    error_message     text,
    created_at        timestamptz NOT NULL DEFAULT NOW(),
    updated_at        timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_cert_jobs_status_next
    ON tenant_cert_verification_jobs(status, next_attempt_at) WHERE status IN ('pending','failed');
CREATE INDEX IF NOT EXISTS idx_tenant_cert_jobs_tenant
    ON tenant_cert_verification_jobs(tenant_id);

-- Avoid piling up duplicate jobs when a tenant repeatedly saves the same
-- registration number before the existing job has been processed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_cert_jobs_pending_unique
    ON tenant_cert_verification_jobs(tenant_id, doc_type) WHERE status IN ('pending','running');
