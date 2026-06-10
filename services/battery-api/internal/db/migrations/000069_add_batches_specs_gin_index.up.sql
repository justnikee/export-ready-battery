-- Migration 069: Add GIN index on batches.specs JSONB column
--
-- Problem: batches.specs is the most heavily queried JSONB column.
-- Every batch read/write touches it. Without a GIN index, JSONB queries
-- trigger full table scans.
--
-- Solution: Create a GIN index for fast JSONB containment and key lookups.

CREATE INDEX IF NOT EXISTS idx_batches_specs_gin ON batches USING gin (specs);
