-- Phase 7: Rollback magic_link_otp
DROP TABLE IF EXISTS public.magic_link_otp;

ALTER TABLE public.magic_link_tokens
    DROP COLUMN IF EXISTS requires_otp,
    DROP COLUMN IF EXISTS last_resent_at;
