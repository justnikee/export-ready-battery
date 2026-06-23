-- Migration: Add Document Verification Status columns
-- Status values: NOT_UPLOADED, PENDING, VERIFIED, REJECTED

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS epr_status TEXT DEFAULT 'NOT_UPLOADED',
    ADD COLUMN IF NOT EXISTS bis_status TEXT DEFAULT 'NOT_UPLOADED',
    ADD COLUMN IF NOT EXISTS pli_status TEXT DEFAULT 'NOT_UPLOADED';

-- Update existing rows: if certificate path exists, set status to PENDING
UPDATE public.tenants SET epr_status = 'PENDING' WHERE epr_certificate_path IS NOT NULL AND epr_certificate_path != '';
UPDATE public.tenants SET bis_status = 'PENDING' WHERE bis_certificate_path IS NOT NULL AND bis_certificate_path != '';
UPDATE public.tenants SET pli_status = 'PENDING' WHERE pli_certificate_path IS NOT NULL AND pli_certificate_path != '';

-- Comments for documentation
COMMENT ON COLUMN public.tenants.epr_status IS 'EPR certificate verification status: NOT_UPLOADED, PENDING, VERIFIED, REJECTED';
COMMENT ON COLUMN public.tenants.bis_status IS 'BIS certificate verification status: NOT_UPLOADED, PENDING, VERIFIED, REJECTED';
COMMENT ON COLUMN public.tenants.pli_status IS 'PLI certificate verification status: NOT_UPLOADED, PENDING, VERIFIED, REJECTED';
