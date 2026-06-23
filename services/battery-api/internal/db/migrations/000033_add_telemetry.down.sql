-- Rollback Phase 2.1: BMS Telemetry

ALTER TABLE passports DROP COLUMN IF EXISTS cycle_count;
ALTER TABLE passports DROP COLUMN IF EXISTS last_temperature;
ALTER TABLE passports DROP COLUMN IF EXISTS last_voltage;
ALTER TABLE passports DROP COLUMN IF EXISTS thermal_event_count;
ALTER TABLE passports DROP COLUMN IF EXISTS last_telemetry_at;

DROP TABLE IF EXISTS passport_telemetry;
DROP TABLE IF EXISTS device_tokens;
