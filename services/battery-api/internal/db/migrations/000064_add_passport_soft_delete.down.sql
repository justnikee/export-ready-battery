-- Migration 064 DOWN: Revert soft-delete support
--
-- WARNING: This restores CASCADE delete, which will erase audit trail events
-- if a passport is deleted. Only run this during a full rollback.

-- 1. Restore CASCADE (will delete orphaned events on next passport deletion)
ALTER TABLE public.passport_events
    DROP CONSTRAINT IF EXISTS passport_events_passport_id_fkey;

ALTER TABLE public.passport_events
    ADD CONSTRAINT passport_events_passport_id_fkey
    FOREIGN KEY (passport_id) REFERENCES public.passports(id)
    ON DELETE CASCADE;

-- 2. Drop index
DROP INDEX IF EXISTS idx_passports_deleted_at_null;

-- 3. Drop soft-delete column
ALTER TABLE public.passports
    DROP COLUMN IF EXISTS deleted_at;
