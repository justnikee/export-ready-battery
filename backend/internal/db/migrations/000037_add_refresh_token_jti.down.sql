ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS refresh_token_jti,
    DROP COLUMN IF EXISTS refresh_token_expires;
