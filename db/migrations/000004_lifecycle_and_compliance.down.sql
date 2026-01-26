-- Rollback: 000004_lifecycle_and_compliance

-- Remove lifecycle fields from passports
ALTER TABLE passports DROP COLUMN IF EXISTS shipped_at;
ALTER TABLE passports DROP COLUMN IF EXISTS installed_at;
ALTER TABLE passports DROP COLUMN IF EXISTS returned_at;
ALTER TABLE passports DROP COLUMN IF EXISTS state_of_health;
ALTER TABLE passports DROP COLUMN IF EXISTS owner_id;

-- Remove India compliance field
ALTER TABLE batches DROP COLUMN IF EXISTS hsn_code;

-- Drop passport_events table
DROP TABLE IF EXISTS passport_events;

-- Revert status back to ACTIVE
UPDATE passports SET status = 'ACTIVE' WHERE status = 'CREATED';
