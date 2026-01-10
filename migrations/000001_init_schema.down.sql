-- Drop indexes
DROP INDEX IF EXISTS idx_passports_status;
DROP INDEX IF EXISTS idx_passports_serial_number;
DROP INDEX IF EXISTS idx_passports_batch_id;
DROP INDEX IF EXISTS idx_batches_tenant_id;

-- Drop tables in reverse order (due to foreign key constraints)
DROP TABLE IF EXISTS passports;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS tenants;
