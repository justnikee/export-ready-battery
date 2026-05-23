DROP INDEX IF EXISTS idx_batch_specs_components_gin;
ALTER TABLE batch_specs DROP COLUMN IF EXISTS components;
