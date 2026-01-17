-- Migration: Add Certificate Paths to Tenants
-- Stores file paths for EPR, BIS, and PLI compliance certificates

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS epr_certificate_path TEXT,
    ADD COLUMN IF NOT EXISTS bis_certificate_path TEXT,
    ADD COLUMN IF NOT EXISTS pli_certificate_path TEXT;

-- Comments for documentation
COMMENT ON COLUMN public.tenants.epr_certificate_path IS 'File path to uploaded EPR certificate PDF';
COMMENT ON COLUMN public.tenants.bis_certificate_path IS 'File path to uploaded BIS certificate PDF';
COMMENT ON COLUMN public.tenants.pli_certificate_path IS 'File path to uploaded PLI certificate PDF';
