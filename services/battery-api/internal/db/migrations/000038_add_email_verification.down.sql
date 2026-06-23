ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS email_verified,
    DROP COLUMN IF EXISTS email_verification_token,
    DROP COLUMN IF EXISTS email_verification_expires;
