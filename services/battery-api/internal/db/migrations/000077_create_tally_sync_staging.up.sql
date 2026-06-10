CREATE TABLE IF NOT EXISTS tally_sync_staging (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sync_run_id     uuid,
    source_type     text NOT NULL CHECK (source_type IN ('stock_item', 'voucher')),
    tally_name      text NOT NULL,
    tally_parent    text,
    tally_qty       numeric,
    tally_rate      numeric,
    tally_amount    numeric,
    tally_gst       numeric,
    tally_hsn       text,
    tally_party     text,
    detected_category text,
    detected_chemistry text,
    raw_xml         text,
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'discarded')),
    applied_batch_id uuid REFERENCES batches(id),
    applied_at      timestamptz,
    discarded_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tally_sync_staging_tenant ON tally_sync_staging(tenant_id);
CREATE INDEX idx_tally_sync_staging_status ON tally_sync_staging(status);
CREATE INDEX idx_tally_sync_staging_created_at ON tally_sync_staging(created_at DESC);
