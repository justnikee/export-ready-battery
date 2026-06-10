-- Migration: Move battery-specific fields from top-level columns into specs JSONB
-- This makes the batches table product-agnostic and eliminates schema debt.
--
-- Fields moved: cell_source, bill_of_entry_no, country_of_origin, customs_date,
--               hsn_code, bis_number, epr_number, dva_source,
--               audited_domestic_value_add, pli_certificate_url
--
-- The columns are NOT dropped yet — they remain as a safety net until all
-- code paths are verified to read from specs JSONB exclusively.

-- Build a JSONB fragment from the column values and merge it into specs.
-- Uses COALESCE to handle NULLs gracefully — empty strings and NULLs are
-- omitted from the JSONB object to keep specs clean.
UPDATE public.batches
SET specs = specs || jsonb_strip_nulls(jsonb_build_object(
    'cell_source', NULLIF(cell_source, ''),
    'bill_of_entry_no', NULLIF(bill_of_entry_no, ''),
    'country_of_origin', NULLIF(country_of_origin, ''),
    'customs_date', TO_CHAR(customs_date, 'YYYY-MM-DD'),
    'hsn_code', NULLIF(hsn_code, ''),
    'bis_number', NULLIF(bis_number, ''),
    'epr_number', NULLIF(epr_number, ''),
    'dva_source', NULLIF(dva_source, ''),
    'audited_domestic_value_add', audited_domestic_value_add,
    'pli_certificate_url', NULLIF(pli_certificate_url, '')
))
WHERE cell_source IS NOT NULL
   OR bill_of_entry_no IS NOT NULL
   OR country_of_origin IS NOT NULL
   OR customs_date IS NOT NULL
   OR hsn_code IS NOT NULL
   OR bis_number IS NOT NULL
   OR epr_number IS NOT NULL
   OR dva_source IS NOT NULL
   OR audited_domestic_value_add IS NOT NULL
   OR pli_certificate_url IS NOT NULL;
