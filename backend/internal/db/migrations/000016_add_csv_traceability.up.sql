ALTER TABLE passports ADD COLUMN IF NOT EXISTS csv_source_filename TEXT;
ALTER TABLE passports ADD COLUMN IF NOT EXISTS csv_row_index INT;
