-- Migration: Add missing DVA and PLI columns to batches
-- These columns are referenced in ListBatches query but were never created

ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS dva_source TEXT,
    ADD COLUMN IF NOT EXISTS pli_certificate_url TEXT;

COMMENT ON COLUMN public.batches.dva_source IS 'Source/evidence for Domestic Value Add calculation';
COMMENT ON COLUMN public.batches.pli_certificate_url IS 'URL to PLI (Production Linked Incentive) certificate';
