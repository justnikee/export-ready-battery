-- Migration: Carbon Calculator (Textile)
-- Creates carbon emission factors table for textile carbon footprint calculations

CREATE TABLE IF NOT EXISTS public.carbon_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    factor_value DECIMAL(10,4) NOT NULL,
    unit TEXT NOT NULL,
    source TEXT NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carbon_factors_category ON public.carbon_factors(category);
CREATE INDEX IF NOT EXISTS idx_carbon_factors_category_subcategory ON public.carbon_factors(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_carbon_factors_valid_dates ON public.carbon_factors(valid_from, valid_to);

-- Seed basic energy mix factors (used by textile calculator)
INSERT INTO public.carbon_factors (category, subcategory, factor_value, unit, source, valid_from, notes) VALUES
    ('ENERGY_MIX', 'CN', 0.5550, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'China grid average'),
    ('ENERGY_MIX', 'IN', 0.7080, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'India grid average'),
    ('ENERGY_MIX', 'DE', 0.3500, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Germany grid average'),
    ('ENERGY_MIX', 'FR', 0.0560, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'France grid average'),
    ('ENERGY_MIX', 'US', 0.3800, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'US grid average'),
    ('ENERGY_MIX', 'GLOBAL', 0.4820, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Global weighted average');
