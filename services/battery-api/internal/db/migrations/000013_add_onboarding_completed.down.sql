-- Remove onboarding_completed column
ALTER TABLE tenants DROP COLUMN IF EXISTS onboarding_completed;
