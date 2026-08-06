# ADR 027: Dashboard bootstrap endpoint (P-08)

## Status
Accepted — 2026-08-05

## Context
Manufacturer dashboard first paint issued three parallel browser→API calls (`/dashboard/stats`, `/batches/chart-data`, `/batches/recent`). Each paid HTTP/auth middleware overhead; high-latency clients suffered multi-fetch first paint.

## Decision
1. Add `GET /api/v1/dashboard/bootstrap` returning:
   - `stats` (DashboardStats)
   - `chart_batches` (≤200 BatchChartData)
   - `recent_batches` (≤5 BatchSummary)
   - `stale_draft_batch_count` (server-derived, same 7-day rule as FE ActionQueue)
2. Handler runs the three repo queries via `errgroup` (parallel next to DB).
3. FE dashboard uses **only** bootstrap for shell load; fine-grained endpoints remain for other pages / refresh.
4. Optional query params: `chart_limit`, `recent_limit` (capped).

## Consequences
- One RTT for critical dashboard data; regulatory deadlines / EPR cards stay secondary fetches (not on critical path).
- Slightly larger JSON than any single call, still smaller than three separate envelopes.
