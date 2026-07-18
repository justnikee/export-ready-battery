-- Enable the pgvector extension for semantic similarity searches
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store chunked regulatory text blocks along with their embeddings
CREATE TABLE IF NOT EXISTS public.ai_regulation_chunks (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_doc      TEXT        NOT NULL, -- e.g. 'EU_2023_1542.pdf'
    title           TEXT        NOT NULL, -- e.g. 'EU Battery Regulation 2023/1542'
    section         TEXT        NOT NULL, -- e.g. 'Article 7'
    content         TEXT        NOT NULL, -- chunk text body
    embedding       vector(768) NOT NULL, -- Gemini text-embedding-004 produces 768-dimensional vectors
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for optimized cosine similarity matching
CREATE INDEX IF NOT EXISTS idx_ai_regulation_chunks_embedding ON public.ai_regulation_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE public.ai_regulation_chunks IS 'Stores chunked legislative text documents and corresponding vector embeddings for context-aware regulatory RAG.';
