-- Record private, sourced component lots against existing batches and packs.
CREATE UNIQUE INDEX batches_tenant_traceability_key ON public.batches (tenant_id, id);
CREATE UNIQUE INDEX passports_batch_traceability_key ON public.passports (batch_id, uuid);

CREATE TABLE public.component_lot_imports (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    actor_id uuid NOT NULL,
    file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
    file_sha256 text NOT NULL CHECK (file_sha256 ~ '^[0-9a-f]{64}$'),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, file_sha256)
);

CREATE TABLE public.component_lots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    source text NOT NULL CHECK (char_length(source) BETWEEN 1 AND 120),
    part_number text NOT NULL CHECK (char_length(part_number) BETWEEN 1 AND 100),
    lot_code text NOT NULL CHECK (char_length(lot_code) BETWEEN 1 AND 120),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, id),
    UNIQUE (tenant_id, source, part_number, lot_code)
);

CREATE TABLE public.lot_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    lot_id uuid NOT NULL,
    batch_id uuid NOT NULL,
    passport_id uuid,
    scope text NOT NULL CHECK (scope IN ('pack', 'batch_all', 'batch_unknown')),
    import_id uuid NOT NULL,
    source_row integer NOT NULL CHECK (source_row >= 2),
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (tenant_id, lot_id) REFERENCES public.component_lots (tenant_id, id),
    CONSTRAINT lot_assignments_batch_fk FOREIGN KEY (tenant_id, batch_id) REFERENCES public.batches (tenant_id, id),
    FOREIGN KEY (batch_id, passport_id) REFERENCES public.passports (batch_id, uuid),
    FOREIGN KEY (tenant_id, import_id) REFERENCES public.component_lot_imports (tenant_id, id),
    CHECK ((scope = 'pack') = (passport_id IS NOT NULL)),
    UNIQUE (import_id, source_row)
);

CREATE UNIQUE INDEX lot_assignments_pack_key ON public.lot_assignments (tenant_id, batch_id, lot_id, passport_id)
    WHERE passport_id IS NOT NULL;
CREATE UNIQUE INDEX lot_assignments_batch_key ON public.lot_assignments (tenant_id, batch_id, lot_id)
    WHERE passport_id IS NULL;
CREATE INDEX lot_assignments_lot_idx ON public.lot_assignments (tenant_id, lot_id);
CREATE INDEX lot_assignments_passport_idx ON public.lot_assignments (batch_id, passport_id) WHERE passport_id IS NOT NULL;

ALTER TABLE public.component_lot_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_assignments ENABLE ROW LEVEL SECURITY;
