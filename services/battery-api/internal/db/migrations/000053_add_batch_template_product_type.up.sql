ALTER TABLE public.batch_templates ADD COLUMN IF NOT EXISTS product_type TEXT;

UPDATE public.batch_templates
SET product_type = 'BATTERY'
WHERE product_type IS NULL;

ALTER TABLE public.batch_templates
ALTER COLUMN product_type SET DEFAULT 'BATTERY';

ALTER TABLE public.batch_templates
ALTER COLUMN product_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_batch_templates_product_type ON public.batch_templates(product_type);