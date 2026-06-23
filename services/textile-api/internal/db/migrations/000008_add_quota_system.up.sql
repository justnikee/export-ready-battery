-- Migration: Add Quota System
-- Implements Factory Slot monetization: 1 Batch Activation = 1 Quota Unit

-- ============================================================================
-- TENANTS: Add quota balance
-- ============================================================================

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS quota_balance INTEGER DEFAULT 2;

COMMENT ON COLUMN public.tenants.quota_balance IS 'Number of batch activation slots available. Default: 2 free activations.';

-- ============================================================================
-- BATCHES: Add status column (DRAFT -> ACTIVE -> ARCHIVED)
-- ============================================================================

ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'DRAFT';

COMMENT ON COLUMN public.batches.status IS 'Batch lifecycle: DRAFT (data entry), ACTIVE (downloads enabled), ARCHIVED';

-- Update existing batches to ACTIVE (they were created before quota system)
UPDATE public.batches SET status = 'ACTIVE' WHERE status IS NULL OR status = 'DRAFT';

-- ============================================================================
-- TRANSACTIONS: Quota usage ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quota_change INTEGER NOT NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.transactions IS 'Quota transaction ledger for batch activations and top-ups';

CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON public.transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
