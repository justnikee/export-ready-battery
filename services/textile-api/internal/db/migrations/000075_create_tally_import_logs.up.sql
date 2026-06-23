CREATE TABLE IF NOT EXISTS tally_import_logs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         uuid NOT NULL REFERENCES tenants(id),
    file_name         text NOT NULL,
    status            text NOT NULL CHECK (status IN ('success', 'error')),
    error_message     text,
    vouchers_count    int NOT NULL DEFAULT 0,
    stock_items_count int NOT NULL DEFAULT 0,
    created_lot_id    uuid REFERENCES textile_lots(id),
    created_at        timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tally_import_logs_tenant ON tally_import_logs(tenant_id);
CREATE INDEX idx_tally_import_logs_created_at ON tally_import_logs(created_at DESC);
