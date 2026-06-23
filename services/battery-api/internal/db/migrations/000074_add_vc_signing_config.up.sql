-- Migration 074: VC signing configuration scaffold
--
-- The platform currently uses a single platform DID derived from the
-- VC_SIGNING_KEY environment variable. A tenant_dids table is provided
-- for future per-tenant DID support.

CREATE TABLE IF NOT EXISTS tenant_dids (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           uuid NOT NULL REFERENCES tenants(id),
    did                 text NOT NULL,
    public_key_multibase text,
    created_at          timestamptz NOT NULL DEFAULT NOW(),
    updated_at          timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, did)
);

CREATE INDEX IF NOT EXISTS idx_tenant_dids_tenant_id ON tenant_dids(tenant_id);
