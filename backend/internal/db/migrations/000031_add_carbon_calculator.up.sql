-- Migration: Carbon Calculator (EU Battery Regulation 2023/1542)
-- Creates carbon emission factors table and adds carbon footprint result column
-- Reference: COMPLIANCE_IMPLEMENTATION_PLAN.md section 1.1

-- ============================================================================
-- CARBON EMISSION FACTORS (JRC-aligned lookup table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.carbon_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,              -- 'CELL_CHEMISTRY', 'TRANSPORT', 'ENERGY_MIX', 'ASSEMBLY'
    subcategory TEXT NOT NULL,           -- 'LFP', 'NMC_811', 'SHIP', 'CHINA', etc.
    factor_value DECIMAL(10,4) NOT NULL, -- kgCO2e per unit
    unit TEXT NOT NULL,                  -- 'kgCO2e/kWh', 'kgCO2e/tonne-km', etc.
    source TEXT NOT NULL,                -- 'JRC_2024', 'IEA_2025'
    valid_from DATE NOT NULL,
    valid_to DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carbon_factors_category ON public.carbon_factors(category);
CREATE INDEX IF NOT EXISTS idx_carbon_factors_category_subcategory ON public.carbon_factors(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_carbon_factors_valid_dates ON public.carbon_factors(valid_from, valid_to);

COMMENT ON TABLE public.carbon_factors IS 'JRC-aligned carbon emission factors for EU Battery Regulation compliance';
COMMENT ON COLUMN public.carbon_factors.category IS 'Factor category: CELL_CHEMISTRY, TRANSPORT, ENERGY_MIX, ASSEMBLY';
COMMENT ON COLUMN public.carbon_factors.subcategory IS 'Specific factor type within category';
COMMENT ON COLUMN public.carbon_factors.factor_value IS 'Emission factor value in kgCO2e per unit';
COMMENT ON COLUMN public.carbon_factors.unit IS 'Unit of measurement for the factor';
COMMENT ON COLUMN public.carbon_factors.source IS 'Data source reference (JRC_2024, IEA_2025, etc.)';
COMMENT ON COLUMN public.carbon_factors.valid_from IS 'Date from which this factor is valid';
COMMENT ON COLUMN public.carbon_factors.valid_to IS 'Date until which this factor is valid (NULL if currently valid)';

-- ============================================================================
-- SEED JRC-ALIGNED CARBON FACTORS
-- ============================================================================

-- Cell Chemistry Factors (kgCO2e/kWh battery capacity)
INSERT INTO public.carbon_factors (category, subcategory, factor_value, unit, source, valid_from, notes) VALUES
    ('CELL_CHEMISTRY', 'LFP', 12.0000, 'kgCO2e/kWh', 'JRC_2024', '2024-01-01', 'Lithium Iron Phosphate - Lower energy density but longer cycle life'),
    ('CELL_CHEMISTRY', 'NMC_622', 18.5000, 'kgCO2e/kWh', 'JRC_2024', '2024-01-01', 'Nickel Manganese Cobalt 6:2:2 ratio'),
    ('CELL_CHEMISTRY', 'NMC_811', 16.0000, 'kgCO2e/kWh', 'JRC_2024', '2024-01-01', 'Nickel Manganese Cobalt 8:1:1 ratio - Higher nickel content'),
    ('CELL_CHEMISTRY', 'NCA', 17.5000, 'kgCO2e/kWh', 'JRC_2024', '2024-01-01', 'Nickel Cobalt Aluminum - Common in EV applications'),
    ('CELL_CHEMISTRY', 'LCO', 22.0000, 'kgCO2e/kWh', 'JRC_2024', '2024-01-01', 'Lithium Cobalt Oxide - Primarily consumer electronics'),
    ('CELL_CHEMISTRY', 'SODIUM', 8.5000, 'kgCO2e/kWh', 'JRC_2024', '2024-01-01', 'Sodium-ion - Emerging technology with lower footprint');

-- Transport Factors (kgCO2e/tonne-km)
INSERT INTO public.carbon_factors (category, subcategory, factor_value, unit, source, valid_from, notes) VALUES
    ('TRANSPORT', 'SHIP', 0.0150, 'kgCO2e/tonne-km', 'JRC_2024', '2024-01-01', 'Ocean freight - Average container ship'),
    ('TRANSPORT', 'RAIL', 0.0280, 'kgCO2e/tonne-km', 'JRC_2024', '2024-01-01', 'Rail freight - Average diesel-electric'),
    ('TRANSPORT', 'TRUCK', 0.0620, 'kgCO2e/tonne-km', 'JRC_2024', '2024-01-01', 'Road freight - Average heavy-duty truck'),
    ('TRANSPORT', 'AIR', 0.6020, 'kgCO2e/tonne-km', 'JRC_2024', '2024-01-01', 'Air freight - Average cargo aircraft');

-- Energy Mix Factors (kgCO2e/kWh grid electricity) - Country-specific grid averages
INSERT INTO public.carbon_factors (category, subcategory, factor_value, unit, source, valid_from, notes) VALUES
    ('ENERGY_MIX', 'CN', 0.5550, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'China grid average - Coal-dominant'),
    ('ENERGY_MIX', 'IN', 0.7080, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'India grid average - Coal-dominant'),
    ('ENERGY_MIX', 'DE', 0.3500, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Germany grid average - Mixed renewables'),
    ('ENERGY_MIX', 'FR', 0.0560, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'France grid average - Nuclear-dominant'),
    ('ENERGY_MIX', 'KR', 0.4150, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'South Korea grid average'),
    ('ENERGY_MIX', 'JP', 0.4500, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Japan grid average'),
    ('ENERGY_MIX', 'US', 0.3800, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'United States grid average'),
    ('ENERGY_MIX', 'PL', 0.7230, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Poland grid average - Coal-dominant'),
    ('ENERGY_MIX', 'SE', 0.0230, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Sweden grid average - Hydro/nuclear dominant');

-- Assembly Factors (kgCO2e/kWh pack capacity)
INSERT INTO public.carbon_factors (category, subcategory, factor_value, unit, source, valid_from, notes) VALUES
    ('ASSEMBLY', 'DEFAULT', 2.5000, 'kgCO2e/kWh', 'JRC_2024', '2024-01-01', 'Default assembly factor for battery pack integration');

-- ============================================================================
-- ADD CARBON FOOTPRINT RESULT COLUMN TO BATCHES TABLE
-- ============================================================================

ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS carbon_footprint_result JSONB;

COMMENT ON COLUMN public.batches.carbon_footprint_result IS 'Structured carbon footprint calculation result containing total kgCO2e and breakdown by category';
