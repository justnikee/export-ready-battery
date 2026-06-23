DROP TRIGGER IF EXISTS trigger_update_component_timestamp ON components;
DROP FUNCTION IF EXISTS update_component_timestamp();
DROP INDEX IF EXISTS idx_components_batch_type;
DROP INDEX IF EXISTS idx_components_hierarchy;
DROP INDEX IF EXISTS idx_components_type;
DROP INDEX IF EXISTS idx_components_parent;
DROP INDEX IF EXISTS idx_components_batch;
DROP INDEX IF EXISTS idx_components_tenant;
DROP TABLE IF EXISTS components;
