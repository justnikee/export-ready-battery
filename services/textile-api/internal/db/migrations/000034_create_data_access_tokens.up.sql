CREATE TABLE IF NOT EXISTS data_access_tokens (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    grantee_name VARCHAR(255) NOT NULL,
    grantee_org VARCHAR(255),
    access_tier VARCHAR(20) NOT NULL CHECK (access_tier IN ('PARTNER', 'REGULATOR')),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_access_tokens_tenant ON data_access_tokens(tenant_id);
CREATE INDEX idx_data_access_tokens_hash ON data_access_tokens(token_hash);
