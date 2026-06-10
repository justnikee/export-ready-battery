CREATE TABLE IF NOT EXISTS registry_audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          uuid REFERENCES registry_jobs(id) ON DELETE SET NULL,
    registry_type   text NOT NULL,
    certificate_no  text NOT NULL DEFAULT '',
    request_method  text,
    request_url     text,
    request_payload jsonb,
    response_status int,
    response_payload jsonb,
    latency_ms      int NOT NULL DEFAULT 0,
    error_message   text,
    created_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registry_audit_log_type_cert ON registry_audit_log(registry_type, certificate_no);
CREATE INDEX idx_registry_audit_log_created ON registry_audit_log(created_at);
CREATE INDEX idx_registry_audit_log_job ON registry_audit_log(job_id);
