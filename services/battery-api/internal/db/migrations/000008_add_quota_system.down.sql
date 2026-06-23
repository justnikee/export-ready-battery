-- Rollback: Remove Quota System

DROP TABLE IF EXISTS public.transactions;

ALTER TABLE public.batches DROP COLUMN IF EXISTS status;

ALTER TABLE public.tenants DROP COLUMN IF EXISTS quota_balance;
