-- Migration: Add Dual-Mode Compliance Support (India + EU Markets)
-- This migration adds market region support and related fields for Battery Aadhaar (India) and Battery Passport (EU)

-- 1. Create market_region ENUM type
DO $$ BEGIN
    CREATE TYPE market_region AS ENUM ('INDIA', 'EU', 'GLOBAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add new columns to batches table
ALTER TABLE public.batches 
    ADD COLUMN IF NOT EXISTS market_region market_region NOT NULL DEFAULT 'GLOBAL',
    ADD COLUMN IF NOT EXISTS materials JSONB;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.batches.market_region IS 'Target market: INDIA, EU, or GLOBAL';
COMMENT ON COLUMN public.batches.materials IS 'Product-specific material composition stored as JSONB';

-- 4. Update passports status to include new lifecycle states
-- First check current constraint and recreate if needed
ALTER TABLE public.passports DROP CONSTRAINT IF EXISTS passports_status_check;
ALTER TABLE public.passports ADD CONSTRAINT passports_status_check 
    CHECK (status IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE')) NOT VALID;

-- 5. Ensure serial_number can accommodate BPAN format
-- VARCHAR(50) should be sufficient, but let's verify the column type
-- (Most PostgreSQL text columns are unlimited, so this is just documentation)
COMMENT ON COLUMN public.passports.serial_number IS 'Serial number. India format example: IN-[REG]-[PROFILE]-[YEAR]-[SEQ]';

-- 6. Create passport_events table for immutable lifecycle logging
CREATE TABLE IF NOT EXISTS public.passport_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES public.passports(uuid) ON DELETE CASCADE,
    event_type TEXT NOT NULL,  -- 'CREATED', 'STATUS_CHANGED', 'SCANNED', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'
    actor TEXT,                -- Who triggered: 'system', user email, API client, etc.
    metadata JSONB,            -- Additional context (old_status, new_status, reason, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create indexes for passport_events
CREATE INDEX IF NOT EXISTS idx_passport_events_passport_id ON public.passport_events(passport_id);
CREATE INDEX IF NOT EXISTS idx_passport_events_event_type ON public.passport_events(event_type);
CREATE INDEX IF NOT EXISTS idx_passport_events_created_at ON public.passport_events(created_at DESC);

-- 8. Add comments to passport_events
COMMENT ON TABLE public.passport_events IS 'Immutable audit log for passport lifecycle events';
COMMENT ON COLUMN public.passport_events.event_type IS 'Event type: CREATED, STATUS_CHANGED, SCANNED, RECALLED, RECYCLED, END_OF_LIFE';
COMMENT ON COLUMN public.passport_events.actor IS 'Entity that triggered the event (system, user email, etc.)';
COMMENT ON COLUMN public.passport_events.metadata IS 'Additional context as JSON (old_status, new_status, reason, location, etc.)';

-- 9. Create index on market_region for filtering
CREATE INDEX IF NOT EXISTS idx_batches_market_region ON public.batches(market_region);
