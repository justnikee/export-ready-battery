-- Migration 064: Add soft-delete support to passports and protect audit trail
--
-- Problem: ON DELETE CASCADE on passport_events.passport_id destroys the entire
-- audit trail when a passport is deleted. This violates every compliance standard
-- (SOC 2, ISO 27001, EU Battery Regulation Art 78, 21 CFR Part 11).
--
-- Solution:
--   1. Add deleted_at to passports → enables soft-delete
--   2. Drop CASCADE on passport_events FK → events survive passport deletion
--   3. Add index for efficient filtering of non-deleted passports

-- 1. Add soft-delete column
ALTER TABLE public.passports
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.passports.deleted_at IS 'Soft-delete timestamp; NULL = active record';

-- 2. Index for fast queries of active passports
CREATE INDEX IF NOT EXISTS idx_passports_deleted_at_null
    ON public.passports(deleted_at)
    WHERE deleted_at IS NULL;

-- 3. Change FK from CASCADE to SET NULL so events survive passport deletion
ALTER TABLE public.passport_events
    DROP CONSTRAINT IF EXISTS passport_events_passport_id_fkey;

ALTER TABLE public.passport_events
    ADD CONSTRAINT passport_events_passport_id_fkey
    FOREIGN KEY (passport_id) REFERENCES public.passports(id)
    ON DELETE SET NULL;
