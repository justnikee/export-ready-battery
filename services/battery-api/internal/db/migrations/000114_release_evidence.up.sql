-- Preserve manufacturer release documents and their exact pack scope per revision.
CREATE TABLE public.release_evidence_revisions (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL,
    batch_id uuid NOT NULL,
    source_system text NOT NULL CHECK (char_length(source_system) BETWEEN 1 AND 120),
    record_ref text NOT NULL CHECK (char_length(record_ref) BETWEEN 1 AND 120),
    revision integer NOT NULL CHECK (revision > 0),
    source_revision text NOT NULL CHECK (char_length(source_revision) BETWEEN 1 AND 80),
    disposition text NOT NULL CHECK (char_length(disposition) BETWEEN 1 AND 120),
    reviewer text NOT NULL CHECK (char_length(reviewer) BETWEEN 1 AND 120),
    recorded_on date NOT NULL,
    scope text NOT NULL CHECK (scope IN ('batch', 'sampled_packs')),
    file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
    file_size integer NOT NULL CHECK (file_size BETWEEN 1 AND 5242880),
    file_sha256 text NOT NULL CHECK (file_sha256 ~ '^[0-9a-f]{64}$'),
    actor_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT release_evidence_batch_fk FOREIGN KEY (tenant_id, batch_id) REFERENCES public.batches (tenant_id, id),
    UNIQUE (tenant_id, batch_id, source_system, record_ref, revision),
    UNIQUE (id, batch_id, scope)
);

CREATE TABLE public.release_evidence_sampled_packs (
    revision_id uuid NOT NULL,
    batch_id uuid NOT NULL,
    scope text NOT NULL DEFAULT 'sampled_packs' CHECK (scope = 'sampled_packs'),
    passport_id uuid NOT NULL,
    serial_number text NOT NULL,
    PRIMARY KEY (revision_id, passport_id),
    FOREIGN KEY (revision_id, batch_id, scope) REFERENCES public.release_evidence_revisions (id, batch_id, scope),
    FOREIGN KEY (batch_id, passport_id) REFERENCES public.passports (batch_id, uuid)
);

CREATE INDEX release_evidence_history_idx ON public.release_evidence_revisions (tenant_id, batch_id, created_at DESC, id DESC);
CREATE INDEX release_evidence_sample_pack_idx ON public.release_evidence_sampled_packs (batch_id, passport_id);
ALTER TABLE public.release_evidence_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_evidence_sampled_packs ENABLE ROW LEVEL SECURITY;
