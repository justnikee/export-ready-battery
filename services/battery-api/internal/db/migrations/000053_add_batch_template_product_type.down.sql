DROP INDEX IF EXISTS idx_batch_templates_product_type;

ALTER TABLE public.batch_templates
DROP COLUMN IF EXISTS product_type;