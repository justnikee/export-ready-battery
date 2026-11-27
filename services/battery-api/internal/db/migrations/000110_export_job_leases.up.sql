-- Fence export attempts and recover abandoned jobs.
ALTER TABLE public.export_jobs
    ADD COLUMN lease_id uuid,
    ADD COLUMN lease_until timestamptz,
    ADD COLUMN attempt_count integer NOT NULL DEFAULT 0;

-- Legacy processing rows become recoverable after workers are stopped for the upgrade.
UPDATE public.export_jobs SET lease_until = NOW() WHERE status = 'PROCESSING';
CREATE INDEX idx_export_jobs_expired_lease ON public.export_jobs (lease_until) WHERE status = 'PROCESSING';
