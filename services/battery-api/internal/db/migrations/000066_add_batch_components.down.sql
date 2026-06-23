DROP INDEX IF EXISTS idx_batch_specs_components_gin;
ALTER TABLE batches DROP COLUMN IF EXISTS components;
