-- Rollback: Audit Events Hard Dependency

DROP TRIGGER IF EXISTS trg_passport_events_no_update ON public.passport_events;
DROP TRIGGER IF EXISTS trg_passport_events_no_delete ON public.passport_events;
DROP FUNCTION IF EXISTS public.prevent_passport_event_mutation;

ALTER TABLE public.passport_events DROP CONSTRAINT IF EXISTS passport_events_transition_action_required;
ALTER TABLE public.passport_events DROP CONSTRAINT IF EXISTS passport_events_actor_role_check;
ALTER TABLE public.passport_events DROP CONSTRAINT IF EXISTS passport_events_action_check;

ALTER TABLE public.passport_events
    DROP COLUMN IF EXISTS action,
    DROP COLUMN IF EXISTS actor_role;
