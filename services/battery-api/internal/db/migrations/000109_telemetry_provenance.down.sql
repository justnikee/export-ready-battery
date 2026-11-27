-- This intentionally fails if CSV readings exist. Preserve their provenance and roll back the binary instead.
ALTER TABLE public.passport_telemetry
    ALTER COLUMN device_token_id SET NOT NULL,
    DROP CONSTRAINT passport_telemetry_one_actor,
    DROP COLUMN uploaded_by;

ALTER TABLE public.passports
    DROP COLUMN last_cycle_count_at,
    DROP COLUMN last_temperature_at,
    DROP COLUMN last_voltage_at;
