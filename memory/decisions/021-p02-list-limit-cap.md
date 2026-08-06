# ADR 021: Hard-cap list pagination limit (P-02)

## Status
Accepted — 2026-08-05

## Context
Several list handlers accepted `?limit=` (or `page_size`) with no upper bound. Clients could request `limit=1000000` and force large result sets / memory pressure. Project convention already stated default 50 / max 200, but it was not enforced everywhere. Batches already capped at 200; alerts/fleet/regulatory/telemetry/anchors/DGFT did not (or inconsistently).

## Decision
1. Shared helpers in `handlers/pagination.go`:
   - `MaxListLimit = 200`, `DefaultListLimit = 50`
   - `ClampLimit`, `ParseQueryLimit`, `ParseQueryPageSize`, `ParseQueryOffset`
2. All tenant list endpoints use these helpers (or an equal-or-stricter max, e.g. unread alerts ≤100).
3. Defense in depth: repo layers that already clamp keep clamping; DGFT `pageSize` and certificate anchors clamp at 200.
4. Bulk passport list reduced from max 500 → 200 for consistency.

## Consequences
- `?limit=1e6` silently returns at most 200 rows (no error) — same pattern as existing batch list.
- Callers that needed larger pages must paginate with offset/page.
- Tally staging list capped at 200 in its package (cannot import handlers helpers without cycle).
