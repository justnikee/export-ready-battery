-- Migration 088: Supplier Risk Profiles
--
-- Stores auto-computed + manual-override risk scores for each supplier.
-- Lower overall_score is better (0 = lowest risk, 100 = highest risk).

CREATE TABLE IF NOT EXISTS supplier_risk_profiles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    overall_score       int NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
    country_risk_tier   int NOT NULL DEFAULT 1 CHECK (country_risk_tier BETWEEN 1 AND 4),
    mineral_risk_flags  text[] NOT NULL DEFAULT '{}',
    rmap_valid          boolean,
    last_audit_date     date,
    next_audit_due      date,
    computed_at         timestamptz NOT NULL DEFAULT NOW(),
    created_at          timestamptz NOT NULL DEFAULT NOW(),
    updated_at          timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(supplier_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_risk_profiles_tenant
    ON supplier_risk_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_risk_profiles_score
    ON supplier_risk_profiles(overall_score);
