-- SoH history table: stores every recorded State-of-Health reading for a passport.
-- The passports table only holds the latest value; this table is the time-series record.
-- Populated by every call to UpdateStateOfHealth (internal, partner magic link, CSV upload, worker).

CREATE TABLE IF NOT EXISTS public.soh_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID        NOT NULL REFERENCES public.passports(uuid) ON DELETE CASCADE,
    soh         NUMERIC(5,2) NOT NULL CHECK (soh >= 0 AND soh <= 100),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor       TEXT,
    actor_type  TEXT,   -- USER | PARTNER | SYSTEM | DEVICE
    source      TEXT    -- INTERNAL | MAGIC_LINK | API | CSV
);

CREATE INDEX idx_soh_history_passport_recorded
    ON public.soh_history(passport_id, recorded_at DESC);
