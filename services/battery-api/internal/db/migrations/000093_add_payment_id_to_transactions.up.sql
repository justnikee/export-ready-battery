-- Migration: Add payment_id to transactions for Razorpay idempotency
-- Allows a webhook/verify retry for the same payment to be detected and skipped.

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

COMMENT ON COLUMN public.transactions.payment_id IS 'Razorpay payment ID, set for purchase transactions to enforce idempotent quota crediting';

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_payment_id
ON public.transactions(payment_id)
WHERE payment_id IS NOT NULL;
