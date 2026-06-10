-- Rollback: Remove batch_snapshot column from passports

ALTER TABLE public.passports
    DROP COLUMN IF EXISTS batch_snapshot;
