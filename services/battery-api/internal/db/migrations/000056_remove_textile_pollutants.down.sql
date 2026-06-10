-- Migration: Restore Textile Pollutants (rollback)

CREATE TABLE IF NOT EXISTS public.textile_tenant_profiles (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    facility_type TEXT,
    supply_chain_tier TEXT,
    primary_markets JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_fiber_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    compliance_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Restore flat battery columns on tenants (application will ignore them)
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS epr_registration_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bis_r_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS iec_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS epr_certificate_path TEXT,
    ADD COLUMN IF NOT EXISTS bis_certificate_path TEXT,
    ADD COLUMN IF NOT EXISTS pli_certificate_path TEXT,
    ADD COLUMN IF NOT EXISTS epr_status VARCHAR(20) DEFAULT 'NOT_UPLOADED',
    ADD COLUMN IF NOT EXISTS bis_status VARCHAR(20) DEFAULT 'NOT_UPLOADED',
    ADD COLUMN IF NOT EXISTS pli_status VARCHAR(20) DEFAULT 'NOT_UPLOADED',
    ADD COLUMN IF NOT EXISTS eu_authorized_representative_name TEXT,
    ADD COLUMN IF NOT EXISTS eu_authorized_representative_address TEXT,
    ADD COLUMN IF NOT EXISTS eu_contact_email TEXT,
    ADD COLUMN IF NOT EXISTS morth_manufacturer_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS morth_factory_codes TEXT;
