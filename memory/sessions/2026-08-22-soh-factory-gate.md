# Session: 2026-08-22 — soh-factory-gate

**Date:** 2026-08-22
**Agent/tool:** Grok
**User goal:** Implement factory-gate SoH properly (not a BMS product): default on generate, one update UI, shared history log.

## Context loaded
- [x] CURRENT.md
- [x] rules.md
- [x] prior SoH audit in this conversation

## What we did
- Auto-generate, CSV, and external create all set SoH via `models.FactoryGateSoHFields` (100% + timestamp).
- Telemetry ingest appends `soh_history` (DEVICE / TELEMETRY) and rejects SoH outside 0–100.
- Lifecycle row action **Update SoH** → `POST /passports/{uuid}/soh` only (`state_of_health`).
- History JSON aligned: FE reads `state_of_health`.

## Decisions (link ADR if any)
- No ADR. Invariant in `memory/rules.md`: new passports get 100%; in-life updates go through LifecycleService or telemetry ingest, both append `soh_history`.
- Did not mount unused PassportView, add SoH on batch Passports tab, or expand the API for cycle_count/notes.

## Code / files touched
- `services/battery-api/internal/models/models.go`, `soh_test.go`
- `services/battery-api/internal/handlers/upload_handlers.go`, `external_handlers.go`
- `services/battery-api/internal/services/csv_service.go`, `telemetry_service.go`, `telemetry_service_test.go`
- `apps/battery-web/lib/api/lifecycle.ts`, `lifecycle.test.ts`
- `apps/battery-web/components/passport/manual-soh-entry.tsx`, `soh-history.tsx`
- `apps/battery-web/components/lifecycle/battery-lifecycle-page.tsx`
- `memory/rules.md`, `memory/CURRENT.md`

## Tests / verification
- Commands run:
  - `go test ./internal/models ./internal/services ./internal/handlers`
  - `pnpm --filter @anvaya/battery-web test -- lib/api/lifecycle.test.ts`
- Result: pass
- Browser: not verified this turn (dev UI not driven)

## Backlog updates
- SoH factory-gate path done. GTM G6/G1 still open.

## Open for next session
1. Slim sidebar (G6).
2. Strip fake landing stats (G1).

## Graphify
- [ ] N/A (no new module)
