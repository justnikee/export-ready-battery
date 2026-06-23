ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS morth_manufacturer_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS morth_factory_codes TEXT;
