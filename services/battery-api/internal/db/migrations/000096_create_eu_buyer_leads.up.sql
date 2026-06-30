-- Migration 096: EU Buyer Leads
--
-- Lead capture for STRAT-06 (EU Buyer Landing Page) — EU buyers who want to
-- mandate ExportReady to their Indian suppliers. Distinct from
-- signup_requests, which is the Indian manufacturer self-signup flow and
-- requires GSTIN/IEC that an EU buyer wouldn't have.

CREATE TABLE IF NOT EXISTS eu_buyer_leads (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_company_name  text NOT NULL,
    contact_name        text NOT NULL,
    contact_email       text NOT NULL,
    country             text NOT NULL,
    indian_suppliers    text,
    message             text,
    status              text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
    created_at          timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eu_buyer_leads_status_created
    ON eu_buyer_leads(status, created_at DESC);
