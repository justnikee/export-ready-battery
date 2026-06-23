CREATE TABLE IF NOT EXISTS public.tenant_alerts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    alert_type    VARCHAR(50) NOT NULL, -- 'CERTIFICATE_EXPIRY', 'COMPLIANCE_DEGRADED', 'QUOTA_LOW'
    severity      VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'CRITICAL'
    title         TEXT NOT NULL,
    message       TEXT NOT NULL,
    resource_type VARCHAR(50),           -- 'BATCH', 'PASSPORT', 'TENANT'
    resource_id   UUID,
    read_at       TIMESTAMPTZ,
    emailed_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_alerts_tenant ON public.tenant_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_alerts_unread ON public.tenant_alerts(tenant_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_alerts_created ON public.tenant_alerts(created_at DESC);

COMMENT ON TABLE public.tenant_alerts IS 'Proactive compliance and expiry alerts for tenants';
