-- Migration 099: Drop duplicate tier column from tenants table.
--

ALTER TABLE public.tenants DROP COLUMN IF EXISTS tier;
