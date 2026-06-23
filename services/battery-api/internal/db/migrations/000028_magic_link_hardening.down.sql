DROP INDEX IF EXISTS idx_magic_link_tokens_hash;
ALTER TABLE public.magic_link_tokens
    DROP COLUMN IF EXISTS action;