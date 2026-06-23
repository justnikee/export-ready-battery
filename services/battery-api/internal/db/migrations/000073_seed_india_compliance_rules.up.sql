-- Migration 073: Seed India compliance rules for DB-driven rule engine
--
-- Moves India-specific thresholds from hard-coded Go constants into the
-- compliance_rules table so non-engineers can update them.

INSERT INTO compliance_rules (product_type, market_region, rule_key, rule_type, threshold_value, error_message, required, effective_from, effective_until, version)
VALUES
    -- BWMR 2022 recovery targets
    ('battery', 'india', 'recovery_portable_pct',     'threshold', 90.0, 'Portable battery recovery target not met (BWMR 2022: ≥90% from FY 2026-27)', true, '2025-01-01', NULL, 1),
    ('battery', 'india', 'recovery_ev_pct',           'threshold', 90.0, 'EV battery recovery target not met (BWMR 2022: ≥90% from FY 2026-27)', true, '2025-01-01', NULL, 1),
    ('battery', 'india', 'recovery_automotive_pct',   'threshold', 60.0, 'Automotive battery recovery target not met (BWMR 2022: ≥60% from FY 2026-27)', true, '2025-01-01', NULL, 1),
    ('battery', 'india', 'recovery_industrial_pct',   'threshold', 60.0, 'Industrial battery recovery target not met (BWMR 2022: ≥60% from FY 2026-27)', true, '2025-01-01', NULL, 1),
    -- BWMR recycled content mandates (phased 2027-28 to 2030-31)
    ('battery', 'india', 'recycled_content_min_pct',  'threshold',  5.0, 'Recycled content below BWMR minimum (≥5% from FY 2027-28)', true, '2027-04-01', '2028-03-31', 1),
    ('battery', 'india', 'recycled_content_min_pct',  'threshold', 10.0, 'Recycled content below BWMR minimum (≥10% from FY 2028-29)', true, '2028-04-01', '2029-03-31', 2),
    ('battery', 'india', 'recycled_content_min_pct',  'threshold', 15.0, 'Recycled content below BWMR minimum (≥15% from FY 2029-30)', true, '2029-04-01', '2030-03-31', 3),
    ('battery', 'india', 'recycled_content_min_pct',  'threshold', 20.0, 'Recycled content below BWMR minimum (≥20% from FY 2030-31)', true, '2030-04-01', NULL, 4),
    -- PLI Phase II DVA threshold
    ('battery', 'india', 'pli_dva_min_pct',           'threshold', 50.0, 'Domestic Value Add below PLI Phase II threshold (≥50%)', true, '2025-01-01', NULL, 1)
ON CONFLICT (product_type, market_region, rule_key, version) WHERE effective_until IS NULL
DO NOTHING;
