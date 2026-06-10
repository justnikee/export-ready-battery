-- Migration 085: Compliance deadlines / regulatory milestones
--
-- Stores EU Battery Regulation and India BWMR milestone dates so the frontend
-- can display them dynamically instead of hard-coding dates in React components.
-- Admins can update these via SQL when regulatory timelines shift.

CREATE TABLE IF NOT EXISTS compliance_deadlines (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type  text NOT NULL CHECK (product_type IN ('battery', 'textile')),
    market_region text NOT NULL CHECK (market_region IN ('india', 'eu', 'global')),
    milestone_key text NOT NULL,      -- e.g. 'digital_passport_mandatory'
    label         text NOT NULL,      -- human-readable label
    deadline_date date NOT NULL,      -- the actual deadline
    description   text,               -- longer explanation
    url           text,               -- link to official regulation text
    version       int NOT NULL DEFAULT 1,
    created_at    timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_deadlines_unique
ON compliance_deadlines(product_type, market_region, milestone_key, version);

-- EU Battery Regulation 2023/1542 milestones
INSERT INTO compliance_deadlines (product_type, market_region, milestone_key, label, deadline_date, description, url, version)
VALUES
    ('battery', 'eu', 'digital_passport_mandatory', 'Digital Battery Passport Mandatory', '2027-02-18', 'Digital Battery Passport mandatory for EV & industrial batteries >2kWh (EU 2023/1542 Art. 77)', 'https://eur-lex.europa.eu/eli/reg/2023/1542', 1),
    ('battery', 'eu', 'carbon_footprint_label', 'Carbon Footprint Performance Class on Label', '2027-08-18', 'Carbon footprint performance class (A-G) must appear on battery label (EU 2023/1542 Art. 7)', 'https://eur-lex.europa.eu/eli/reg/2023/1542', 1),
    ('battery', 'eu', 'recycled_content_threshold', 'Recycled Content Minimum Thresholds', '2028-08-18', 'Minimum recycled content thresholds enforced: cobalt 16%, lithium 6%, nickel 6%, lead 85% (EU 2023/1542 Art. 8)', 'https://eur-lex.europa.eu/eli/reg/2023/1542', 1),
    ('battery', 'eu', 'due_diligence_policy', 'Supply Chain Due Diligence Policy', '2025-08-18', 'Economic operators must have a due diligence policy in place (EU 2023/1542 Art. 48)', 'https://eur-lex.europa.eu/eli/reg/2023/1542', 1)
ON CONFLICT (product_type, market_region, milestone_key, version)
DO NOTHING;

-- India BWMR 2022 milestones
INSERT INTO compliance_deadlines (product_type, market_region, milestone_key, label, deadline_date, description, url, version)
VALUES
    ('battery', 'india', 'epr_registration', 'EPR Registration Mandatory', '2025-04-01', 'All producers must register under EPR framework (BWMR 2022)', 'https://cpcb.nic.uk/', 1),
    ('battery', 'india', 'recovery_target_90', '90% Recovery Target', '2026-04-01', 'Portable & EV battery recovery target of 90% (BWMR 2022 Rule 6)', 'https://cpcb.nic.uk/', 1)
ON CONFLICT (product_type, market_region, milestone_key, version)
DO NOTHING;
