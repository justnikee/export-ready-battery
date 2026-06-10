-- Migration: Remove Textile Pollutants from Battery Database
-- Phase 1 of DB-per-service cleanup.
-- Removes all textile-specific tables and columns that don't belong in the battery API.

-- ============================================================================
-- SAFETY: Sync any remaining flat-column data to battery_tenant_profiles
-- before dropping. This catches tenants created between migration 054 and now.
-- ============================================================================

INSERT INTO public.battery_tenant_profiles (
    tenant_id,
    epr_registration_number,
    bis_r_number,
    iec_code,
    eu_authorized_representative_name,
    eu_authorized_representative_address,
    eu_contact_email,
    morth_manufacturer_code,
    morth_factory_codes,
    epr_certificate_path,
    bis_certificate_path,
    pli_certificate_path,
    epr_status,
    bis_status,
    pli_status,
    created_at,
    updated_at
)
SELECT
    t.id,
    NULLIF(t.epr_registration_number, ''),
    NULLIF(t.bis_r_number, ''),
    NULLIF(t.iec_code, ''),
    NULLIF(t.eu_authorized_representative_name, ''),
    NULLIF(t.eu_authorized_representative_address, ''),
    NULLIF(t.eu_contact_email, ''),
    NULLIF(t.morth_manufacturer_code, ''),
    NULLIF(t.morth_factory_codes, ''),
    NULLIF(t.epr_certificate_path, ''),
    NULLIF(t.bis_certificate_path, ''),
    NULLIF(t.pli_certificate_path, ''),
    COALESCE(NULLIF(t.epr_status, ''), 'NOT_UPLOADED'),
    COALESCE(NULLIF(t.bis_status, ''), 'NOT_UPLOADED'),
    COALESCE(NULLIF(t.pli_status, ''), 'NOT_UPLOADED'),
    NOW(),
    NOW()
FROM public.tenants t
LEFT JOIN public.battery_tenant_profiles bp ON bp.tenant_id = t.id
WHERE bp.tenant_id IS NULL
   AND (
       NULLIF(t.epr_registration_number, '') IS NOT NULL
    OR NULLIF(t.bis_r_number, '') IS NOT NULL
    OR NULLIF(t.iec_code, '') IS NOT NULL
    OR NULLIF(t.eu_authorized_representative_name, '') IS NOT NULL
    OR NULLIF(t.eu_authorized_representative_address, '') IS NOT NULL
    OR NULLIF(t.eu_contact_email, '') IS NOT NULL
    OR NULLIF(t.morth_manufacturer_code, '') IS NOT NULL
    OR NULLIF(t.morth_factory_codes, '') IS NOT NULL
    OR NULLIF(t.epr_certificate_path, '') IS NOT NULL
    OR NULLIF(t.bis_certificate_path, '') IS NOT NULL
    OR NULLIF(t.pli_certificate_path, '') IS NOT NULL
   )
ON CONFLICT (tenant_id) DO UPDATE SET
    epr_registration_number = EXCLUDED.epr_registration_number,
    bis_r_number = EXCLUDED.bis_r_number,
    iec_code = EXCLUDED.iec_code,
    eu_authorized_representative_name = EXCLUDED.eu_authorized_representative_name,
    eu_authorized_representative_address = EXCLUDED.eu_authorized_representative_address,
    eu_contact_email = EXCLUDED.eu_contact_email,
    morth_manufacturer_code = EXCLUDED.morth_manufacturer_code,
    morth_factory_codes = EXCLUDED.morth_factory_codes,
    epr_certificate_path = EXCLUDED.epr_certificate_path,
    bis_certificate_path = EXCLUDED.bis_certificate_path,
    pli_certificate_path = EXCLUDED.pli_certificate_path,
    epr_status = EXCLUDED.epr_status,
    bis_status = EXCLUDED.bis_status,
    pli_status = EXCLUDED.pli_status,
    updated_at = NOW();

-- ============================================================================
-- DROP TEXTILE TABLES
-- ============================================================================

DROP TABLE IF EXISTS public.textile_tenant_profiles;

-- ============================================================================
-- DROP FLAT BATTERY COLUMNS FROM tenants (now in battery_tenant_profiles)
-- ============================================================================

ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS epr_registration_number,
    DROP COLUMN IF EXISTS bis_r_number,
    DROP COLUMN IF EXISTS iec_code,
    DROP COLUMN IF EXISTS epr_certificate_path,
    DROP COLUMN IF EXISTS bis_certificate_path,
    DROP COLUMN IF EXISTS pli_certificate_path,
    DROP COLUMN IF EXISTS epr_status,
    DROP COLUMN IF EXISTS bis_status,
    DROP COLUMN IF EXISTS pli_status,
    DROP COLUMN IF EXISTS eu_authorized_representative_name,
    DROP COLUMN IF EXISTS eu_authorized_representative_address,
    DROP COLUMN IF EXISTS eu_contact_email,
    DROP COLUMN IF EXISTS morth_manufacturer_code,
    DROP COLUMN IF EXISTS morth_factory_codes;
