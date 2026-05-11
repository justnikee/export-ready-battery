-- =============================================================================
-- AnvayaLabs v2: Product-Agnostic Architecture Migration
-- =============================================================================
-- This migration is ADDITIVE ONLY — no column drops, no data loss.
-- Existing battery data gets product_type = 'BATTERY' via DEFAULT.
-- =============================================================================

-- ============================================================================
-- 1. Add product_type and v2 columns to batches
-- ============================================================================
ALTER TABLE batches ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'BATTERY';
ALTER TABLE batches ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS compliance_score REAL DEFAULT 0;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS compliance_gaps JSONB DEFAULT '[]';

-- ============================================================================
-- 2. Add product_type and telemetry to passports
-- ============================================================================
ALTER TABLE passports ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'BATTERY';
ALTER TABLE passports ADD COLUMN IF NOT EXISTS telemetry JSONB DEFAULT NULL;

-- ============================================================================
-- 3. Schema Registry table
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    schema_json JSONB NOT NULL,
    display_config JSONB,
    compliance_fields JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_type, version)
);

-- ============================================================================
-- 4. Performance indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_batches_product_type ON batches(product_type);
CREATE INDEX IF NOT EXISTS idx_passports_product_type ON passports(product_type);
CREATE INDEX IF NOT EXISTS idx_product_schemas_type_active ON product_schemas(product_type, is_active);
CREATE INDEX IF NOT EXISTS idx_batches_compliance_score ON batches(compliance_score) WHERE compliance_score < 100;

-- ============================================================================
-- 5. RLS policy on product_schemas (tenant-independent, admin-managed)
-- ============================================================================
ALTER TABLE product_schemas ENABLE ROW LEVEL SECURITY;

-- Schemas are globally readable (needed for form rendering)
CREATE POLICY product_schemas_read_all ON product_schemas
    FOR SELECT
    USING (true);
