-- Migration: Add EU textile DPP product identification fields to batches
-- Covers ESPR Art. 9 UPI/GTIN requirements and customs classification.

ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS gtin VARCHAR(14),
    ADD COLUMN IF NOT EXISTS upi VARCHAR(50),
    ADD COLUMN IF NOT EXISTS taric_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS cn_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS gs1_digital_link_uri TEXT,
    ADD COLUMN IF NOT EXISTS gs1_resolver_url TEXT,
    ADD COLUMN IF NOT EXISTS eclass_ir_di VARCHAR(50),
    ADD COLUMN IF NOT EXISTS product_category VARCHAR(50),
    ADD COLUMN IF NOT EXISTS apparel_subcategory VARCHAR(50);

COMMENT ON COLUMN public.batches.gtin IS 'GS1 Global Trade Item Number (8, 12, 13 or 14 digits)';
COMMENT ON COLUMN public.batches.upi IS 'Unique Product Identifier, typically GTIN + serial/component (ESPR Art. 9)';
COMMENT ON COLUMN public.batches.taric_code IS 'EU TARIC customs classification code';
COMMENT ON COLUMN public.batches.cn_code IS 'Combined Nomenclature customs code';
COMMENT ON COLUMN public.batches.gs1_digital_link_uri IS 'GS1 Digital Link URL, e.g. https://id.gs1.org/01/{GTIN}/21/{SN}';
COMMENT ON COLUMN public.batches.gs1_resolver_url IS 'Fallback GS1 resolver URL when full GTIN is not yet assigned';
COMMENT ON COLUMN public.batches.eclass_ir_di IS 'ECLASS IRDI for product-type interoperability';
COMMENT ON COLUMN public.batches.product_category IS 'High-level ESPR product category, e.g. TEXTILE_APPAREL';
COMMENT ON COLUMN public.batches.apparel_subcategory IS 'Apparel subcategory, e.g. KNITTED, WOVEN, DENIM, ACTIVEWEAR';

CREATE INDEX IF NOT EXISTS idx_batches_gtin ON public.batches(gtin) WHERE gtin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batches_upi ON public.batches(upi) WHERE upi IS NOT NULL;
