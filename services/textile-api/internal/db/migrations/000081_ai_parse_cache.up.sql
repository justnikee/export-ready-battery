-- ai_parse_cache: Persistent L2 cache for AI extraction results.
-- Immutable: same document text + same prompt version = same result forever.
-- The in-memory map in AIService serves as the L1 hot layer.
CREATE TABLE IF NOT EXISTS public.ai_parse_cache (
    text_hash       TEXT    NOT NULL,
    prompt_version  INT     NOT NULL DEFAULT 1,
    task            TEXT    NOT NULL DEFAULT 'datasheet_parse',
    result          JSONB   NOT NULL,
    method          TEXT    NOT NULL,       -- 'regex', 'llm', 'regex+llm'
    confidence      REAL    NOT NULL,
    model           TEXT    NOT NULL DEFAULT '',  -- e.g. 'llama-3.3-70b-versatile', '' for regex-only
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (text_hash, prompt_version, task)
);

-- Index for quick lookups by task (useful for cache stats queries later).
CREATE INDEX IF NOT EXISTS idx_ai_parse_cache_task ON public.ai_parse_cache (task);

COMMENT ON TABLE public.ai_parse_cache IS 'Persistent L2 cache for AI/regex extraction results. Keyed on normalized-text SHA-256 hash + prompt version + task name. No TTL — entries are immutable; bump prompt_version to invalidate.';
