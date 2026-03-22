-- =============================================================================
-- ExportReady v2: Rollback Product-Agnostic Architecture Migration
-- =============================================================================

DROP POLICY IF EXISTS product_schemas_read_all ON product_schemas;
ALTER TABLE product_schemas DISABLE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS idx_batches_compliance_score;
DROP INDEX IF EXISTS idx_product_schemas_type_active;
DROP INDEX IF EXISTS idx_passports_product_type;
DROP INDEX IF EXISTS idx_batches_product_type;

DROP TABLE IF EXISTS product_schemas;

ALTER TABLE passports DROP COLUMN IF EXISTS telemetry;
ALTER TABLE passports DROP COLUMN IF EXISTS product_type;

ALTER TABLE batches DROP COLUMN IF EXISTS compliance_gaps;
ALTER TABLE batches DROP COLUMN IF EXISTS compliance_score;
ALTER TABLE batches DROP COLUMN IF EXISTS schema_version;
ALTER TABLE batches DROP COLUMN IF EXISTS product_type;
