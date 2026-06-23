-- Migration 082: Supplier Portal — Suppliers table
--
-- Upstream suppliers (cell manufacturers, power loom operators, dye houses,
-- recyclers) invited by a tenant to submit CoCs, provenance data, and audit
-- reports directly into the platform.

CREATE TABLE IF NOT EXISTS suppliers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           text NOT NULL,
    company_name    text NOT NULL,
    contact_phone   text,
    address         text,
    country         text,
    status          text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'blocked')),
    invitation_token text UNIQUE,
    password_hash   text,
    invited_at      timestamptz NOT NULL DEFAULT NOW(),
    accepted_at     timestamptz,
    last_login_at   timestamptz,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW()
);

-- A supplier email is unique per tenant (can't invite the same supplier twice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_tenant_email
    ON suppliers(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant
    ON suppliers(tenant_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_status
    ON suppliers(status);

CREATE INDEX IF NOT EXISTS idx_suppliers_invitation_token
    ON suppliers(invitation_token);
