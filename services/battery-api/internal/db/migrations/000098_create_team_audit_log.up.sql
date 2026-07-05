-- Migration 098: Create team audit log table for auditing role change events.
--

CREATE TABLE IF NOT EXISTS public.team_audit_log (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_email   varchar(255) NOT NULL,
    subject_email varchar(255) NOT NULL,
    action        varchar(50) NOT NULL, -- 'INVITE', 'ROLE_CHANGE', 'REMOVE', 'ACCEPT'
    old_role      varchar(50),
    new_role      varchar(50),
    created_at    timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_audit_log_tenant_id ON public.team_audit_log(tenant_id);
