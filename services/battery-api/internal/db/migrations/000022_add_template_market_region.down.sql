-- Remove market_region column from batch_templates
ALTER TABLE public.batch_templates DROP COLUMN IF EXISTS market_region;
