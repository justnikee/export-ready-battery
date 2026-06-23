-- Rollback export jobs table

DROP INDEX IF EXISTS idx_export_jobs_pending;
DROP INDEX IF EXISTS idx_export_jobs_requested_at;
DROP INDEX IF EXISTS idx_export_jobs_status;
DROP INDEX IF EXISTS idx_export_jobs_batch;
DROP INDEX IF EXISTS idx_export_jobs_tenant;

DROP TABLE IF EXISTS export_jobs;

DROP TYPE IF EXISTS export_job_type;
DROP TYPE IF EXISTS export_job_status;
