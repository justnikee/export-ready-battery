-- BPAN V2: Atomic sequence counter for serial number generation
CREATE TABLE IF NOT EXISTS public.serial_sequences (
    prefix      TEXT PRIMARY KEY,           -- e.g. 'IN-TEN-LFP-2026'
    last_value  INTEGER NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Manufacturer code on tenant (3-char, auto-derived from company name)
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS manufacturer_code VARCHAR(3);
