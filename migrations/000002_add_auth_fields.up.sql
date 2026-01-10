-- Add authentication fields to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_reset_token ON public.tenants(reset_token);
