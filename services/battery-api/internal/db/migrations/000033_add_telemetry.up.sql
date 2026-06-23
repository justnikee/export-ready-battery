-- ============================================================================
-- Phase 2.1: BMS Telemetry — Device Tokens + Telemetry Readings
-- ============================================================================

-- Device tokens for BMS/IoT authentication
CREATE TABLE IF NOT EXISTS device_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    token_hash  VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hex
    name        VARCHAR(255) NOT NULL,         -- Human-readable label (e.g., "Factory BMS Line 1")
    batch_id    UUID REFERENCES batches(id),   -- Optional: lock token to specific batch
    permissions VARCHAR(50) NOT NULL DEFAULT 'write',  -- 'write' | 'read_write'
    is_active   BOOLEAN NOT NULL DEFAULT true,
    rate_limit  INT NOT NULL DEFAULT 60,       -- Requests per minute
    expires_at  TIMESTAMPTZ,                   -- NULL = never expires
    last_used_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_device_tokens_tenant ON device_tokens(tenant_id);
CREATE INDEX idx_device_tokens_hash ON device_tokens(token_hash) WHERE is_active = true;

-- Telemetry readings (time-series)
CREATE TABLE IF NOT EXISTS passport_telemetry (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id     UUID NOT NULL REFERENCES passports(uuid),
    device_token_id UUID NOT NULL REFERENCES device_tokens(id),
    
    -- Core BMS readings
    state_of_health  DOUBLE PRECISION,           -- 0-100 %
    cycle_count      INT,                         -- Total charge/discharge cycles
    temperature      DOUBLE PRECISION,            -- Celsius
    voltage          DOUBLE PRECISION,            -- Volts
    current          DOUBLE PRECISION,            -- Amps (positive=charging, negative=discharging)
    
    -- Thermal events
    thermal_event    BOOLEAN NOT NULL DEFAULT false,
    thermal_type     VARCHAR(50),                 -- 'OVERHEAT' | 'THERMAL_RUNAWAY_WARNING' | 'COOLING_FAILURE'
    
    -- Metadata
    source           VARCHAR(100),                -- Device identifier / BMS firmware version
    recorded_at      TIMESTAMPTZ NOT NULL,        -- When reading was taken on device
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- When received by server
);

CREATE INDEX idx_telemetry_passport_time ON passport_telemetry(passport_id, recorded_at DESC);
CREATE INDEX idx_telemetry_recorded ON passport_telemetry(recorded_at DESC);
CREATE INDEX idx_telemetry_thermal ON passport_telemetry(passport_id) WHERE thermal_event = true;

-- Add dynamic telemetry summary columns to passports
ALTER TABLE passports ADD COLUMN IF NOT EXISTS cycle_count INT;
ALTER TABLE passports ADD COLUMN IF NOT EXISTS last_temperature DOUBLE PRECISION;
ALTER TABLE passports ADD COLUMN IF NOT EXISTS last_voltage DOUBLE PRECISION;
ALTER TABLE passports ADD COLUMN IF NOT EXISTS thermal_event_count INT NOT NULL DEFAULT 0;
ALTER TABLE passports ADD COLUMN IF NOT EXISTS last_telemetry_at TIMESTAMPTZ;
