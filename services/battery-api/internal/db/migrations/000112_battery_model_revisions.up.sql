-- Add private manufacturer model definitions without changing existing batches or passports.
CREATE TABLE public.battery_models (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    code text NOT NULL CHECK (char_length(code) BETWEEN 1 AND 80),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX battery_models_tenant_code_key ON public.battery_models (tenant_id, lower(code));
CREATE INDEX battery_models_tenant_created_idx ON public.battery_models (tenant_id, created_at DESC, id DESC);

CREATE TABLE public.battery_model_revisions (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL,
    model_id uuid NOT NULL,
    revision_number integer NOT NULL CHECK (revision_number > 0),
    version integer NOT NULL DEFAULT 1 CHECK (version > 0),
    specs jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(specs) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    released_at timestamptz,
    released_by uuid,
    FOREIGN KEY (tenant_id, model_id) REFERENCES public.battery_models (tenant_id, id),
    UNIQUE (tenant_id, model_id, revision_number),
    CHECK ((released_at IS NULL) = (released_by IS NULL)),
    CHECK (released_at IS NULL OR (
        COALESCE(btrim(specs->>'chemistry'), '') <> '' AND
        COALESCE(btrim(specs->>'voltage'), '') <> '' AND
        COALESCE(btrim(specs->>'capacity'), '') <> ''
    ))
);

CREATE UNIQUE INDEX battery_model_revisions_one_draft ON public.battery_model_revisions (tenant_id, model_id)
    WHERE released_at IS NULL;

CREATE FUNCTION public.protect_released_battery_model_revision() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.released_at IS NOT NULL THEN
        RAISE EXCEPTION 'released battery model revisions are immutable' USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER battery_model_revision_immutable
    BEFORE UPDATE OR DELETE ON public.battery_model_revisions
    FOR EACH ROW EXECUTE FUNCTION public.protect_released_battery_model_revision();

-- Workspace access is mediated by the battery API, never by public database roles.
ALTER TABLE public.battery_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_model_revisions ENABLE ROW LEVEL SECURITY;
