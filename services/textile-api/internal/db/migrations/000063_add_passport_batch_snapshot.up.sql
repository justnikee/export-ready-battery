-- Migration 063: Add missing batch_snapshot column to passports
-- The column was defined in migration 024 but was not present in the database,
-- likely because migration 024 was modified after it had already been applied.

ALTER TABLE public.passports
    ADD COLUMN IF NOT EXISTS batch_snapshot JSONB;

COMMENT ON COLUMN public.passports.batch_snapshot IS 'Immutable snapshot of batch data at passport creation';
