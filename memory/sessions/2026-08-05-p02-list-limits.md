# Session: 2026-08-05 — P-02 list limit caps

**Date:** 2026-08-05  
**User goal:** Cap unbounded list `limit` params (≤200).

## What we did

### Shared
- `handlers/pagination.go` + tests — `ParseQueryLimit` / `ClampLimit` / page_size / offset

### Handlers updated
- alerts, regulatory items/alerts, fleet worst-health & thermal, certificate anchors
- telemetry history, DGFT claims page_size, admin regulator access log
- list batches / batch passports, bulk passport list (500→200)

### Repo / other
- `dgft_claims.go` pageSize max 200
- certificate anchors: clamp to 200 (was reset to 50 if >200)
- tally sync staging limit max 200

## Next
- **P-03** external labels 10k in memory
