ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_batches_deleted_at ON public.batches(deleted_at);
