-- Migration 097: Users identity table (Phase 0b — real RBAC)
--
-- Splits identity from org. Until now `tenants` was both the company record AND
-- the login identity, and Login hardcoded role='owner' — so team roles
-- (ADMIN/MEMBER/VIEWER) were stored in team_members but never issued in a JWT.
--
-- This is the EXPAND step (additive, reversible). It creates `users`, backfills
-- one user per existing tenant, and makes `team_members` the membership table by
-- synthesizing an OWNER membership per tenant. Auth code is switched over in a
-- follow-up; tenants' legacy auth columns are dropped later in a CONTRACT step.

-- 1. Identity table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email                       varchar(255) NOT NULL UNIQUE,
    password_hash               varchar(255),          -- null for oauth-only / not-yet-accepted invites
    oauth_provider              varchar(20),
    oauth_provider_id           varchar(255),
    email_verified              boolean NOT NULL DEFAULT false,
    email_verification_token    varchar(255),
    email_verification_expires  timestamptz,
    reset_token                 varchar(255),
    reset_token_expires         timestamptz,
    -- Per-user refresh session (was per-tenant on `tenants`, which let two
    -- members of one org clobber each other's session).
    refresh_token_jti           varchar(255),
    refresh_token_expires       timestamptz,
    last_login                  timestamptz,
    created_at                  timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_provider_id
    ON public.users (oauth_provider, oauth_provider_id)
    WHERE oauth_provider IS NOT NULL;

-- 2. Backfill one user per existing tenant (tenant email == login identity) ---
INSERT INTO public.users (id, email, password_hash, oauth_provider, oauth_provider_id,
                          email_verified, email_verification_token, email_verification_expires,
                          reset_token, reset_token_expires,
                          refresh_token_jti, refresh_token_expires, last_login, created_at)
SELECT gen_random_uuid(), t.email, t.password_hash, t.oauth_provider, t.oauth_provider_id,
       COALESCE(t.email_verified, true), t.email_verification_token, t.email_verification_expires,
       t.reset_token, t.reset_token_expires,
       t.refresh_token_jti, t.refresh_token_expires, t.last_login, t.created_at
FROM public.tenants t
ON CONFLICT (email) DO NOTHING;

-- 3. Synthesize an OWNER membership per tenant (owners were never in team_members) --
INSERT INTO team_members (id, tenant_id, email, role, status, user_id, created_at, accepted_at)
SELECT gen_random_uuid(), t.id, t.email, 'OWNER', 'ACTIVE', u.id, t.created_at, t.created_at
FROM public.tenants t
JOIN public.users u ON u.email = t.email
ON CONFLICT (tenant_id, email) DO UPDATE
    SET role = 'OWNER', status = 'ACTIVE', user_id = EXCLUDED.user_id;

-- 4. Create users for invited members that don't yet have one, then re-point
--    team_members.user_id at the canonical users.id (old code stored a TENANT id
--    here, which was a bug). Pending invitees get a passwordless user until they
--    accept and set a password.
INSERT INTO public.users (id, email, email_verified, created_at)
SELECT gen_random_uuid(), tm.email, false, NOW()
FROM (SELECT DISTINCT email FROM team_members) tm
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = tm.email)
ON CONFLICT (email) DO NOTHING;

UPDATE team_members tm
SET user_id = u.id
FROM public.users u
WHERE u.email = tm.email;

-- 5. Index + soft FK on the membership link (NOT VALID avoids failing on any
--    legacy orphan; validate in a later step once confirmed clean).
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_team_members_user'
    ) THEN
        ALTER TABLE team_members
            ADD CONSTRAINT fk_team_members_user
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE NOT VALID;
    END IF;
END $$;

-- 6. Role casing: standardize team_members.role to UPPERCASE and fold the legacy
--    'operator' role into MEMBER (Phase 0a). Idempotent.
UPDATE team_members SET role = UPPER(role) WHERE role <> UPPER(role);
UPDATE team_members SET role = 'MEMBER' WHERE UPPER(role) = 'OPERATOR';

-- 7. Credentials now live on `users`; tenants no longer requires a password.
--    (Column kept for now; dropped in the later CONTRACT migration.)
ALTER TABLE public.tenants ALTER COLUMN password_hash DROP NOT NULL;
