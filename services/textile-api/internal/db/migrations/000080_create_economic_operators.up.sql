-- Migration: Create economic operators table for EU textile DPP
-- ESPR Art. 9 requires identification of every economic operator placing the product on the EU market.

CREATE TABLE IF NOT EXISTS public.economic_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    operator_type VARCHAR(30) NOT NULL CHECK (operator_type IN (
        'MANUFACTURER', 'IMPORTER', 'DISTRIBUTOR', 'EU_REPRESENTATIVE',
        'AUTHORIZED_REPRESENTATIVE', 'FULFILMENT_SERVICE_PROVIDER'
    )),
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    vat_number VARCHAR(50),
    eori_number VARCHAR(20),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    website TEXT,
    gln VARCHAR(13),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.economic_operators IS 'Economic operators involved in placing textile products on the EU market (ESPR Art. 9)';
COMMENT ON COLUMN public.economic_operators.operator_type IS 'Role: MANUFACTURER, IMPORTER, DISTRIBUTOR, EU_REPRESENTATIVE, AUTHORIZED_REPRESENTATIVE, FULFILMENT_SERVICE_PROVIDER';
COMMENT ON COLUMN public.economic_operators.gln IS 'GS1 Global Location Number for facility identification';

CREATE INDEX IF NOT EXISTS idx_economic_operators_tenant_id ON public.economic_operators(tenant_id);
CREATE INDEX IF NOT EXISTS idx_economic_operators_type ON public.economic_operators(tenant_id, operator_type);
