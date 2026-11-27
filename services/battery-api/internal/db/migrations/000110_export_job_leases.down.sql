DROP INDEX public.idx_export_jobs_expired_lease;
UPDATE public.export_jobs SET status = 'PENDING', started_at = NULL WHERE status = 'PROCESSING';
ALTER TABLE public.export_jobs DROP COLUMN lease_id, DROP COLUMN lease_until, DROP COLUMN attempt_count;
