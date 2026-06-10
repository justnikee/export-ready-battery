-- Down migration: Remove battery-specific fields from specs JSONB.
-- Note: The top-level columns still exist (were never dropped), so no
-- data restoration is needed — the columns already hold the original values.

UPDATE public.batches
SET specs = specs - 'cell_source'
              - 'bill_of_entry_no'
              - 'country_of_origin'
              - 'customs_date'
              - 'hsn_code'
              - 'bis_number'
              - 'epr_number'
              - 'dva_source'
              - 'audited_domestic_value_add'
              - 'pli_certificate_url';
