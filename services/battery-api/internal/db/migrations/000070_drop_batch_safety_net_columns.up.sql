-- Migration 070: Drop safety-net columns from batches after migration 055
--
-- Migration 055 moved these fields into specs JSONB but left the flat columns
-- as a safety net. All code paths now read exclusively from specs, so these
-- columns are orphaned and create schema drift.
--
-- Columns being dropped:
--   cell_source, bill_of_entry_no, country_of_origin, customs_date,
--   hsn_code, bis_number, epr_number, dva_source,
--   audited_domestic_value_add, pli_certificate_url

ALTER TABLE batches
    DROP COLUMN IF EXISTS cell_source,
    DROP COLUMN IF EXISTS bill_of_entry_no,
    DROP COLUMN IF EXISTS country_of_origin,
    DROP COLUMN IF EXISTS customs_date,
    DROP COLUMN IF EXISTS hsn_code,
    DROP COLUMN IF EXISTS bis_number,
    DROP COLUMN IF EXISTS epr_number,
    DROP COLUMN IF EXISTS dva_source,
    DROP COLUMN IF EXISTS audited_domestic_value_add,
    DROP COLUMN IF EXISTS pli_certificate_url;
