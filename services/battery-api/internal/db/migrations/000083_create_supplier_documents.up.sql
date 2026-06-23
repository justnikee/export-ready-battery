-- Migration 083: Supplier Portal — Supplier Documents table
--
-- Certificates of Conformance (CoC), audit reports, provenance declarations,
-- and other upstream documentation submitted by suppliers for tenant review.

CREATE TABLE IF NOT EXISTS supplier_documents (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id     uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id        uuid REFERENCES batches(id) ON DELETE SET NULL,
    component_id    uuid REFERENCES components(id) ON DELETE SET NULL,
    doc_type        text NOT NULL CHECK (doc_type IN ('coc', 'audit_report', 'provenance', 'msds', 'test_report', 'other')),
    file_url        text NOT NULL,
    file_name       text,
    file_size       int,
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_notes  text,
    reviewed_by     uuid,
    reviewed_at     timestamptz,
    uploaded_at     timestamptz NOT NULL DEFAULT NOW(),
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_docs_supplier
    ON supplier_documents(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_docs_tenant
    ON supplier_documents(tenant_id);

CREATE INDEX IF NOT EXISTS idx_supplier_docs_batch
    ON supplier_documents(batch_id);

CREATE INDEX IF NOT EXISTS idx_supplier_docs_status
    ON supplier_documents(status);
