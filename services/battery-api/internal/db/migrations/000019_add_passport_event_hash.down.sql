-- Rollback: Remove hash columns from passport_events

DROP INDEX IF EXISTS idx_passport_events_hash;

ALTER TABLE passport_events
DROP COLUMN IF EXISTS previous_hash;

ALTER TABLE passport_events
DROP COLUMN IF EXISTS hash;
