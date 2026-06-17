-- Migration: Add India Compliance Fields
-- For BWM Rules 2022 and BIS Safety Standards

-- ============================================================================
-- TENANTS: Add regulatory identity fields
-- ============================================================================

-- EPR Registration Number (CPCB Pollution Control Board ID)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS epr_registration_number VARCHAR(100);

COMMENT ON COLUMN public.tenants.epr_registration_number IS 'CPCB EPR registration number for Battery Waste Management Rules 2022 (e.g., B-29016/2024-25/CPCB)';

-- BIS R-Number (Bureau of Indian Standards CRS Registration)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS bis_r_number VARCHAR(50);

COMMENT ON COLUMN public.tenants.bis_r_number IS 'BIS CRS registration number for IS 16046 safety standards (e.g., R-41001234)';

-- IEC Code (Import Export Code - Required for importers only)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS iec_code VARCHAR(20);

COMMENT ON COLUMN public.tenants.iec_code IS '10-digit Import Export Code issued by DGFT (required for importers)';

-- ============================================================================
-- BATCHES: Add import/customs data fields
-- ============================================================================

-- Country of Origin (Source country for imported materials)
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS country_of_origin VARCHAR(100);

COMMENT ON COLUMN public.batches.country_of_origin IS 'Country of origin for imported materials (e.g., China, South Korea, Japan)';

-- ============================================================================
-- INDEXES for faster compliance queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_epr ON public.tenants(epr_registration_number) WHERE epr_registration_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batches_country_origin ON public.batches(country_of_origin) WHERE country_of_origin IS NOT NULL;
