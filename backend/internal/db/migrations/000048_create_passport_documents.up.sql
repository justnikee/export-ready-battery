CREATE TABLE IF NOT EXISTS public.passport_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    passport_id     UUID NOT NULL REFERENCES public.passports(uuid) ON DELETE CASCADE,
    event_id        UUID REFERENCES public.passport_events(id),  -- linked event (nullable until attached)
    filename        TEXT NOT NULL,
    content_type    TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL,
    sha256_hash     TEXT NOT NULL,
    storage_path    TEXT NOT NULL,  -- local path or S3 key
    label           TEXT,           -- e.g. "Bill of Lading", "Recycling Certificate"
    uploaded_by     TEXT NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_documents_passport_id ON public.passport_documents(passport_id);
CREATE INDEX IF NOT EXISTS idx_passport_documents_event_id    ON public.passport_documents(event_id);
CREATE INDEX IF NOT EXISTS idx_passport_documents_tenant_id   ON public.passport_documents(tenant_id);
