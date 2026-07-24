-- Expression indexes for frequently queried JSONB spec attributes on batches table
CREATE INDEX IF NOT EXISTS idx_batches_tenant_specs_carbon ON public.batches (tenant_id, ((specs->>'carbon_footprint'))) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_batches_tenant_specs_chemistry ON public.batches (tenant_id, ((specs->>'chemistry'))) WHERE deleted_at IS NULL;
