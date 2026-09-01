# Session: 2026-08-22 — spine-pr3-qr-dispatch

**User goal:** PR 3 of the DPP spine (QR honesty + warehouse scan).

## What we did
- `qr_codes_ready` follows `CanIssueProductionIdentifiers` (CSV upload + auto-generate).
- `GET /api/v1/passports/resolve?q=` tenant-scoped UUID or BPAN.
- Dispatch accepts UUID, `/p/{uuid}` URL, or BPAN (resolve).
- SHIP only units that activated or were already ACTIVE; CREATED activate-failures stay in the pending list.

## Tests
- go test handlers ok
- vitest lib/dispatch-scan.test.ts 6 passed

## Open
- PR 4 actors + partners
