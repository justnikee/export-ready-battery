-- Phase 7: Magic Link OTP hardening
-- Adds OTP challenge table and requires_otp flag on magic_link_tokens

CREATE TABLE IF NOT EXISTS public.magic_link_otp (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    magic_link_token_hash TEXT        NOT NULL,
    otp_hash              TEXT        NOT NULL,   -- HMAC-SHA256 of 6-digit OTP
    attempt_count         INTEGER     NOT NULL DEFAULT 0,
    max_attempts          INTEGER     NOT NULL DEFAULT 5,
    last_resent_at        TIMESTAMPTZ,
    resend_count          INTEGER     NOT NULL DEFAULT 0,
    max_resends           INTEGER     NOT NULL DEFAULT 3,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at               TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_magic_link_otp_token_hash
    ON public.magic_link_otp(magic_link_token_hash);

ALTER TABLE public.magic_link_tokens
    ADD COLUMN IF NOT EXISTS requires_otp   BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ;
