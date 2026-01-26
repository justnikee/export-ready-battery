-- Rollback: 000005_magic_link

-- Drop magic link tokens table
DROP TABLE IF EXISTS magic_link_tokens;

-- Remove columns from passports
ALTER TABLE passports DROP COLUMN IF EXISTS current_owner_email;
ALTER TABLE passports DROP COLUMN IF EXISTS recycled_at;

-- Remove actor_role from passport_events
ALTER TABLE passport_events DROP COLUMN IF EXISTS actor_role;
