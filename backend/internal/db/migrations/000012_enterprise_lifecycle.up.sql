-- Migration: Enterprise Lifecycle Engine
-- Adds trusted domains, reward ledger, enhanced passport tracking, and RETURN_REQUESTED state
-- Date: 2026-01-25

-- ============================================================================
-- 1. UPDATE PASSPORT STATUS CONSTRAINT (Add RETURN_REQUESTED)
-- ============================================================================

-- Drop old constraint and add new one with RETURN_REQUESTED
ALTER TABLE public.passports DROP CONSTRAINT IF EXISTS passports_status_check;
ALTER TABLE public.passports ADD CONSTRAINT passports_status_check 
    CHECK (status IN ('CREATED', 'SHIPPED', 'IN_SERVICE', 'RETURN_REQUESTED', 'RETURNED', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'));

COMMENT ON COLUMN public.passports.status IS 'Lifecycle status: CREATED → SHIPPED → IN_SERVICE → RETURN_REQUESTED → RETURNED → RECYCLED → END_OF_LIFE (or RECALLED at any point)';

-- ============================================================================
-- 2. PASSPORT TABLE ENHANCEMENTS
-- ============================================================================

-- Current custody tracking (who physically has this battery right now)
ALTER TABLE public.passports 
ADD COLUMN IF NOT EXISTS current_custody_email VARCHAR(255);

COMMENT ON COLUMN public.passports.current_custody_email IS 'Email of current physical custodian (logistics, technician, recycler)';

-- Geolocation history (last known positions)
ALTER TABLE public.passports 
ADD COLUMN IF NOT EXISTS geolocation_history JSONB DEFAULT '[]';

COMMENT ON COLUMN public.passports.geolocation_history IS 'Array of {lat, lng, timestamp, actor} for tracking battery movement';

-- Lifecycle timestamps as JSONB (consolidates shipped_at, installed_at, etc.)
ALTER TABLE public.passports 
ADD COLUMN IF NOT EXISTS lifecycle_timestamps JSONB DEFAULT '{}';

COMMENT ON COLUMN public.passports.lifecycle_timestamps IS 'Consolidated timestamps: {shipped, installed, return_requested, returned, recycled}';

-- ============================================================================
-- 3. PASSPORT_EVENTS TABLE ENHANCEMENTS
-- ============================================================================

-- Add IP address for audit tracking
ALTER TABLE public.passport_events 
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

COMMENT ON COLUMN public.passport_events.ip_address IS 'IPv4/IPv6 address of actor making the change';

-- Add explicit status transition columns (for easier querying)
ALTER TABLE public.passport_events 
ADD COLUMN IF NOT EXISTS status_from VARCHAR(50);

ALTER TABLE public.passport_events 
ADD COLUMN IF NOT EXISTS status_to VARCHAR(50);

COMMENT ON COLUMN public.passport_events.status_from IS 'Previous status before transition';
COMMENT ON COLUMN public.passport_events.status_to IS 'New status after transition';

-- Add index for status transition queries
CREATE INDEX IF NOT EXISTS idx_passport_events_status_transition 
ON public.passport_events(status_from, status_to);

-- ============================================================================
-- 4. TENANTS TABLE ENHANCEMENTS
-- ============================================================================

-- Partner access code (for Tier B verification of unknown email domains)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS partner_access_code VARCHAR(50);

COMMENT ON COLUMN public.tenants.partner_access_code IS 'Secret code shared with partners for Tier B magic link verification';

-- Create index for partner code lookups
CREATE INDEX IF NOT EXISTS idx_tenants_partner_code 
ON public.tenants(partner_access_code) WHERE partner_access_code IS NOT NULL;

-- ============================================================================
-- 5. TRUSTED DOMAINS TABLE (Tier A Verification)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trusted_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,  -- e.g., "tatamotors.com", "mahindra.com"
    role VARCHAR(50) NOT NULL CHECK (role IN ('LOGISTICS', 'TECHNICIAN', 'RECYCLER', 'CUSTOMER')),
    description VARCHAR(255),      -- e.g., "Tata Motors Fleet Management"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, domain)      -- Each domain unique per tenant
);

COMMENT ON TABLE public.trusted_domains IS 'Tier A trusted email domains for automatic role assignment in magic links';
COMMENT ON COLUMN public.trusted_domains.domain IS 'Email domain (lowercase, e.g., tatamotors.com)';
COMMENT ON COLUMN public.trusted_domains.role IS 'Role to assign: LOGISTICS, TECHNICIAN, RECYCLER, CUSTOMER';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_trusted_domains_tenant ON public.trusted_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trusted_domains_domain ON public.trusted_domains(domain);
CREATE INDEX IF NOT EXISTS idx_trusted_domains_active ON public.trusted_domains(tenant_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 6. REWARD LEDGER TABLE (Scan-to-Earn Gamification)
-- ============================================================================

-- Action type enum check
CREATE TABLE IF NOT EXISTS public.reward_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    passport_uuid UUID REFERENCES public.passports(uuid) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('SCAN_INSTALL', 'SCAN_RECYCLE', 'SCAN_RETURN', 'BONUS', 'REDEMPTION')),
    points_earned INT NOT NULL,  -- Can be negative for redemptions
    metadata JSONB,              -- e.g., {location, device, notes}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.reward_ledger IS 'Points ledger for scan-to-earn gamification. SCAN_INSTALL=50pts, SCAN_RECYCLE=100pts, SCAN_RETURN=20pts';
COMMENT ON COLUMN public.reward_ledger.action_type IS 'SCAN_INSTALL (50pts), SCAN_RECYCLE (100pts), SCAN_RETURN (20pts), BONUS, REDEMPTION (negative)';
COMMENT ON COLUMN public.reward_ledger.points_earned IS 'Points awarded (positive) or redeemed (negative)';

-- Indexes for analytics and balance queries
CREATE INDEX IF NOT EXISTS idx_reward_ledger_tenant ON public.reward_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_recipient ON public.reward_ledger(recipient_email);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_passport ON public.reward_ledger(passport_uuid);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_action ON public.reward_ledger(action_type);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_created ON public.reward_ledger(created_at DESC);

-- ============================================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Reward balance per user per tenant
CREATE OR REPLACE VIEW public.reward_balances AS
SELECT 
    tenant_id,
    recipient_email,
    SUM(points_earned) AS total_points,
    COUNT(*) FILTER (WHERE action_type = 'SCAN_INSTALL') AS install_count,
    COUNT(*) FILTER (WHERE action_type = 'SCAN_RECYCLE') AS recycle_count,
    COUNT(*) FILTER (WHERE action_type = 'SCAN_RETURN') AS return_count,
    MAX(created_at) AS last_activity
FROM public.reward_ledger
GROUP BY tenant_id, recipient_email;

COMMENT ON VIEW public.reward_balances IS 'Aggregated reward points per user per tenant';

-- ============================================================================
-- 8. CREATE DEFAULT POINT VALUES AS FUNCTION (for consistency)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_reward_points(action VARCHAR) 
RETURNS INT AS $$
BEGIN
    CASE action
        WHEN 'SCAN_INSTALL' THEN RETURN 50;
        WHEN 'SCAN_RECYCLE' THEN RETURN 100;
        WHEN 'SCAN_RETURN' THEN RETURN 20;
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_reward_points IS 'Returns default point values: SCAN_INSTALL=50, SCAN_RECYCLE=100, SCAN_RETURN=20';
