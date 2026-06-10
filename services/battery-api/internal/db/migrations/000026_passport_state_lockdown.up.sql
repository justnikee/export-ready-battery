-- Migration: Passport State Model Lockdown
-- Enforces canonical lifecycle states and normalizes legacy data
-- Date: 2026-02-07

-- ============================================================================
-- 1. NORMALIZE LEGACY PASSPORT STATUSES
-- ============================================================================

-- Map any non-canonical statuses to the closest safe canonical state
UPDATE public.passports
SET status = CASE
    WHEN status NOT IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE') AND (recycled_at IS NOT NULL OR recycling_date IS NOT NULL OR recycler_epr_id IS NOT NULL) THEN 'RECYCLED'
    WHEN status NOT IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE') THEN 'IN_SERVICE'
    ELSE status
END
WHERE status NOT IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE');

-- Normalize legacy transition columns (status_from/status_to)
UPDATE public.passport_events
SET status_from = CASE
        WHEN status_from IS NOT NULL AND status_from NOT IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE') THEN 'IN_SERVICE'
        ELSE status_from
    END,
    status_to = CASE
        WHEN status_to IS NOT NULL AND status_to NOT IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE') THEN 'IN_SERVICE'
        ELSE status_to
    END
WHERE (status_from IS NOT NULL AND status_from NOT IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'))
   OR (status_to IS NOT NULL AND status_to NOT IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'));

-- ============================================================================
-- 2. ENFORCE CANONICAL STATUS CONSTRAINT
-- ============================================================================

ALTER TABLE public.passports DROP CONSTRAINT IF EXISTS passports_status_check;
ALTER TABLE public.passports ADD CONSTRAINT passports_status_check
    CHECK (status IN ('CREATED', 'ACTIVE', 'SHIPPED', 'IN_SERVICE', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'));

COMMENT ON COLUMN public.passports.status IS 'Lifecycle status: CREATED -> ACTIVE -> SHIPPED -> IN_SERVICE -> RECYCLED -> END_OF_LIFE (or RECALLED from ACTIVE/SHIPPED/IN_SERVICE)';
