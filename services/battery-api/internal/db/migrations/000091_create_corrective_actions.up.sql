-- Migration 091: Corrective Actions
--
-- Tracks non-conformance remediation tickets.

CREATE TABLE IF NOT EXISTS corrective_actions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assessment_id       uuid REFERENCES due_diligence_assessments(id) ON DELETE SET NULL,
    title               text NOT NULL,
    description         text NOT NULL,
    severity            text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
    status              text NOT NULL DEFAULT 'open' CHECK (status IN ('open','remediated','verified','escalated','closed')),
    due_date            date NOT NULL,
    remediated_at       timestamptz,
    verified_by         uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corrective_actions_supplier
    ON corrective_actions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_tenant
    ON corrective_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_status
    ON corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_due_date
    ON corrective_actions(due_date);
