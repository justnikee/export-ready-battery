ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS product_type TEXT;

UPDATE public.tenants
SET product_type = 'BATTERY'
WHERE product_type IS NULL;

ALTER TABLE public.tenants
ALTER COLUMN product_type SET DEFAULT 'BATTERY';

ALTER TABLE public.tenants
ALTER COLUMN product_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_product_type ON public.tenants(product_type);