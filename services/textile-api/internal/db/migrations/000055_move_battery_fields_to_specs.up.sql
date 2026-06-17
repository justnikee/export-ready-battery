-- Migration: Move product-specific fields from top-level columns into specs JSONB
-- This makes the batches table product-agnostic and eliminates schema debt.
--
-- Phase 0 cleanup: only India-generic fields remain as top-level columns.
-- Battery-only fields (cell_source, bill_of_entry_no, customs_date, dva_source,
-- audited_domestic_value_add, pli_certificate_url) are no longer added by
-- previous migrations and are therefore excluded here.

-- Build a JSONB fragment from the column values and merge it into specs.
-- Uses COALESCE to handle NULLs gracefully — empty strings and NULLs are
-- omitted from the JSONB object to keep specs clean.
UPDATE public.batches
SET specs = specs || jsonb_strip_nulls(jsonb_build_object(
    'country_of_origin', NULLIF(country_of_origin, ''),
    'hsn_code', NULLIF(hsn_code, ''),
    'bis_number', NULLIF(bis_number, ''),
    'epr_number', NULLIF(epr_number, '')
))
WHERE country_of_origin IS NOT NULL
   OR hsn_code IS NOT NULL
   OR bis_number IS NOT NULL
   OR epr_number IS NOT NULL;
