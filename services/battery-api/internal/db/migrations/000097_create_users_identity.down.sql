-- Rollback 097: drop the users identity layer.
-- Tenants' legacy auth columns were never touched in the up migration, so login
-- reverts cleanly. Synthesized OWNER memberships are removed; team_members.user_id
-- remap is left as-is (harmless once the FK and users table are gone).

ALTER TABLE team_members DROP CONSTRAINT IF EXISTS fk_team_members_user;
DROP INDEX IF EXISTS idx_team_members_user_id;

-- Remove the OWNER memberships synthesized in step 3 (owners predate team_members).
DELETE FROM team_members WHERE role = 'OWNER';

DROP TABLE IF EXISTS public.users;
