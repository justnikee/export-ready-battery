-- Migration 100: Add subscription expiration and plan status columns
--

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_status varchar(50) DEFAULT 'ACTIVE' NOT NULL;
