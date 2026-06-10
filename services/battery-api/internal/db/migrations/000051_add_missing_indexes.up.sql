-- Add missing indexes identified in performance and compliance audit.
-- All use IF NOT EXISTS so the migration is safe to apply multiple times.

CREATE INDEX IF NOT EXISTS idx_passports_status
  ON public.passports(status);

CREATE INDEX IF NOT EXISTS idx_passport_events_passport_created
  ON public.passport_events(passport_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at
  ON public.magic_link_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_batches_tenant_status
  ON public.batches(tenant_id, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_tenant_status
  ON public.team_members(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_export_jobs_tenant_status
  ON public.export_jobs(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_device_tokens_tenant_active
  ON public.device_tokens(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_outbound_webhooks_tenant_active
  ON public.outbound_webhooks(tenant_id, is_active);
