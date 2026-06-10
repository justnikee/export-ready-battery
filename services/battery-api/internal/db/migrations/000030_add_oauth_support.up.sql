-- Migration: Add OAuth support
-- Makes password_hash nullable for OAuth users and adds provider columns

-- Allow NULL password_hash for OAuth-only users
ALTER TABLE public.tenants ALTER COLUMN password_hash DROP NOT NULL;

-- Add OAuth provider columns
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);

-- Unique constraint: one OAuth identity per provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_oauth_provider_id
    ON public.tenants (oauth_provider, oauth_provider_id)
    WHERE oauth_provider IS NOT NULL;
