CREATE TABLE IF NOT EXISTS public.audit_chain_alerts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    passport_id        UUID NOT NULL REFERENCES public.passports(uuid),
    detected_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_count        INTEGER NOT NULL,
    broken_at_event_id UUID REFERENCES public.passport_events(id),
    resolved_at        TIMESTAMPTZ,
    notes              TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_chain_alerts_passport_id ON public.audit_chain_alerts(passport_id);
CREATE INDEX IF NOT EXISTS idx_audit_chain_alerts_tenant_id   ON public.audit_chain_alerts(tenant_id);
