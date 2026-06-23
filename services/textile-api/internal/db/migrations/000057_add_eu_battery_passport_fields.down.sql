-- Revert: Remove EU Battery Regulation compliance fields

ALTER TABLE public.batches
    DROP COLUMN IF EXISTS ce_marking,
    DROP COLUMN IF EXISTS notified_body_number,
    DROP COLUMN IF EXISTS carbon_performance_class,
    DROP COLUMN IF EXISTS removable_and_replaceable,
    DROP COLUMN IF EXISTS declaration_of_conformity_path;

DROP INDEX IF EXISTS public.idx_passports_battery_passport_id;

ALTER TABLE public.passports
    DROP COLUMN IF EXISTS battery_passport_id,
    DROP COLUMN IF EXISTS circularity_status;
