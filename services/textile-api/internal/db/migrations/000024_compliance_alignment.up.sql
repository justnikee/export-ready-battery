-- Migration: Compliance Alignment (Design System)
-- Adds missing fields, audit columns, and partner/magic-link tables to match compliance requirements.

-- ============================================================================
-- TENANTS: EU Authorized Representative Fields
-- ============================================================================

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS eu_authorized_representative_name TEXT,
    ADD COLUMN IF NOT EXISTS eu_authorized_representative_address TEXT,
    ADD COLUMN IF NOT EXISTS eu_contact_email TEXT;

COMMENT ON COLUMN public.tenants.eu_authorized_representative_name IS 'EU authorized representative name/company';
COMMENT ON COLUMN public.tenants.eu_authorized_representative_address IS 'EU authorized representative address';
COMMENT ON COLUMN public.tenants.eu_contact_email IS 'EU compliance contact email';

-- ============================================================================
-- BATCHES: Manufacturing Identity Fields
-- ============================================================================

ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS model_name TEXT,
    ADD COLUMN IF NOT EXISTS manufacturing_start_date DATE,
    ADD COLUMN IF NOT EXISTS manufacturing_end_date DATE;

COMMENT ON COLUMN public.batches.model_name IS 'Product model name for the batch';
COMMENT ON COLUMN public.batches.manufacturing_start_date IS 'Manufacturing start date for the batch';
COMMENT ON COLUMN public.batches.manufacturing_end_date IS 'Manufacturing end date for the batch';

-- ============================================================================
-- PASSPORTS: Compliance + Lifecycle Fields
-- ============================================================================

ALTER TABLE public.passports
    ADD COLUMN IF NOT EXISTS batch_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS current_owner_identifier TEXT,
    ADD COLUMN IF NOT EXISTS current_owner_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS owner_id UUID,
    ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS recycled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS state_of_health DECIMAL(5,2) DEFAULT 100.00,
    ADD COLUMN IF NOT EXISTS last_soh_update_timestamp TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ownership_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS repair_events JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS replacement_events JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS recycling_status TEXT,
    ADD COLUMN IF NOT EXISTS recycler_epr_id TEXT,
    ADD COLUMN IF NOT EXISTS recycling_date DATE;

COMMENT ON COLUMN public.passports.batch_snapshot IS 'Immutable snapshot of batch data at passport creation';
COMMENT ON COLUMN public.passports.current_owner_identifier IS 'Current owner identifier (email or external ID)';
COMMENT ON COLUMN public.passports.state_of_health IS 'Battery State of Health (0-100). Stored as literal percentage';
COMMENT ON COLUMN public.passports.last_soh_update_timestamp IS 'Timestamp of last SoH update';
COMMENT ON COLUMN public.passports.ownership_history IS 'Ownership history for EU compliance';
COMMENT ON COLUMN public.passports.repair_events IS 'Repair events history for EU compliance';
COMMENT ON COLUMN public.passports.replacement_events IS 'Replacement events history for EU compliance';
COMMENT ON COLUMN public.passports.recycling_status IS 'India-specific recycling status';
COMMENT ON COLUMN public.passports.recycler_epr_id IS 'India-specific recycler EPR ID';
COMMENT ON COLUMN public.passports.recycling_date IS 'India-specific recycling date';

-- ============================================================================
-- PASSPORT EVENTS: Audit Columns
-- ============================================================================

ALTER TABLE public.passport_events
    ADD COLUMN IF NOT EXISTS actor_type TEXT,
    ADD COLUMN IF NOT EXISTS actor_identifier TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT,
    ADD COLUMN IF NOT EXISTS status_from VARCHAR(50),
    ADD COLUMN IF NOT EXISTS status_to VARCHAR(50),
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

COMMENT ON COLUMN public.passport_events.actor_type IS 'SYSTEM | USER | PARTNER';
COMMENT ON COLUMN public.passport_events.actor_identifier IS 'Actor identifier (email or system)';
COMMENT ON COLUMN public.passport_events.source IS 'INTERNAL | MAGIC_LINK | API';
COMMENT ON COLUMN public.passport_events.status_from IS 'Previous status';
COMMENT ON COLUMN public.passport_events.status_to IS 'New status';
COMMENT ON COLUMN public.passport_events.ip_address IS 'IP address of the actor';

-- ============================================================================
-- TRUSTED PARTNERS (Tier A) + PARTNER CODES (Tier B)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trusted_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    email_domain VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(30),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trusted_partners_tenant ON public.trusted_partners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trusted_partners_domain ON public.trusted_partners(email_domain);

CREATE TABLE IF NOT EXISTS public.partner_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL,
    description TEXT,
    max_uses INT,
    current_uses INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_codes_tenant ON public.partner_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_codes_code ON public.partner_codes(code);

CREATE TABLE IF NOT EXISTS public.partner_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_code_id UUID NOT NULL REFERENCES public.partner_codes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    passport_id UUID REFERENCES public.passports(uuid) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_code_usage_code ON public.partner_code_usage(partner_code_id);

-- ============================================================================
-- MAGIC LINK TOKENS (Audit/Revocation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES public.passports(uuid) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_passport_id ON public.magic_link_tokens(passport_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON public.magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON public.magic_link_tokens(expires_at);
