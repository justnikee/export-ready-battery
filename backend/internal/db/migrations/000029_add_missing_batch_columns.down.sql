-- Rollback: Remove added batch columns

ALTER TABLE public.batches
    DROP COLUMN IF EXISTS hsn_code,
    DROP COLUMN IF EXISTS bis_number,
    DROP COLUMN IF EXISTS epr_number;
