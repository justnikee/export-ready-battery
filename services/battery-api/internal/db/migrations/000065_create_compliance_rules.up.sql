-- Migration 065: Database-driven compliance rule engine (v1)
--
-- Problem: All compliance thresholds are hard-coded in Go. Regulatory updates
-- (e.g., EU recycled-content minimums escalating from 6% to 85% over 15 years)
-- require code redeployment.
--
-- Solution: Store threshold rules in PostgreSQL so non-engineers can update
-- them via SQL or an admin UI. Validators query the DB first and fall back
-- to hard-coded defaults if the table is empty.

CREATE TABLE IF NOT EXISTS compliance_rules (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type  text NOT NULL CHECK (product_type IN ('battery', 'textile')),
    market_region text NOT NULL CHECK (market_region IN ('india', 'eu', 'global')),
    rule_key      text NOT NULL,      -- e.g. 'recycled_cobalt_min_pct'
    rule_type     text NOT NULL CHECK (rule_type IN ('threshold', 'required_field', 'format_regex')),
    threshold_value numeric,          -- for threshold rules (nullable for non-threshold)
    error_message text NOT NULL,      -- human-readable message when rule fails
    required      boolean NOT NULL DEFAULT true,
    effective_from timestamptz NOT NULL DEFAULT NOW(),
    effective_until timestamptz,      -- NULL means active indefinitely
    version       int NOT NULL DEFAULT 1,
    created_at    timestamptz NOT NULL DEFAULT NOW()
);

-- Unique index: only one active version of a rule per (product, market, key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_rules_unique_active
ON compliance_rules(product_type, market_region, rule_key, version)
WHERE effective_until IS NULL;

-- Index for fast lookups by product + market
CREATE INDEX IF NOT EXISTS idx_compliance_rules_lookup
ON compliance_rules(product_type, market_region, rule_key)
WHERE effective_until IS NULL;

-- Seed with current EU recycled-content thresholds (EU Battery Regulation 2023/1542 Art. 8)
-- These are the 2030 targets. Update effective_from/effective_until to model phased escalation.
INSERT INTO compliance_rules (product_type, market_region, rule_key, rule_type, threshold_value, error_message, required, effective_from, effective_until, version)
VALUES
    ('battery', 'eu', 'recycled_cobalt_min_pct',   'threshold', 16.0, 'Recycled cobalt content below EU 2030 minimum (≥16%)', true, '2025-01-01', '2030-12-31', 1),
    ('battery', 'eu', 'recycled_lithium_min_pct',  'threshold',  6.0, 'Recycled lithium content below EU 2030 minimum (≥6%)',  true, '2025-01-01', '2030-12-31', 1),
    ('battery', 'eu', 'recycled_nickel_min_pct',   'threshold',  6.0, 'Recycled nickel content below EU 2030 minimum (≥6%)',   true, '2025-01-01', '2030-12-31', 1),
    ('battery', 'eu', 'recycled_lead_min_pct',     'threshold', 85.0, 'Recycled lead content below EU 2030 minimum (≥85%)',    true, '2025-01-01', '2030-12-31', 1)
ON CONFLICT (product_type, market_region, rule_key, version) WHERE effective_until IS NULL
DO NOTHING;

-- Seed with 2035 escalated targets (future rules, not yet active)
INSERT INTO compliance_rules (product_type, market_region, rule_key, rule_type, threshold_value, error_message, required, effective_from, effective_until, version)
VALUES
    ('battery', 'eu', 'recycled_cobalt_min_pct',   'threshold', 26.0, 'Recycled cobalt content below EU 2035 minimum (≥26%)', true, '2031-01-01', NULL, 2),
    ('battery', 'eu', 'recycled_lithium_min_pct',  'threshold', 12.0, 'Recycled lithium content below EU 2035 minimum (≥12%)', true, '2031-01-01', NULL, 2),
    ('battery', 'eu', 'recycled_nickel_min_pct',   'threshold', 15.0, 'Recycled nickel content below EU 2035 minimum (≥15%)', true, '2031-01-01', NULL, 2),
    ('battery', 'eu', 'recycled_lead_min_pct',     'threshold', 85.0, 'Recycled lead content below EU 2035 minimum (≥85%)',   true, '2031-01-01', NULL, 2)
ON CONFLICT (product_type, market_region, rule_key, version) WHERE effective_until IS NULL
DO NOTHING;
