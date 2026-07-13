-- ai_call_log: Observability layer tracking every gateway request.
-- Strictly anonymized (text_hash only) for GDPR/data-hygiene compliance.
CREATE TABLE IF NOT EXISTS public.ai_call_log (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task            TEXT        NOT NULL,
    text_hash       TEXT        NOT NULL,
    provider        TEXT        NOT NULL,
    model           TEXT        NOT NULL,
    prompt_version  INT         NOT NULL,
    latency_ms      INT         NOT NULL,
    tokens_in       INT         NOT NULL,
    tokens_out      INT         NOT NULL,
    outcome         TEXT        NOT NULL, -- 'success', 'failure', 'budget_exceeded', 'circuit_open', 'validation_failed'
    fields_won_by_llm JSONB     NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for quick analytics dashboard and daily budget lookup queries
CREATE INDEX IF NOT EXISTS idx_ai_call_log_created_at ON public.ai_call_log (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_call_log_provider_created ON public.ai_call_log (provider, created_at);

COMMENT ON TABLE public.ai_call_log IS 'Observability table logging every AI gateway call execution, outcome, and resource usage. No raw text logged.';
