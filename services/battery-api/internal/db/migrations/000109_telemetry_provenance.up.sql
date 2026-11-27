-- Track whether a device or a user recorded telemetry and preserve the most recent value per field.
ALTER TABLE public.passport_telemetry
    ALTER COLUMN device_token_id DROP NOT NULL,
    ADD COLUMN uploaded_by uuid REFERENCES public.users(id),
    ADD CONSTRAINT passport_telemetry_one_actor CHECK (num_nonnulls(device_token_id, uploaded_by) = 1);

ALTER TABLE public.passports
    ADD COLUMN last_cycle_count_at timestamptz,
    ADD COLUMN last_temperature_at timestamptz,
    ADD COLUMN last_voltage_at timestamptz;

-- Establish a conservative floor for projections written before field-specific clocks.
UPDATE public.passports SET
    last_cycle_count_at = CASE WHEN cycle_count IS NOT NULL THEN last_telemetry_at END,
    last_temperature_at = CASE WHEN last_temperature IS NOT NULL THEN last_telemetry_at END,
    last_voltage_at = CASE WHEN last_voltage IS NOT NULL THEN last_telemetry_at END
WHERE last_telemetry_at IS NOT NULL;
