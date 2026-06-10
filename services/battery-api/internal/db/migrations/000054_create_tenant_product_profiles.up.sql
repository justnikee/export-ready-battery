CREATE TABLE IF NOT EXISTS public.battery_tenant_profiles (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    epr_registration_number VARCHAR(100),
    bis_r_number VARCHAR(50),
    iec_code VARCHAR(20),
    eu_authorized_representative_name TEXT,
    eu_authorized_representative_address TEXT,
    eu_contact_email TEXT,
    morth_manufacturer_code VARCHAR(100),
    morth_factory_codes TEXT,
    epr_certificate_path TEXT,
    bis_certificate_path TEXT,
    pli_certificate_path TEXT,
    epr_status TEXT NOT NULL DEFAULT 'NOT_UPLOADED',
    bis_status TEXT NOT NULL DEFAULT 'NOT_UPLOADED',
    pli_status TEXT NOT NULL DEFAULT 'NOT_UPLOADED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
WHERE COALESCE(t.product_type, 'BATTERY') = 'BATTERY'
   OR NULLIF(t.epr_registration_number, '') IS NOT NULL
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
ON CONFLICT (tenant_id) DO NOTHING;

COMMENT ON TABLE public.battery_tenant_profiles IS 'Battery-only tenant profile and compliance data separated from shared tenant identity fields.';
COMMENT ON TABLE public.textile_tenant_profiles IS 'Textile-only tenant profile data separated from shared tenant identity fields.';