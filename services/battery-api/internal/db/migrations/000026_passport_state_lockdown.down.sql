-- Migration Rollback: Passport State Model Lockdown
-- Canonical lifecycle remains enforced (no rollback to non-canonical states)
-- Date: 2026-02-07

ALTER TABLE public.passports DROP CONSTRAINT IF EXISTS passports_status_check;
ALTER TABLE public.passports ADD CONSTRAINT passports_status_check
    CHECK (status IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'));
