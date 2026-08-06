# ADR 004: Platform admin key for document verification (S-01)

## Status
Accepted — 2026-08-04

## Context
`POST /api/v1/admin/verify-doc` let any tenant **OWNER** pass an arbitrary `tenant_id` and set EPR/BIS/PLI status (`VERIFIED`/`REJECTED`) for **any** tenant. That is a critical cross-tenant IDOR.

Document verification is a **platform operator** action (manual review when registry adapters cannot auto-verify EPR/PLI), not a tenant self-service action. Deployment docs already planned `ADMIN_API_KEY` for sensitive admin endpoints. No manufacturer UI called this endpoint; only an unused client helper existed.

## Decision
1. Authenticate the route with **`ADMIN_API_KEY`** via header **`X-Admin-API-Key`** (`middleware.AdminAPIKey`).
2. Remove tenant JWT / `RequireRole("OWNER")` from this route entirely.
3. Fail-closed when the key is unset (503).
4. Handler still accepts `tenant_id` in the body (platform ops need to target a tenant) but only after admin-key auth; also verify tenant exists.
5. Frontend helper requires an explicit server-side key argument and must never use `NEXT_PUBLIC_*`.

## Consequences
- Tenant OWNERS can no longer forge or reject competitors’ compliance certificates.
- Ops must set `ADMIN_API_KEY` on battery-api (and use it from server-side admin tools / curl).
- Future `admin-web` should call this only from a server route that holds the secret.
- Related issues (signup admin, job triggers) still use weak tenant RBAC — tracked as S-02/S-03, not fixed here.
