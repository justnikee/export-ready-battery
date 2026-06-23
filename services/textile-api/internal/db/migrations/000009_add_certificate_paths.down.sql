-- Rollback: Remove Certificate Paths from Tenants

ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS epr_certificate_path,
    DROP COLUMN IF EXISTS bis_certificate_path,
    DROP COLUMN IF EXISTS pli_certificate_path;
