-- Rollback performance indexes

DROP INDEX IF EXISTS idx_passports_batch_id;
DROP INDEX IF EXISTS idx_batches_tenant_id;
DROP INDEX IF EXISTS idx_scan_events_passport_id;
DROP INDEX IF EXISTS idx_scan_events_scanned_at;
DROP INDEX IF EXISTS idx_batches_created_at;
DROP INDEX IF EXISTS idx_quota_transactions_tenant_id;
DROP INDEX IF EXISTS idx_api_keys_key_hash;
DROP INDEX IF EXISTS idx_passports_batch_status;
