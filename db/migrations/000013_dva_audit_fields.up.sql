-- PLI/DVA Audit Compliance Fields
-- Adds support for CA-audited DVA values to reduce legal liability

ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS dva_source VARCHAR(20) DEFAULT 'ESTIMATED',
ADD COLUMN IF NOT EXISTS audited_domestic_value_add DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS pli_certificate_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN batches.dva_source IS 'Source of DVA value: ESTIMATED (calculated) or AUDITED (CA-certified)';
COMMENT ON COLUMN batches.audited_domestic_value_add IS 'CA-certified Domestic Value Add percentage (nullable)';
COMMENT ON COLUMN batches.pli_certificate_url IS 'URL/path to uploaded CA certificate for PLI verification';

-- Add constraint to validate dva_source values
ALTER TABLE batches ADD CONSTRAINT chk_dva_source 
CHECK (dva_source IS NULL OR dva_source IN ('ESTIMATED', 'AUDITED'));
