-- Remove team members data first
DROP TABLE IF EXISTS team_members;

-- Remove plan_type from tenants
ALTER TABLE tenants DROP COLUMN IF EXISTS plan_type;
