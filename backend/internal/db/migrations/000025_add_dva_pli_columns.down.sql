-- Rollback: Remove DVA and PLI columns
ALTER TABLE public.batches
    DROP COLUMN IF EXISTS dva_source,
    DROP COLUMN IF EXISTS pli_certificate_url;
