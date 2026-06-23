-- Revert: drop EU textile DPP product identification fields from batches

DROP INDEX IF EXISTS idx_batches_upi;
DROP INDEX IF EXISTS idx_batches_gtin;

ALTER TABLE public.batches
    DROP COLUMN IF EXISTS apparel_subcategory,
    DROP COLUMN IF EXISTS product_category,
    DROP COLUMN IF EXISTS eclass_ir_di,
    DROP COLUMN IF EXISTS gs1_resolver_url,
    DROP COLUMN IF EXISTS gs1_digital_link_uri,
    DROP COLUMN IF EXISTS cn_code,
    DROP COLUMN IF EXISTS taric_code,
    DROP COLUMN IF EXISTS upi,
    DROP COLUMN IF EXISTS gtin;
