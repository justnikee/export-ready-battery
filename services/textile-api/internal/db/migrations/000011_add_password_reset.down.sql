-- Remove password reset token fields from tenants table
DROP INDEX IF EXISTS idx_tenants_reset_token;

ALTER TABLE public.tenants
DROP COLUMN IF EXISTS reset_token,
DROP COLUMN IF EXISTS reset_token_expires;
