-- Migration 072: Mass balance accounting for recycled content (EU Battery Regulation Annex VIII)
--
-- Book-and-claim tracking allows recycled material to be allocated across products
-- without requiring physical segregation at every supply chain step.

CREATE TABLE IF NOT EXISTS mass_balance_ledgers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id),
    material_type   text NOT NULL CHECK (material_type IN ('cobalt', 'lithium', 'nickel', 'lead')),
    -- Incoming recycled material from certified recyclers
    incoming_kg     numeric NOT NULL DEFAULT 0,
    incoming_source text, -- e.g. recycler EPR ID, ISCC certificate number
    -- Outgoing allocated to batteries
    allocated_kg    numeric NOT NULL DEFAULT 0,
    -- Remaining balance
    balance_kg      numeric NOT NULL DEFAULT 0,
    -- Audit trail
    certificate_url text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW()
);

-- Index for fast per-tenant, per-material balance lookups
CREATE INDEX IF NOT EXISTS idx_mass_balance_lookup
ON mass_balance_ledgers(tenant_id, material_type)
WHERE balance_kg > 0;

-- Allocation records link specific batteries to mass balance claims
CREATE TABLE IF NOT EXISTS mass_balance_allocations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id       uuid NOT NULL REFERENCES mass_balance_ledgers(id),
    batch_id        uuid NOT NULL REFERENCES batches(id),
    passport_id     uuid REFERENCES passports(uuid),
    material_type   text NOT NULL CHECK (material_type IN ('cobalt', 'lithium', 'nickel', 'lead')),
    allocated_kg    numeric NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mass_balance_allocations_batch
ON mass_balance_allocations(batch_id, material_type);

CREATE INDEX IF NOT EXISTS idx_mass_balance_allocations_ledger
ON mass_balance_allocations(ledger_id);
