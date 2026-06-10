-- Rollback: Remove AI parsing jobs table and tenant tier

DROP TABLE IF EXISTS public.ai_parsing_jobs;

ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS tier;
