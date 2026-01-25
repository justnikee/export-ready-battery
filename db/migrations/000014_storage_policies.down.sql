-- Rollback PLI/DVA Audit Compliance - Supabase Storage Setup
-- Removes the compliance-docs bucket and associated RLS policies

-- Drop RLS policies first (must drop before removing bucket)
DROP POLICY IF EXISTS "Authenticated users can upload CA certificates" ON storage.objects;
DROP POLICY IF EXISTS "Public can view CA certificates" ON storage.objects;

-- Remove the compliance-docs bucket
-- Note: This will fail if there are files in the bucket
-- You may need to empty the bucket manually before running this migration
DELETE FROM storage.buckets WHERE id = 'compliance-docs';
