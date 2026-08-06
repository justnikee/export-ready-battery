# Session: 2026-08-04 — S-02 RequireWrite RBAC

**Date:** 2026-08-04  
**User goal:** Fix S-02 — VIEWER must not call write APIs.

## What we did

### Backend
- Added `middleware.RequireWrite` + `CanWriteRole` (OWNER|ADMIN|MEMBER only; fail-closed)
- Route helpers in `cmd/server/main.go`: `protectWrite`, `protectWriteOnboard`, `featWrite`, `featWriteOnboard`
- Wired nearly all tenant mutations through write helpers
- **Exceptions (VIEWER OK):** logout, readiness, alert read, compliance check, carbon calculate, regulatory alert read/dismiss
- **Supplier:** `POST /supplier/documents` → `RequireRole("supplier")` (not RequireWrite)
- Invoice **GET** download remains readable for VIEWER

### Frontend
- Documented in `lib/rbac.ts` that server `RequireWrite` is the real gate

### Tests
- `middleware` CanWrite/RequireWrite unit tests
- `handlers` rbac write integration tests
- `go build ./cmd/server` OK

### ADR
- [006-s02-require-write-rbac.md](../decisions/006-s02-require-write-rbac.md)

## Open for next session
1. **S-03** — jobs endpoints still allow any write-role user; move to ADMIN_API_KEY
2. Optionally tighten UI: hide create buttons with `canWrite` more consistently (UX only)

## Graphify
- [ ] Optional update after large main.go wiring
