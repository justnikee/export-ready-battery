-- Migration: 000005_magic_link
-- Adds Magic Link authentication support for external users

-- ============================================================================
-- ACTOR ROLE TRACKING
-- ============================================================================

-- Add actor_role column to passport_events (VARCHAR for flexibility)
ALTER TABLE passport_events ADD COLUMN IF NOT EXISTS actor_role VARCHAR(20);

-- ============================================================================
-- OWNERSHIP TRACKING
-- ============================================================================

-- Track current owner/custodian of the battery
ALTER TABLE passports ADD COLUMN IF NOT EXISTS current_owner_email VARCHAR(255);

-- Add recycled_at timestamp (separate from returned_at)
ALTER TABLE passports ADD COLUMN IF NOT EXISTS recycled_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- MAGIC LINK TOKENS TABLE (Optional - for tracking/revocation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES passports(uuid) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    token_hash VARCHAR(64) NOT NULL, -- SHA256 hash of token for verification
    used_at TIMESTAMP WITH TIME ZONE, -- When was it used (null = unused)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_passport_id ON magic_link_tokens(passport_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN passport_events.actor_role IS 'Role of the actor: MANUFACTURER, LOGISTICS, TECHNICIAN, RECYCLER, CUSTOMER';
COMMENT ON COLUMN passports.current_owner_email IS 'Email of current custodian for supply chain tracking';
COMMENT ON TABLE magic_link_tokens IS 'Tracks issued magic link tokens for audit and optional revocation';
