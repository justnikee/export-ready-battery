-- Migration 066: Add BOM / component hierarchy to batch_specs
--
-- Batteries have nested component trees (pack → module → cell).
-- JSONB is used because depth is variable and schema iteration needs to be fast.

ALTER TABLE batches ADD COLUMN IF NOT EXISTS components jsonb DEFAULT '[]';

-- GIN index for fast JSONB queries (e.g. find all batches containing a specific cell chemistry)
CREATE INDEX IF NOT EXISTS idx_batch_specs_components_gin ON batches USING gin (components);
