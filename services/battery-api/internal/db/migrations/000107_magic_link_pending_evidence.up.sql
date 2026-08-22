-- Stash validated lifecycle evidence on magic-link tokens so OTP-gated
-- RECYCLE/RECALL can apply evidence after ConfirmOTP (evidence was previously
-- discarded when the OTP gate returned before reading the request body).

ALTER TABLE public.magic_link_tokens
    ADD COLUMN IF NOT EXISTS pending_evidence JSONB;
