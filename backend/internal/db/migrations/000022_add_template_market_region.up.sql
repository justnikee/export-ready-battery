-- Add market_region column to batch_templates for Product SKU functionality
ALTER TABLE public.batch_templates 
ADD COLUMN market_region VARCHAR(10) NOT NULL DEFAULT 'GLOBAL';

-- Add comment explaining the column
COMMENT ON COLUMN public.batch_templates.market_region IS 'Target market for this template: INDIA, EU, or GLOBAL';
