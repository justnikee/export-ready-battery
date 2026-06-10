-- Re-add safety-net columns (data is lost; this is for rollback only)
ALTER TABLE batches
    ADD COLUMN IF NOT EXISTS cell_source text,
    ADD COLUMN IF NOT EXISTS bill_of_entry_no text,
    ADD COLUMN IF NOT EXISTS country_of_origin text,
    ADD COLUMN IF NOT EXISTS customs_date date,
    ADD COLUMN IF NOT EXISTS hsn_code text,
    ADD COLUMN IF NOT EXISTS bis_number text,
    ADD COLUMN IF NOT EXISTS epr_number text,
    ADD COLUMN IF NOT EXISTS dva_source text,
    ADD COLUMN IF NOT EXISTS audited_domestic_value_add numeric,
    ADD COLUMN IF NOT EXISTS pli_certificate_url text;
