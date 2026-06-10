-- Migration: Carbon Calculator (Rollback)
-- Removes carbon emission factors table and carbon footprint result column

-- Remove carbon_footprint_result column from batches
ALTER TABLE public.batches DROP COLUMN IF EXISTS carbon_footprint_result;

-- Drop indexes first
DROP INDEX IF EXISTS public.idx_carbon_factors_valid_dates;
DROP INDEX IF EXISTS public.idx_carbon_factors_category_subcategory;
DROP INDEX IF EXISTS public.idx_carbon_factors_category;

-- Drop carbon_factors table
DROP TABLE IF EXISTS public.carbon_factors;
