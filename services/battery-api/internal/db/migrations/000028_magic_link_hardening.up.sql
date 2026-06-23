-- Phase 6 Magic Link Hardening: action binding + token hash index

ALTER TABLE public.magic_link_tokens
    ADD COLUMN IF NOT EXISTS action VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_hash ON public.magic_link_tokens(token_hash);