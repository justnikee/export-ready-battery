-- Migration: Add Organization Details to Tenants
-- Adds fields for company profile management (Compliance requirement)

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS support_email TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT;

-- Comments for documentation
COMMENT ON COLUMN public.tenants.address IS 'Official physical address for compliance certificates';
COMMENT ON COLUMN public.tenants.logo_url IS 'URL to company logo for passport header';
COMMENT ON COLUMN public.tenants.support_email IS 'Public support email displayed in passport footer';
COMMENT ON COLUMN public.tenants.website IS 'Company website URL';
