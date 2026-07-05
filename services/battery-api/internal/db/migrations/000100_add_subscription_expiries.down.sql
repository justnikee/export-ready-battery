-- Migration 100: Rollback subscription columns
--

ALTER TABLE public.tenants DROP COLUMN IF EXISTS subscription_expires_at;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS plan_status;
