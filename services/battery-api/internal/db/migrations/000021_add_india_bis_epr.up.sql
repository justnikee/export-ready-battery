-- Add India compliance fields (BIS Number, EPR Number) to batches table
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS bis_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS epr_number VARCHAR(100);

-- Add index for BIS number lookups (for verification)
CREATE INDEX IF NOT EXISTS idx_batches_bis_number ON public.batches(bis_number) WHERE bis_number IS NOT NULL;

COMMENT ON COLUMN public.batches.bis_number IS 'BIS R-Number (e.g., R-12345678) - Mandatory for lithium-ion batteries in India under IS 16046';
COMMENT ON COLUMN public.batches.epr_number IS 'EPR Registration Number - Required for e-waste compliance in India';
