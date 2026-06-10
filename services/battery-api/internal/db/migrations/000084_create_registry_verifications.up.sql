-- Migration 084: External Registry Verifications
--
-- Stores verification results from external registries (BIS, CPCB, EU NANDO, UN38.3 labs).
-- Each batch can have multiple verifications — one per registry type.
-- Results are cached and expire after a configurable TTL.

CREATE TABLE IF NOT EXISTS registry_verifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id        uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    registry_type   text NOT NULL CHECK (registry_type IN ('bis','cpcb','eu_nando','un38_3','custom')),
    certificate_no  text,           -- The certificate/registration number being verified
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed','error','not_found')),
    trust_tier      text NOT NULL DEFAULT 'self_declared' CHECK (trust_tier IN ('self_declared','registry_verified','official_api')),
    verified_data   jsonb,          -- Raw response payload from registry (normalized)
    error_message   text,           -- Error details if verification failed
    verified_at     timestamptz,
    expires_at      timestamptz,    -- Cache expiry
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registry_verifications_tenant
    ON registry_verifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_registry_verifications_batch
    ON registry_verifications(batch_id);
CREATE INDEX IF NOT EXISTS idx_registry_verifications_registry
    ON registry_verifications(registry_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_registry_verifications_unique
    ON registry_verifications(batch_id, registry_type, certificate_no);
