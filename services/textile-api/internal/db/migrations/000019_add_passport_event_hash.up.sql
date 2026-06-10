-- Migration: Add hash column to passport_events for tamper-proof audit trail
-- This implements cryptographic chaining where each event hash includes the previous hash

-- Add hash column for tamper-proof audit trail
ALTER TABLE passport_events
ADD COLUMN hash VARCHAR(64);

-- Add previous_hash column for blockchain-style chaining
ALTER TABLE passport_events
ADD COLUMN previous_hash VARCHAR(64);

-- Create index for faster hash lookups during verification
CREATE INDEX idx_passport_events_hash ON passport_events(hash);

-- Add comment explaining purpose
COMMENT ON COLUMN passport_events.hash IS 'SHA-256 hash of event data for tamper detection';
COMMENT ON COLUMN passport_events.previous_hash IS 'Hash of previous event in chain for integrity verification';
