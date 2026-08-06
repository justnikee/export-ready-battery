# ADR 011: Tenant-scoped alert mutations (S-07)

## Status
Accepted — 2026-08-04

## Context
`POST /alerts/{id}/read` parsed the caller’s `tenant_id` but never used it. The repository ran `UPDATE … WHERE id = $1`, so any authenticated tenant that knew (or guessed) another tenant’s alert UUID could mark it read. Regulatory alert read/dismiss had the same pattern.

## Decision
1. `MarkAlertRead(ctx, alertID, tenantID)` updates only when `id AND tenant_id` match; `RowsAffected()==0` → `pgx.ErrNoRows` → HTTP **404**.
2. Same for `MarkTenantRegulatoryAlertRead` / `Dismissed`.
3. Handler/service/interface/mock/fakes all take `tenantID`.
4. Cap list `limit` on alert list endpoints (≤200 / ≤100) as a small related hardening.

## Consequences
- Cross-tenant alert mutation is blocked.
- Clients that mark a non-owned or missing alert get 404 (no existence oracle beyond UUID guess difficulty).
