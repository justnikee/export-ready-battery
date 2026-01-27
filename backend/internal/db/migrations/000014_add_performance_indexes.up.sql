-- Performance indexes for common query patterns
-- These indexes significantly speed up read-heavy operations

-- Index on passports.batch_id for passport lookups by batch (PDF/QR generation, export)
CREATE INDEX IF NOT EXISTS idx_passports_batch_id ON public.passports(batch_id);

-- Index on batches.tenant_id for listing batches by tenant
CREATE INDEX IF NOT EXISTS idx_batches_tenant_id ON public.batches(tenant_id) WHERE deleted_at IS NULL;

-- Index on scan_events.passport_id for scan history lookups
CREATE INDEX IF NOT EXISTS idx_scan_events_passport_id ON public.scan_events(passport_id);

-- Index on scan_events for recent scans feed (tenant context requires joining passports)
CREATE INDEX IF NOT EXISTS idx_scan_events_scanned_at ON public.scan_events(scanned_at DESC);

-- Index on batches.created_at for sorting (used in list queries)
CREATE INDEX IF NOT EXISTS idx_batches_created_at ON public.batches(created_at DESC) WHERE deleted_at IS NULL;

-- Index on quota_transactions for tenant balance queries
CREATE INDEX IF NOT EXISTS idx_quota_transactions_tenant_id ON public.quota_transactions(tenant_id);

-- Index on api_keys for authentication lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash) WHERE is_active = true;

-- Composite index on passports for status queries within a batch
CREATE INDEX IF NOT EXISTS idx_passports_batch_status ON public.passports(batch_id, status);
