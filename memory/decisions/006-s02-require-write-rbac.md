# ADR 006: Server-side RequireWrite for tenant mutations (S-02)

## Status
Accepted — 2026-08-04

## Context
Most mutating routes used only JWT `Protect`. Role `VIEWER` could call create/update/delete APIs if they bypassed the UI. Frontend `canWrite` is UX-only.

## Decision
1. Add `middleware.RequireWrite` allowing **OWNER | ADMIN | MEMBER** only (fail-closed on empty/unknown).
2. Wire via helpers in `cmd/server/main.go`:
   - `protectWrite` / `protectWriteOnboard`
   - `featWrite` / `featWriteOnboard`
3. **Exceptions (VIEWER still allowed):** logout, auth readiness, mark alert read, compliance check (compute), carbon calculate (compute), regulatory alert read/dismiss.
4. **Supplier portal:** `POST /supplier/documents` uses `RequireRole("supplier")`, not `RequireWrite` (supplier must not gain general tenant write).
5. Device tokens, API keys, platform admin key, public scans unchanged.

## Consequences
- VIEWER receives **403** `{error: forbidden: read-only role}` on tenant writes.
- Existing `RequireRole("OWNER"|"ADMIN")` routes remain stricter.
- S-03 job endpoints still callable by MEMBER (write role) — separate hardening.
