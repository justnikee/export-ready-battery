-- Down Migration: Remove Organization Details from Tenants

ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS address,
    DROP COLUMN IF EXISTS logo_url,
    DROP COLUMN IF EXISTS support_email,
    DROP COLUMN IF EXISTS website;
