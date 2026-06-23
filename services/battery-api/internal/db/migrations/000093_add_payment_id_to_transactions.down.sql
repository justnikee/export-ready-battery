DROP INDEX IF EXISTS idx_transactions_payment_id;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS payment_id;
