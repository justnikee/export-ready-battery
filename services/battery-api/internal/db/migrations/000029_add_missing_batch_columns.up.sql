-- Migration: Add missing batch columns (hsn_code, bis_number, epr_number)
-- These columns are referenced in batch.go but were never created via migration

ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS bis_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS epr_number VARCHAR(100);

COMMENT ON COLUMN public.batches.hsn_code IS 'Harmonized System Nomenclature code for customs classification (e.g., "8507.60")';
COMMENT ON COLUMN public.batches.bis_number IS 'BIS R-Number for India market compliance (e.g., "R-12345678")';
COMMENT ON COLUMN public.batches.epr_number IS 'EPR Registration Number for India market (e.g., "B-29016/2024-25/CPCB")';
