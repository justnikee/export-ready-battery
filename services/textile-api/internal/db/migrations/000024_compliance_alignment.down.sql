-- Rollback: Compliance Alignment

-- Magic link tokens
DROP TABLE IF EXISTS public.magic_link_tokens;

-- Partner code usage + codes + trusted partners
DROP TABLE IF EXISTS public.partner_code_usage;
DROP TABLE IF EXISTS public.partner_codes;
DROP TABLE IF EXISTS public.trusted_partners;

-- Passport events columns
ALTER TABLE public.passport_events
    DROP COLUMN IF EXISTS actor_type,
    DROP COLUMN IF EXISTS actor_identifier,
    DROP COLUMN IF EXISTS source,
    DROP COLUMN IF EXISTS status_from,
    DROP COLUMN IF EXISTS status_to,
    DROP COLUMN IF EXISTS ip_address;

-- Passport compliance columns
ALTER TABLE public.passports
    DROP COLUMN IF EXISTS batch_snapshot,
    DROP COLUMN IF EXISTS current_owner_identifier,
    DROP COLUMN IF EXISTS current_owner_email,
    DROP COLUMN IF EXISTS owner_id,
    DROP COLUMN IF EXISTS shipped_at,
    DROP COLUMN IF EXISTS installed_at,
    DROP COLUMN IF EXISTS returned_at,
    DROP COLUMN IF EXISTS recycled_at,
    DROP COLUMN IF EXISTS state_of_health,
    DROP COLUMN IF EXISTS last_soh_update_timestamp,
    DROP COLUMN IF EXISTS ownership_history,
    DROP COLUMN IF EXISTS repair_events,
    DROP COLUMN IF EXISTS replacement_events,
    DROP COLUMN IF EXISTS recycling_status,
    DROP COLUMN IF EXISTS recycler_epr_id,
    DROP COLUMN IF EXISTS recycling_date;

-- Batch fields
ALTER TABLE public.batches
    DROP COLUMN IF EXISTS model_name,
    DROP COLUMN IF EXISTS manufacturing_start_date,
    DROP COLUMN IF EXISTS manufacturing_end_date;

-- Tenant EU fields
ALTER TABLE public.tenants
    DROP COLUMN IF EXISTS eu_authorized_representative_name,
    DROP COLUMN IF EXISTS eu_authorized_representative_address,
    DROP COLUMN IF EXISTS eu_contact_email;
