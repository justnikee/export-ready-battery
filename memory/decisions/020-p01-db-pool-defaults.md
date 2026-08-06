# ADR 020: DB pool defaults for API + in-process workers (P-01)

## Status
Accepted — 2026-08-05

## Context
`pgxpool` defaulted to `MaxConns=4`, `MinConns=1`. The battery-api process runs HTTP handlers **and** background workers (registry pool, OTS, Tally, regulatory, daily alerts) on the same pool. Concurrent dashboard queries + workers queued behind 4 connections → latency spikes.

## Decision
1. Defaults: **MaxConns=20**, **MinConns=2** (env-overridable).
2. Centralize sizing in `LoadPoolConfig()` with clamps (max ≤ 100, min ≤ max).
3. Document pooler math in `.env.example`: `instances × DB_MAX_CONNS ≤ pooler max clients`.
4. Log pool config on connect; expose utilization under `/health` → `db_pool`.
5. Keep SimpleProtocol + search_path for Supabase PgBouncer.

## Consequences
- Better headroom for concurrent requests without config.
- Operators must still lower `DB_MAX_CONNS` when running many replicas against a small pooler.
- Health JSON shape grows with optional `db_pool` object (additive).
