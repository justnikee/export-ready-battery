-- Migration: India BWM Rules 2022 — EPR Obligation Ledger
-- Tracks producer annual EPR obligation (batteries placed on market in kg)
-- vs fulfillment through recycling/refurbishment.

CREATE TABLE IF NOT EXISTS public.epr_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Obligation period (India financial year: Apr-Mar)
    financial_year VARCHAR(9) NOT NULL, -- e.g. "2025-26"

    -- Battery categories under obligation
    battery_category VARCHAR(50) NOT NULL, -- EV, PORTABLE, INDUSTRIAL, AUTOMOTIVE

    -- Obligation calculation (batteries placed on market)
    obligation_kg DECIMAL(15, 2) NOT NULL DEFAULT 0,
    batteries_placed_count INTEGER NOT NULL DEFAULT 0,

    -- Fulfillment via recycling
    fulfilled_via_recycling_kg DECIMAL(15, 2) NOT NULL DEFAULT 0,
    fulfilled_via_refurbishment_kg DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- Carry-forward from previous year (BWM allows up to 20% avg carry-forward)
    carried_forward_kg DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- Net obligation after carry-forward
    net_obligation_kg DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- Remaining shortfall (if any)
    shortfall_kg DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- Environmental Compensation charged on shortfall
    ecc_amount_inr DECIMAL(15, 2) DEFAULT 0,
    ecc_status VARCHAR(20) DEFAULT 'NOT_APPLICABLE'
        CHECK (ecc_status IN ('NOT_APPLICABLE', 'PENDING', 'PAID', 'WAIVED')),

    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'FILED', 'AUDITED', 'CLOSED')),

    -- CPCB portal reference
    cpcb_return_reference VARCHAR(100),
    cpcb_filed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One obligation record per tenant + year + category
    UNIQUE(tenant_id, financial_year, battery_category)
);

CREATE INDEX IF NOT EXISTS idx_epr_obligations_tenant
    ON public.epr_obligations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_epr_obligations_year
    ON public.epr_obligations(financial_year);
CREATE INDEX IF NOT EXISTS idx_epr_obligations_status
    ON public.epr_obligations(status);

COMMENT ON TABLE public.epr_obligations IS 'India BWM Rules 2022: Annual EPR obligation tracking per tenant, financial year, and battery category';
COMMENT ON COLUMN public.epr_obligations.obligation_kg IS 'Total battery weight (kg) placed on market by producer in the financial year';
COMMENT ON COLUMN public.epr_obligations.fulfilled_via_recycling_kg IS 'Weight (kg) fulfilled through authorized recycling';
COMMENT ON COLUMN public.epr_obligations.fulfilled_via_refurbishment_kg IS 'Weight (kg) fulfilled through authorized refurbishment (2025 amendment)';
COMMENT ON COLUMN public.epr_obligations.carried_forward_kg IS 'Excess fulfillment carried forward from previous compliance cycle (max 20% of avg per BWM Rules)';
COMMENT ON COLUMN public.epr_obligations.ecc_amount_inr IS 'Environmental Compensation Charge levied by CPCB for shortfall';
