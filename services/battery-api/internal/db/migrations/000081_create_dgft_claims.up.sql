-- dgft_claims: export incentive claim tracking for Indian exporters
CREATE TABLE IF NOT EXISTS dgft_claims (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id                uuid REFERENCES batches(id) ON DELETE SET NULL,

    scheme_type             text NOT NULL REFERENCES dgft_scheme_configs(scheme_type),
    status                  text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),

    claim_period_start      date NOT NULL,
    claim_period_end        date NOT NULL,

    hsn_code                text,
    destination_country     text,
    export_value_inr        numeric NOT NULL DEFAULT 0,
    export_quantity         numeric NOT NULL DEFAULT 0,

    estimated_claim_amount  numeric NOT NULL DEFAULT 0,
    approved_claim_amount   numeric,

    documents               jsonb NOT NULL DEFAULT '[]',
    generated_files         jsonb NOT NULL DEFAULT '[]',

    dgft_reference_no       text,
    notes                   text,

    created_at              timestamptz NOT NULL DEFAULT NOW(),
    updated_at              timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dgft_claims_tenant ON dgft_claims(tenant_id);
CREATE INDEX idx_dgft_claims_batch ON dgft_claims(batch_id);
CREATE INDEX idx_dgft_claims_status ON dgft_claims(status);
CREATE INDEX idx_dgft_claims_scheme ON dgft_claims(scheme_type);
CREATE INDEX idx_dgft_claims_period ON dgft_claims(claim_period_start, claim_period_end);
