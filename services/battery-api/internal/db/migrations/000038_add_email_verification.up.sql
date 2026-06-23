-- Add email verification fields to tenants table
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS email_verified            BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS email_verification_token  VARCHAR(128),
    ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_tenants_email_verification_token
    ON public.tenants(email_verification_token)
    WHERE email_verification_token IS NOT NULL;

-- All existing tenants are pre-verified (they already use the system or signed up via OAuth)
UPDATE public.tenants SET email_verified = true WHERE created_at < NOW();
