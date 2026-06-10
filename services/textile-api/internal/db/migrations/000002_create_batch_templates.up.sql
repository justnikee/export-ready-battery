-- Create batch_templates table for reusable batch specifications
CREATE TABLE public.batch_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster tenant-based queries
CREATE INDEX idx_batch_templates_tenant_id ON public.batch_templates(tenant_id);

-- Unique constraint: template name must be unique per tenant
CREATE UNIQUE INDEX idx_batch_templates_tenant_name ON public.batch_templates(tenant_id, name);
