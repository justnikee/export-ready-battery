-- Migration 089: Due Diligence Assessments (OECD 5-Step)
--
-- Tracks OECD due diligence progress per supplier.
-- Steps: policy → identify → assess → respond → audit

CREATE TABLE IF NOT EXISTS due_diligence_assessments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id            uuid REFERENCES batches(id) ON DELETE SET NULL,
    step                text NOT NULL CHECK (step IN ('policy','identify','assess','respond','audit')),
    status              text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','complete','failed')),
    evidence_docs       uuid[] NOT NULL DEFAULT '{}',
    completed_by        uuid REFERENCES users(id),
    completed_at        timestamptz,
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT NOW(),
    updated_at          timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dd_assessments_supplier
    ON due_diligence_assessments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_dd_assessments_tenant
    ON due_diligence_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dd_assessments_status
    ON due_diligence_assessments(status);
