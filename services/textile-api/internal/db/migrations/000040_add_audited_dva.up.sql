-- 000040: Add audited_domestic_value_add to batches
-- CA-certified Domestic Value Add percentage (nullable, set when dva_source = 'AUDITED')

ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS audited_domestic_value_add DOUBLE PRECISION;

COMMENT ON COLUMN public.batches.audited_domestic_value_add
    IS 'CA-certified Domestic Value Add percentage (nullable, set when dva_source=AUDITED)';
