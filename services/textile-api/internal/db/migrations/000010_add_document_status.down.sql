-- Rollback: Remove Document Verification Status columns

ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS epr_status,
    DROP COLUMN IF EXISTS bis_status,
    DROP COLUMN IF EXISTS pli_status;
