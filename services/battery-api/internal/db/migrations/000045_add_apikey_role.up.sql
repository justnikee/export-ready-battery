-- Add role column to api_keys table so keys can be scoped to a lifecycle actor role
-- (LOGISTICS, TECHNICIAN, RECYCLER). NULL means no lifecycle role — key can read/write
-- but cannot perform transitions via the external transition endpoint.
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS role TEXT;
