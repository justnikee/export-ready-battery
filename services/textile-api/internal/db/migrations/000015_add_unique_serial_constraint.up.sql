-- Add unique constraint for serial_number within a batch
-- This prevents accidental or malicious duplicate serial number injection

-- Create a unique index on (batch_id, serial_number) for passports
-- This ensures serial numbers are unique within each batch
CREATE UNIQUE INDEX IF NOT EXISTS idx_passports_batch_serial_unique 
ON passports (batch_id, serial_number);

-- Add a comment for documentation
COMMENT ON INDEX idx_passports_batch_serial_unique IS 'Ensures unique serial numbers within each batch';
