-- dgft_scheme_configs: static configuration for Indian export incentive schemes
CREATE TABLE IF NOT EXISTS dgft_scheme_configs (
    scheme_type         text PRIMARY KEY,
    name                text NOT NULL,
    description         text,
    required_documents  text[] NOT NULL DEFAULT '{}',
    calculation_method  text NOT NULL CHECK (calculation_method IN ('percentage_of_fob', 'fixed_per_unit', 'interest_subvention')),
    default_rate        numeric NOT NULL DEFAULT 0,
    is_active           boolean NOT NULL DEFAULT true,
    help_url            text,
    created_at          timestamptz NOT NULL DEFAULT NOW(),
    updated_at          timestamptz NOT NULL DEFAULT NOW()
);

-- Seed real DGFT schemes
INSERT INTO dgft_scheme_configs (scheme_type, name, description, required_documents, calculation_method, default_rate, is_active, help_url)
VALUES
    ('RODTEP', 'RoDTEP', 'Remission of Duties and Taxes on Exported Products. Refunds embedded central, state, and local duties/taxes on inputs used in export production.', ARRAY['shipping_bill', 'ebrc', 'invoice', 'packing_list', 'bill_of_lading'], 'percentage_of_fob', 1.5, true, 'https://www.dgft.gov.in/rodtep'),
    ('INTEREST_EQUALIZATION', 'Interest Equalization Scheme', 'Subsidized interest rate on pre- and post-shipment rupee export credit for MSME manufacturers. Banks pass benefit upfront; claim via RBI.', ARRAY['sanction_letter', 'interest_certificate', 'export_invoice', 'shipping_bill', 'iec_certificate'], 'interest_subvention', 2.75, true, 'https://www.dgft.gov.in/interest-equalization'),
    ('DUTY_DRAWBACK', 'Duty Drawback', 'Refund of customs and central excise duties on inputs used in exported products. All Industry Rate (AIR) or brand rate.', ARRAY['shipping_bill', 'ebrc', 'invoice', 'packing_list', 'duty_drawback_declaration'], 'percentage_of_fob', 1.2, true, 'https://www.dgft.gov.in/duty-drawback')
ON CONFLICT (scheme_type) DO NOTHING;
