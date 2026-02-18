-- Reverse BPAN V2 changes
DROP TABLE IF EXISTS public.serial_sequences;

ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS manufacturer_code;
