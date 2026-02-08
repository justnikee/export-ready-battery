-- Migration: Audit Events Hard Dependency
-- Enforces immutable audit log and action/role metadata for lifecycle transitions

-- Add action + actor_role columns
ALTER TABLE public.passport_events
    ADD COLUMN IF NOT EXISTS action TEXT,
    ADD COLUMN IF NOT EXISTS actor_role TEXT;

COMMENT ON COLUMN public.passport_events.action IS 'Transition action for lifecycle events (ACTIVATE, SHIP, INSTALL, RECYCLE, CLOSE, RECALL)';
COMMENT ON COLUMN public.passport_events.actor_role IS 'Actor role executing the transition';

-- Constrain action values (allow NULL for non-lifecycle events)
DO $$ BEGIN
    ALTER TABLE public.passport_events
        ADD CONSTRAINT passport_events_action_check
        CHECK (action IS NULL OR action IN ('ACTIVATE', 'SHIP', 'INSTALL', 'RECYCLE', 'CLOSE', 'RECALL'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Constrain actor_role values (allow NULL for non-lifecycle events)
DO $$ BEGIN
    ALTER TABLE public.passport_events
        ADD CONSTRAINT passport_events_actor_role_check
        CHECK (actor_role IS NULL OR actor_role IN ('SYSTEM', 'INTERNAL_OPERATOR', 'LOGISTICS', 'TECHNICIAN', 'RECYCLER', 'ADMIN'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Require action + actor_role for lifecycle transition events (new rows only)
DO $$ BEGIN
    ALTER TABLE public.passport_events
        ADD CONSTRAINT passport_events_transition_action_required
        CHECK (
            (event_type IN ('STATUS_CHANGED', 'SHIPPED', 'INSTALLED', 'RECALLED', 'RECYCLED', 'END_OF_LIFE')
             AND action IS NOT NULL AND actor_role IS NOT NULL)
            OR
            (event_type NOT IN ('STATUS_CHANGED', 'SHIPPED', 'INSTALLED', 'RECALLED', 'RECYCLED', 'END_OF_LIFE'))
        ) NOT VALID;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Prevent mutation of audit events (immutability)
CREATE OR REPLACE FUNCTION public.prevent_passport_event_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'passport_events are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_passport_events_no_update ON public.passport_events;
CREATE TRIGGER trg_passport_events_no_update
    BEFORE UPDATE ON public.passport_events
    FOR EACH ROW EXECUTE FUNCTION public.prevent_passport_event_mutation();

DROP TRIGGER IF EXISTS trg_passport_events_no_delete ON public.passport_events;
CREATE TRIGGER trg_passport_events_no_delete
    BEFORE DELETE ON public.passport_events
    FOR EACH ROW EXECUTE FUNCTION public.prevent_passport_event_mutation();
