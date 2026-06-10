-- Migration: Initial Schema (core tables)
-- Creates base tables required by subsequent migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TENANTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    logo_url VARCHAR(500),
    support_email VARCHAR(255),
    website VARCHAR(255),
    epr_registration_number VARCHAR(100),
    bis_r_number VARCHAR(50),
    iec_code VARCHAR(20),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMPTZ,
    quota_balance INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    epr_certificate_path TEXT,
    bis_certificate_path TEXT,
    pli_certificate_path TEXT,
    epr_status VARCHAR(20) DEFAULT 'NOT_UPLOADED',
    bis_status VARCHAR(20) DEFAULT 'NOT_UPLOADED',
    pli_status VARCHAR(20) DEFAULT 'NOT_UPLOADED',
    partner_access_code VARCHAR(50),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    eu_authorized_representative_name TEXT,
    eu_authorized_representative_address TEXT,
    eu_contact_email TEXT,
    plan_type VARCHAR(20) DEFAULT 'STARTER'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);

-- ============================================================================
-- BATCHES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    batch_name VARCHAR(150) NOT NULL,
    specs JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PASSPORTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.passports (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    manufacture_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- API KEYS (no migration existed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    scope VARCHAR(20) NOT NULL,
    rate_limit_tier VARCHAR(20) NOT NULL,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_key_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    request_count INT NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL,
    UNIQUE(api_key_id, endpoint, window_start)
);