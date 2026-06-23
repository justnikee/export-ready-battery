-- Export Jobs table for async background exports
-- Tracks large batch export jobs that run in the background

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_job_status') THEN
        CREATE TYPE export_job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_job_type') THEN
        CREATE TYPE export_job_type AS ENUM ('QR_ZIP', 'LABELS_PDF', 'CSV');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    job_type export_job_type NOT NULL,
    status export_job_status NOT NULL DEFAULT 'PENDING',
    passport_count INTEGER NOT NULL,
    
    -- File storage info (Supabase Storage)
    file_path VARCHAR(500),           -- Path in Supabase Storage bucket
    file_size_bytes BIGINT,           -- File size for display
    download_url TEXT,                -- Presigned download URL
    
    -- Error tracking
    error_message TEXT,
    
    -- Audit fields
    requested_by UUID NOT NULL,  -- User/tenant who requested the export
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,   -- When download link expires (24h)
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for efficient querying
CREATE INDEX idx_export_jobs_tenant ON export_jobs(tenant_id);
CREATE INDEX idx_export_jobs_batch ON export_jobs(batch_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_requested_at ON export_jobs(requested_at DESC);

-- Composite index for worker polling (find pending jobs efficiently)
CREATE INDEX idx_export_jobs_pending ON export_jobs(status, requested_at) 
WHERE status = 'PENDING';

COMMENT ON TABLE export_jobs IS 'Tracks asynchronous batch export jobs processed in background';
COMMENT ON COLUMN export_jobs.download_url IS 'Presigned Supabase Storage URL, expires in 24 hours';
COMMENT ON COLUMN export_jobs.expires_at IS 'When the download link expires (matches presigned URL expiry)';
