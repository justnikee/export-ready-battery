ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS data_visibility JSONB NOT NULL DEFAULT '{}'::jsonb;
