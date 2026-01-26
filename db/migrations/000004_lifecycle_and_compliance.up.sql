-- Migration: 000004_lifecycle_and_compliance
-- Adds passport lifecycle fields and compliance improvements

-- ============================================================================
-- PASSPORT LIFECYCLE FIELDS
-- ============================================================================

-- Add lifecycle timestamp fields to passports
ALTER TABLE passports ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE passports ADD COLUMN IF NOT EXISTS installed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE passports ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;

-- Add State of Health (EU Battery Regulation requirement)
-- Stored as literal percentage: 95.5 means 95.5%
ALTER TABLE passports ADD COLUMN IF NOT EXISTS state_of_health DECIMAL(5,2) DEFAULT 100.00;

-- Add owner tracking for supply chain transparency
ALTER TABLE passports ADD COLUMN IF NOT EXISTS owner_id UUID;

-- ============================================================================
-- PASSPORT EVENTS TABLE (if not exists from previous migration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS passport_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES passports(uuid) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    actor VARCHAR(255) NOT NULL DEFAULT 'system',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast event lookup by passport
CREATE INDEX IF NOT EXISTS idx_passport_events_passport_id ON passport_events(passport_id);
CREATE INDEX IF NOT EXISTS idx_passport_events_created_at ON passport_events(created_at);
CREATE INDEX IF NOT EXISTS idx_passport_events_event_type ON passport_events(event_type);

-- ============================================================================
-- BATCH INDIA COMPLIANCE FIELDS
-- ============================================================================

-- Add HSN code for India customs
ALTER TABLE batches ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20);

-- ============================================================================
-- UPDATE EXISTING PASSPORTS TO NEW STATUS
-- ============================================================================

-- Migrate ACTIVE status to CREATED for consistency
UPDATE passports SET status = 'CREATED' WHERE status = 'ACTIVE';

-- ============================================================================
-- CREATE INITIAL EVENTS FOR EXISTING PASSPORTS
-- ============================================================================

-- Insert a CREATED event for all existing passports that don't have one
INSERT INTO passport_events (passport_id, event_type, actor, metadata, created_at)
SELECT uuid, 'CREATED', 'migration', '{"note": "Initial event from migration 000004"}', created_at
FROM passports p
WHERE NOT EXISTS (
    SELECT 1 FROM passport_events pe 
    WHERE pe.passport_id = p.uuid AND pe.event_type = 'CREATED'
);

-- Add comment for documentation
COMMENT ON COLUMN passports.state_of_health IS 'Battery State of Health (0-100). Stored as literal percentage: 95.5 = 95.5%';
COMMENT ON COLUMN passports.shipped_at IS 'Timestamp when battery was shipped from factory';
COMMENT ON COLUMN passports.installed_at IS 'Timestamp when battery was installed in device/vehicle';
COMMENT ON COLUMN passports.returned_at IS 'Timestamp when battery was returned for warranty/recycling';
COMMENT ON COLUMN batches.hsn_code IS 'Harmonized System Nomenclature code for India customs (e.g., 8507.60)';
