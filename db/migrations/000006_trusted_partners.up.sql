-- Migration: 000006_trusted_partners
-- Adds trusted partner verification for magic link authentication

-- ============================================================================
-- TRUSTED PARTNERS (Tier A - Auto-Approved)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trusted_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    email_domain VARCHAR(100) NOT NULL,  -- e.g., "greenrecycler.eu", "mechanic-shop.de"
    role VARCHAR(20) NOT NULL,           -- TECHNICIAN, RECYCLER, LOGISTICS
    contact_email VARCHAR(255),          -- Primary contact
    contact_phone VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one domain per tenant per role
    CONSTRAINT unique_trusted_partner UNIQUE (tenant_id, email_domain, role)
);

-- Index for fast domain lookups
CREATE INDEX IF NOT EXISTS idx_trusted_partners_domain ON trusted_partners(email_domain);
CREATE INDEX IF NOT EXISTS idx_trusted_partners_tenant ON trusted_partners(tenant_id);

-- ============================================================================
-- PARTNER CODES (Tier B - Shared Secret for Unknown Emails)
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,           -- e.g., "INSTALL-2026" or "RCY-PARTNER-XYZ"
    role VARCHAR(20) NOT NULL,           -- What role this code grants
    description VARCHAR(255),            -- "Q1 2026 Installation Partners"
    max_uses INT,                        -- NULL = unlimited
    current_uses INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = never expires
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Unique code per tenant
    CONSTRAINT unique_partner_code UNIQUE (tenant_id, code)
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_partner_codes_code ON partner_codes(code);
CREATE INDEX IF NOT EXISTS idx_partner_codes_tenant ON partner_codes(tenant_id);

-- ============================================================================
-- PARTNER CODE USAGE LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_code_id UUID NOT NULL REFERENCES partner_codes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    passport_id UUID REFERENCES passports(uuid),
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_code_usage_code ON partner_code_usage(partner_code_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trusted_partners IS 'Pre-registered partner domains that auto-approve magic link requests';
COMMENT ON TABLE partner_codes IS 'Shared secret codes for unknown email domains (Tier B verification)';
COMMENT ON COLUMN trusted_partners.email_domain IS 'Email domain to match, e.g., recycler.eu matches any @recycler.eu email';
COMMENT ON COLUMN partner_codes.code IS 'Human-readable code shared with partners, e.g., INSTALL-2026';
