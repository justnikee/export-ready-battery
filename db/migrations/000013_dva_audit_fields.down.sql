-- Rollback PLI/DVA Audit Compliance Fields

ALTER TABLE batches DROP CONSTRAINT IF EXISTS chk_dva_source;

ALTER TABLE batches 
DROP COLUMN IF EXISTS dva_source,
DROP COLUMN IF EXISTS audited_domestic_value_add,
DROP COLUMN IF EXISTS pli_certificate_url;
