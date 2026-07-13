-- =========================================================================
-- AI CORE OBSERVABILITY DASHBOARD QUERIES
-- Save this file under docs/ai_dashboard.sql
-- =========================================================================

-- 1. Daily Call Volume and Outcomes per Provider & Model
-- Provides a breakdown of total calls, average latency, and outcome statuses.
SELECT
    DATE(created_at) AS call_date,
    provider,
    model,
    COUNT(*) AS total_calls,
    ROUND(AVG(latency_ms), 2) AS avg_latency_ms,
    SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) AS success_count,
    SUM(CASE WHEN outcome = 'validation_failed' THEN 1 ELSE 0 END) AS validation_failed_count,
    SUM(CASE WHEN outcome = 'budget_exceeded' THEN 1 ELSE 0 END) AS budget_exceeded_count,
    SUM(CASE WHEN outcome = 'circuit_open' THEN 1 ELSE 0 END) AS circuit_open_count,
    SUM(CASE WHEN outcome = 'failure' THEN 1 ELSE 0 END) AS failure_count
FROM
    public.ai_call_log
GROUP BY
    DATE(created_at),
    provider,
    model
ORDER BY
    call_date DESC,
    total_calls DESC;


-- 2. Daily Token Consumption and Costs Estimation
-- Helpful to monitor free tier quotas and track usage spikes.
SELECT
    DATE(created_at) AS call_date,
    provider,
    model,
    SUM(tokens_in) AS total_input_tokens,
    SUM(tokens_out) AS total_output_tokens,
    SUM(tokens_in + tokens_out) AS total_tokens
FROM
    public.ai_call_log
GROUP BY
    DATE(created_at),
    provider,
    model
ORDER BY
    call_date DESC;


-- 3. Cache Statistics (Size, Age, and Distribution)
-- Inspects the persistent L2 cache table.
SELECT
    task,
    method,
    COUNT(*) AS cached_items,
    ROUND(AVG(confidence)::numeric, 4) AS avg_confidence,
    MIN(created_at) AS oldest_entry,
    MAX(created_at) AS newest_entry
FROM
    public.ai_parse_cache
GROUP BY
    task,
    method
ORDER BY
    cached_items DESC;


-- 4. Audit: Top Fields Extracted by the LLM
-- Analyzes which fields the LLM wins most frequently. 
-- Useful to prioritize which regex patterns to write next (weekly engineering loop).
SELECT
    task,
    won_field.value::text AS won_field_name,
    COUNT(*) AS win_count
FROM
    public.ai_call_log,
    jsonb_array_elements_text(fields_won_by_llm) AS won_field
WHERE
    outcome = 'success'
GROUP BY
    task,
    won_field.value
ORDER BY
    win_count DESC
LIMIT 20;
