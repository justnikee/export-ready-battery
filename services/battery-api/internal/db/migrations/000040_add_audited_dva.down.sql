-- 000040: Rollback audited_domestic_value_add

ALTER TABLE public.batches
    DROP COLUMN IF EXISTS audited_domestic_value_add;
