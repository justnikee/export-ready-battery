-- Rollback: Remove Dual-Mode Compliance Support

-- 1. Drop passport_events table
DROP TABLE IF EXISTS public.passport_events;

-- 2. Remove new columns from batches
ALTER TABLE public.batches 
    DROP COLUMN IF EXISTS market_region,
    DROP COLUMN IF EXISTS pli_compliant,
    DROP COLUMN IF EXISTS domestic_value_add,
    DROP COLUMN IF EXISTS cell_source,
    DROP COLUMN IF EXISTS materials;

-- 3. Drop market_region type
DROP TYPE IF EXISTS market_region;

-- 4. Revert passports status constraint
ALTER TABLE public.passports DROP CONSTRAINT IF EXISTS passports_status_check;
ALTER TABLE public.passports ADD CONSTRAINT passports_status_check 
    CHECK (status IN ('ACTIVE', 'RECALLED', 'RECYCLED'));

-- 5. Drop indexes
DROP INDEX IF EXISTS idx_batches_market_region;
