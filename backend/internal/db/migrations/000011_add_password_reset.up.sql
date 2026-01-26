-- Add password reset token fields to tenants table
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Add index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_tenants_reset_token ON public.tenants(reset_token) WHERE reset_token IS NOT NULL;
