-- Migration Rollback: Enterprise Lifecycle Engine
-- Reverts: trusted_domains, reward_ledger, passport enhancements

-- 1. Drop function
DROP FUNCTION IF EXISTS get_reward_points(VARCHAR);

-- 2. Drop view
DROP VIEW IF EXISTS public.reward_balances;

-- 3. Drop reward_ledger table
DROP TABLE IF EXISTS public.reward_ledger;

-- 4. Drop trusted_domains table
DROP TABLE IF EXISTS public.trusted_domains;

-- 5. Remove tenant partner_access_code
ALTER TABLE public.tenants DROP COLUMN IF EXISTS partner_access_code;

-- 6. Remove passport_events enhancements
DROP INDEX IF EXISTS idx_passport_events_status_transition;
ALTER TABLE public.passport_events DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.passport_events DROP COLUMN IF EXISTS status_from;
ALTER TABLE public.passport_events DROP COLUMN IF EXISTS status_to;

-- 7. Remove passport enhancements
ALTER TABLE public.passports DROP COLUMN IF EXISTS current_custody_email;
ALTER TABLE public.passports DROP COLUMN IF EXISTS geolocation_history;
ALTER TABLE public.passports DROP COLUMN IF EXISTS lifecycle_timestamps;

-- 8. Revert passport status constraint (remove RETURN_REQUESTED)
ALTER TABLE public.passports DROP CONSTRAINT IF EXISTS passports_status_check;
ALTER TABLE public.passports ADD CONSTRAINT passports_status_check 
    CHECK (status IN ('ACTIVE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'));
