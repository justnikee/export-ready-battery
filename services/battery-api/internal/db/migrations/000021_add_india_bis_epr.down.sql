-- Rollback: Remove India compliance fields
ALTER TABLE public.batches
DROP COLUMN IF EXISTS bis_number,
DROP COLUMN IF EXISTS epr_number;
