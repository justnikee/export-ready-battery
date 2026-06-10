-- Migration: Add certificate_anchors table for blockchain timestamping
-- Stores SHA-256 hashes of certificate PDFs and OpenTimestamps proofs

CREATE TABLE IF NOT EXISTS public.certificate_anchors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    cert_type       VARCHAR(50) NOT NULL, -- 'BIS', 'UN38.3', 'IEC_62133', 'MSDS', 'DOC', 'PLI'
    file_url        TEXT NOT NULL,
    file_hash       VARCHAR(64) NOT NULL, -- SHA-256 hex
    ots_proof       TEXT,                 -- base64-encoded .ots proof (nullable until upgraded)
    bitcoin_tx_id   VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' -- 'pending', 'anchored', 'failed'
        CHECK (status IN ('pending', 'anchored', 'failed')),
    anchored_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(batch_id, cert_type)
);

CREATE INDEX IF NOT EXISTS idx_certificate_anchors_batch
    ON public.certificate_anchors(batch_id);

CREATE INDEX IF NOT EXISTS idx_certificate_anchors_tenant
    ON public.certificate_anchors(tenant_id);

CREATE INDEX IF NOT EXISTS idx_certificate_anchors_status
    ON public.certificate_anchors(status) WHERE status = 'pending';

COMMENT ON TABLE public.certificate_anchors IS 'Blockchain anchors for certificate PDFs using OpenTimestamps (Bitcoin)';
COMMENT ON COLUMN public.certificate_anchors.file_hash IS 'SHA-256 of the certificate PDF — anyone can verify the file matches this hash';
COMMENT ON COLUMN public.certificate_anchors.ots_proof IS 'OpenTimestamps proof file (base64). Verifies the hash was committed to Bitcoin at anchored_at.';
