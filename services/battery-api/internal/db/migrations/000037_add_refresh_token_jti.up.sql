-- Add refresh token JTI (JWT ID) for server-side revocation
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS refresh_token_jti   VARCHAR(64),
    ADD COLUMN IF NOT EXISTS refresh_token_expires TIMESTAMPTZ;

-- Index for fast JTI lookup on refresh
CREATE INDEX IF NOT EXISTS idx_tenants_refresh_jti
    ON public.tenants(refresh_token_jti)
    WHERE refresh_token_jti IS NOT NULL;
