-- components: hierarchical BOM table for EU Battery Regulation Art 77 cell-level disclosure
CREATE TABLE IF NOT EXISTS components (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id            uuid REFERENCES batches(id) ON DELETE SET NULL,
    parent_id           uuid REFERENCES components(id) ON DELETE CASCADE,

    -- Hierarchy
    component_type      text NOT NULL CHECK (component_type IN ('cell', 'module', 'pack', 'subsystem')),
    hierarchy_level     int NOT NULL DEFAULT 0,
    name                text NOT NULL,
    model_number        text,

    -- Identification
    serial_number       text,
    lot_number          text,
    date_of_manufacture date,

    -- Manufacturer
    manufacturer        text,
    manufacturer_address text,
    manufacturer_email  text,
    country_of_origin   text,

    -- Chemistry & Materials (per-component for EU Art 77)
    chemistry           text CHECK (chemistry IN ('LFP', 'NMC', 'NCA', 'LeadAcid', 'SolidState', 'NaIon', 'Other')),
    cobalt_pct          numeric CHECK (cobalt_pct >= 0 AND cobalt_pct <= 100),
    lithium_pct         numeric CHECK (lithium_pct >= 0 AND lithium_pct <= 100),
    nickel_pct          numeric CHECK (nickel_pct >= 0 AND nickel_pct <= 100),
    manganese_pct       numeric CHECK (manganese_pct >= 0 AND manganese_pct <= 100),
    graphite_pct        numeric CHECK (graphite_pct >= 0 AND graphite_pct <= 100),
    lead_pct            numeric CHECK (lead_pct >= 0 AND lead_pct <= 100),

    -- Recycled content (EU Art 8)
    recycled_cobalt_pct  numeric CHECK (recycled_cobalt_pct >= 0 AND recycled_cobalt_pct <= 100),
    recycled_lithium_pct numeric CHECK (recycled_lithium_pct >= 0 AND recycled_lithium_pct <= 100),
    recycled_nickel_pct  numeric CHECK (recycled_nickel_pct >= 0 AND recycled_nickel_pct <= 100),
    recycled_lead_pct    numeric CHECK (recycled_lead_pct >= 0 AND recycled_lead_pct <= 100),

    -- Physical
    weight_kg           numeric CHECK (weight_kg >= 0),
    dimensions_mm       text,

    -- Compliance
    ce_marking          boolean NOT NULL DEFAULT false,
    bis_number          text,

    -- Hazardous substances
    hazardous_lead      boolean NOT NULL DEFAULT false,
    hazardous_mercury   boolean NOT NULL DEFAULT false,
    hazardous_cadmium   boolean NOT NULL DEFAULT false,

    created_at          timestamptz NOT NULL DEFAULT NOW(),
    updated_at          timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_components_tenant ON components(tenant_id);
CREATE INDEX idx_components_batch ON components(batch_id);
CREATE INDEX idx_components_parent ON components(parent_id);
CREATE INDEX idx_components_type ON components(component_type);
CREATE INDEX idx_components_hierarchy ON components(hierarchy_level);

-- Recursive CTE support for tree traversal
CREATE INDEX idx_components_batch_type ON components(batch_id, component_type);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_component_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_component_timestamp
    BEFORE UPDATE ON components
    FOR EACH ROW
    EXECUTE FUNCTION update_component_timestamp();
