-- Reverse OAuth support migration

DROP INDEX IF EXISTS idx_tenants_oauth_provider_id;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS oauth_provider_id;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS oauth_provider;

-- Restore NOT NULL constraint (set empty hash for any OAuth-only users first)
UPDATE public.tenants SET password_hash = '' WHERE password_hash IS NULL;
ALTER TABLE public.tenants ALTER COLUMN password_hash SET NOT NULL;
