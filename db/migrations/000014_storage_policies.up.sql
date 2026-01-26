-- PLI/DVA Audit Compliance - Supabase Storage Setup
-- Creates a storage bucket for CA-certified DVA certificates with RLS policies

-- Enable storage extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create compliance-docs bucket for CA certificates
-- Public read access for transparency, authenticated upload only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-docs',
  'compliance-docs',
  true,  -- Public read access (CA certificates are public documents)
  5242880,  -- 5MB limit (5 * 1024 * 1024 bytes)
  ARRAY['application/pdf']::text[]  -- PDF only for official documents
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Authenticated users (manufacturers) can upload certificates
CREATE POLICY "Authenticated users can upload CA certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'compliance-docs');

-- RLS Policy: Public (anonymous) can view and download certificates
-- This supports audit transparency - CA certificates are public records
CREATE POLICY "Public can view CA certificates"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'compliance-docs');

-- Add helpful comments for database documentation
COMMENT ON TABLE storage.buckets IS 'Supabase Storage buckets for file uploads';
