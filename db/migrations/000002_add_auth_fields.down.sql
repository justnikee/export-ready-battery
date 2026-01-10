-- Remove authentication fields from tenants table
DROP INDEX IF EXISTS idx_tenants_reset_token;
DROP INDEX IF EXISTS idx_tenants_email;

ALTER TABLE public.tenants DROP COLUMN IF EXISTS last_login;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS reset_token_expires;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS reset_token;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS password_hash;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS email;
