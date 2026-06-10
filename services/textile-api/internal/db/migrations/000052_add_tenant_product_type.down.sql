DROP INDEX IF EXISTS idx_tenants_product_type;

ALTER TABLE public.tenants
DROP COLUMN IF EXISTS product_type;