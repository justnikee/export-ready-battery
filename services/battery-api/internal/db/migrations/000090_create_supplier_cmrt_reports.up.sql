-- Migration 090: Supplier CMRT Reports
--
-- Stores parsed CMRT/CRT Excel uploads with smelter data.

CREATE TABLE IF NOT EXISTS supplier_cmrt_reports (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reporting_year      int NOT NULL,
    file_url            text NOT NULL,
    smelters            jsonb NOT NULL DEFAULT '[]',
    unknown_smelters    int NOT NULL DEFAULT 0,
    rmi_conformant_pct  int,
    parsed_at           timestamptz,
    created_at          timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cmrt_reports_supplier
    ON supplier_cmrt_reports(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cmrt_reports_tenant
    ON supplier_cmrt_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cmrt_reports_year
    ON supplier_cmrt_reports(reporting_year);
