# Session: 2026-08-05 — P-08 dashboard bootstrap

**Date:** 2026-08-05  
**User goal:** Implement dashboard bootstrap (one first-paint API call).

## What we did
- `GET /api/v1/dashboard/bootstrap` with errgroup for stats/chart/recent
- `stale_draft_batch_count` computed server-side
- Dashboard page uses bootstrap only
- MSW fixture + Go/FE tests

## Residual
- RegulatoryDeadlines + EPRObligationCard still separate (secondary widgets)
