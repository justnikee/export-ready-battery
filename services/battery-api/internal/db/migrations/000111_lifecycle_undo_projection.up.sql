-- Preserve the previous lifecycle fields alongside each immutable transition.
ALTER TABLE public.passport_events ADD COLUMN transition_projection jsonb;
