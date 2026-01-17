-- Rollback: Remove India Compliance Fields

-- Remove indexes
DROP INDEX IF EXISTS idx_tenants_epr;
DROP INDEX IF EXISTS idx_batches_country_origin;

-- Remove batch columns
ALTER TABLE public.batches DROP COLUMN IF EXISTS customs_date;
ALTER TABLE public.batches DROP COLUMN IF EXISTS country_of_origin;
ALTER TABLE public.batches DROP COLUMN IF EXISTS bill_of_entry_no;

-- Remove tenant columns
ALTER TABLE public.tenants DROP COLUMN IF EXISTS iec_code;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS bis_r_number;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS epr_registration_number;
