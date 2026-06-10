-- Migration 071: Add GTIN field for GS1 Digital Link QR code support
--
-- GS1 Digital Link requires a GTIN (Global Trade Item Number) to construct
-- interoperable QR codes like https://app.anvayalabs.in/01/{gtin}/21/{serial}

ALTER TABLE batches ADD COLUMN IF NOT EXISTS gtin text;

-- Index for fast GTIN-based passport lookups
CREATE INDEX IF NOT EXISTS idx_batches_gtin ON batches (gtin) WHERE gtin IS NOT NULL;
