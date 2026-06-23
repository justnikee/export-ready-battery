-- Migration: Add AI parsing jobs table and tenant subscription tier
-- This supports the Phase 0 AI-powered batch creation infrastructure

-- 1. Add subscription tier to tenants for feature gating
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free'
        CHECK (tier IN ('free', 'pro', 'enterprise'));

COMMENT ON COLUMN public.tenants.tier IS 'Subscription tier for AI feature access: free, pro, enterprise';

-- 2. Create AI parsing jobs table for tracking usage + billing
CREATE TABLE IF NOT EXISTS public.ai_parsing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
        'DATASHEET_PARSE',
        'NL_CREATE',
        'COMPLIANCE_CHECK',
        'DOC_GENERATE',
        'BENCHMARK_COMPARE'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED'
    )),
    input_metadata JSONB,
    result_data JSONB,
    confidence_score DECIMAL(5,2),
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_parsing_jobs_tenant
    ON public.ai_parsing_jobs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_parsing_jobs_status
    ON public.ai_parsing_jobs(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_parsing_jobs_type
    ON public.ai_parsing_jobs(tenant_id, job_type, created_at DESC);

COMMENT ON TABLE public.ai_parsing_jobs IS 'Tracks AI-powered parsing and generation jobs per tenant for usage billing and audit';
