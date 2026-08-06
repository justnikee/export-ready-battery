-- S-12: Per-regulator API credentials with tenant/market scopes + access audit.
-- Replaces sole reliance on a single global REGULATOR_API_KEY env secret.
-- Empty tenant_ids / markets arrays mean "all" (explicit platform-wide scope).

CREATE TABLE IF NOT EXISTS regulator_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL DEFAULT '',
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    tenant_ids UUID[] NOT NULL DEFAULT '{}',
    markets TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulator_api_keys_hash
    ON regulator_api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_regulator_api_keys_active
    ON regulator_api_keys(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS regulator_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID REFERENCES regulator_api_keys(id) ON DELETE SET NULL,
    key_source VARCHAR(32) NOT NULL,
    key_name VARCHAR(255) NOT NULL DEFAULT '',
    passport_id UUID,
    tenant_id UUID,
    market_region VARCHAR(32) NOT NULL DEFAULT '',
    client_ip VARCHAR(64) NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    outcome VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulator_access_log_created
    ON regulator_access_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_regulator_access_log_key
    ON regulator_access_log(key_id, created_at DESC);
