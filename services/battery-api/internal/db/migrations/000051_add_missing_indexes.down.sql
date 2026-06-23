DROP INDEX IF EXISTS public.idx_passports_status;
DROP INDEX IF EXISTS public.idx_passport_events_passport_created;
DROP INDEX IF EXISTS public.idx_magic_link_tokens_expires_at;
DROP INDEX IF EXISTS public.idx_batches_tenant_status;
DROP INDEX IF EXISTS public.idx_team_members_tenant_status;
DROP INDEX IF EXISTS public.idx_export_jobs_tenant_status;
DROP INDEX IF EXISTS public.idx_device_tokens_tenant_active;
DROP INDEX IF EXISTS public.idx_outbound_webhooks_tenant_active;
