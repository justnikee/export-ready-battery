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
    ADD COLUMN IF NOT EXISTS pli_compliant BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS domestic_value_add FLOAT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cell_source TEXT CHECK (cell_source IS NULL OR cell_source IN ('IMPORTED', 'DOMESTIC')),
    ADD COLUMN IF NOT EXISTS materials JSONB;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.batches.market_region IS 'Target market: INDIA (Battery Aadhaar), EU (Battery Passport), or GLOBAL';
COMMENT ON COLUMN public.batches.pli_compliant IS 'India PLI subsidy eligibility';
COMMENT ON COLUMN public.batches.domestic_value_add IS 'Percentage of domestic value addition (India)';
COMMENT ON COLUMN public.batches.cell_source IS 'Cell origin: IMPORTED or DOMESTIC (India)';
COMMENT ON COLUMN public.batches.materials IS 'Material composition for EU compliance (Cobalt, Lithium, Nickel, Lead %)';

-- 4. Update passports status to include new lifecycle states
-- First check current constraint and recreate if needed
ALTER TABLE public.passports DROP CONSTRAINT IF EXISTS passports_status_check;
ALTER TABLE public.passports ADD CONSTRAINT passports_status_check 
    CHECK (status IN ('ACTIVE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'));

-- 5. Ensure serial_number can accommodate BPAN format (21 chars: IN-NKY-LFP-2026-00001)
-- VARCHAR(50) should be sufficient, but let's verify the column type
-- (Most PostgreSQL text columns are unlimited, so this is just documentation)
COMMENT ON COLUMN public.passports.serial_number IS 'Serial number. India BPAN format: IN-[MFG]-[CHEM]-[YEAR]-[SEQ] (21 chars)';

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
