-- Migration: India & additional carbon factors
-- Adds India-specific assembly factor and additional ENERGY_MIX country entries
-- that are needed for India market batch calculations and broader global coverage.
--
-- Context: Migration 000031 seeded only a DEFAULT assembly factor and a single
-- India grid entry (ENERGY_MIX/IN). When a batch is assembled in India and the
-- caller does not supply an explicit AssemblyEnergyKWh value, the calculator
-- falls through to ASSEMBLY/DEFAULT (2.5 kgCO₂e/kWh), which is a generic EU
-- factory estimate.  India's grid is significantly more carbon-intensive, so
-- this migration provides a proper India-specific default.
--
-- Sources:
--   BEE_2024  — Bureau of Energy Efficiency, India Perform Achieve Trade scheme
--   IEA_2025  — IEA World Energy Outlook 2025 (grid intensity by country)
--   JRC_2024  — Joint Research Centre, EU Battery Regulation LCA methodology

-- ============================================================================
-- ASSEMBLY FACTORS — country-specific kgCO2e/kWh pack capacity
-- Used when AssemblyEnergyKWh is 0 (energy data not available).
-- ============================================================================
INSERT INTO public.carbon_factors (category, subcategory, factor_value, unit, source, valid_from, notes) VALUES
    ('ASSEMBLY', 'IN', 3.1500, 'kgCO2e/kWh', 'BEE_2024',  '2024-01-01', 'India battery assembly default — coal-heavy grid, BEE efficiency standards'),
    ('ASSEMBLY', 'CN', 3.4200, 'kgCO2e/kWh', 'IEA_2025',  '2024-01-01', 'China battery assembly default — coal-dominated grid'),
    ('ASSEMBLY', 'KR', 2.1000, 'kgCO2e/kWh', 'IEA_2025',  '2024-01-01', 'South Korea battery assembly default'),
    ('ASSEMBLY', 'DE', 1.4500, 'kgCO2e/kWh', 'JRC_2024',  '2024-01-01', 'Germany battery assembly default — mixed renewables'),
    ('ASSEMBLY', 'US', 1.5800, 'kgCO2e/kWh', 'IEA_2025',  '2024-01-01', 'United States battery assembly default'),
    ('ASSEMBLY', 'JP', 1.8700, 'kgCO2e/kWh', 'IEA_2025',  '2024-01-01', 'Japan battery assembly default');

-- ============================================================================
-- ENERGY_MIX — additional country grid intensities (kgCO2e/kWh)
-- Used for both CellSourceCountry and FactoryCountry lookups.
-- ============================================================================
INSERT INTO public.carbon_factors (category, subcategory, factor_value, unit, source, valid_from, notes) VALUES
    -- EU member states not in the original seed
    ('ENERGY_MIX', 'GB', 0.2330, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'United Kingdom grid average — growing offshore wind'),
    ('ENERGY_MIX', 'IT', 0.2750, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Italy grid average'),
    ('ENERGY_MIX', 'ES', 0.1990, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Spain grid average — significant solar and wind'),
    ('ENERGY_MIX', 'NL', 0.3060, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Netherlands grid average'),
    ('ENERGY_MIX', 'BE', 0.1560, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Belgium grid average — nuclear-significant'),
    ('ENERGY_MIX', 'AT', 0.1080, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Austria grid average — hydro-dominant'),
    ('ENERGY_MIX', 'PT', 0.2160, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Portugal grid average — wind and hydro'),
    ('ENERGY_MIX', 'HU', 0.2370, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Hungary grid average'),
    ('ENERGY_MIX', 'CZ', 0.4560, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Czech Republic grid average — coal and nuclear'),
    ('ENERGY_MIX', 'RO', 0.2900, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Romania grid average — hydro and nuclear'),
    ('ENERGY_MIX', 'SK', 0.1720, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Slovakia grid average — nuclear-dominant'),
    ('ENERGY_MIX', 'FI', 0.0760, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Finland grid average — nuclear and hydro'),
    ('ENERGY_MIX', 'DK', 0.1340, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Denmark grid average — wind-dominant'),
    ('ENERGY_MIX', 'NO', 0.0240, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Norway grid average — hydro-dominant'),
    ('ENERGY_MIX', 'CH', 0.0450, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Switzerland grid average — hydro and nuclear'),
    -- Asia-Pacific and emerging markets relevant for battery supply chains
    ('ENERGY_MIX', 'VN', 0.5980, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Vietnam grid average — coal-heavy, growing solar'),
    ('ENERGY_MIX', 'MY', 0.6010, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Malaysia grid average'),
    ('ENERGY_MIX', 'ID', 0.7320, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Indonesia grid average — coal-dominant'),
    ('ENERGY_MIX', 'TH', 0.4980, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Thailand grid average'),
    ('ENERGY_MIX', 'TW', 0.5080, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Taiwan grid average'),
    ('ENERGY_MIX', 'AU', 0.6100, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Australia grid average — coal-heavy eastern grid'),
    -- Rest of world
    ('ENERGY_MIX', 'MX', 0.4530, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Mexico grid average'),
    ('ENERGY_MIX', 'BR', 0.1080, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Brazil grid average — hydro-dominant'),
    ('ENERGY_MIX', 'ZA', 0.9080, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'South Africa grid average — coal-dominant'),
    ('ENERGY_MIX', 'TR', 0.4680, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Turkey grid average'),
    -- Global fallback for unknown countries
    ('ENERGY_MIX', 'GLOBAL', 0.4820, 'kgCO2e/kWh', 'IEA_2025', '2024-01-01', 'Global weighted average — used when country is unknown');
