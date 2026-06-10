-- EPR Certificate Ledger for India BWM Rules 2022 (amended 2025)
-- Tracks certificates purchased from registered recyclers against EPR obligation

CREATE TABLE IF NOT EXISTS epr_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Certificate details
    certificate_number VARCHAR(100) NOT NULL,
    recycler_name VARCHAR(255) NOT NULL,
    recycler_epr_id VARCHAR(100),

    -- Quantity & classification
    weight_kg NUMERIC(10,2) NOT NULL,
    battery_type VARCHAR(50),

    -- Validity
    financial_year VARCHAR(7) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE,

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    retired_at TIMESTAMP WITH TIME ZONE,

    -- Document proof
    document_path TEXT,

    -- Audit
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_epr_certs_tenant ON epr_certificates(tenant_id);
CREATE INDEX idx_epr_certs_fy ON epr_certificates(tenant_id, financial_year);
CREATE INDEX idx_epr_certs_status ON epr_certificates(tenant_id, status);

COMMENT ON TABLE epr_certificates IS 'EPR certificates purchased from registered recyclers (India BWM Rules 2022)';
COMMENT ON COLUMN epr_certificates.financial_year IS 'Indian financial year e.g. 2025-26';
COMMENT ON COLUMN epr_certificates.weight_kg IS 'Weight in kg covered by this certificate';
COMMENT ON COLUMN epr_certificates.status IS 'ACTIVE, RETIRED, EXPIRED, REJECTED';
