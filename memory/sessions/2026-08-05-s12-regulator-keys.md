# Session: 2026-08-05 — S-12 regulator key model

**Date:** 2026-08-05  
**User goal:** Implement S-12 scoped regulator credentials.

## What we did

### Schema
- Migration `000106_regulator_api_keys` — `regulator_api_keys` + `regulator_access_log`

### Backend
- `repository/regulator_keys.go` — CRUD + access log
- `services/regulator_keys.go` — generate/authorize/scope helpers + audit
- `detectAccessTier` — DB scope → env bootstrap; data_access REGULATOR tenant-matched
- Admin routes (X-Admin-API-Key):
  - `POST/GET /api/v1/admin/regulator-keys`
  - `DELETE /api/v1/admin/regulator-keys/{id}`
  - `GET /api/v1/admin/regulator-access-log`
- `.env.example` + config warning for global env key in production

### Tests
- Scope unit tests (tenant/market/expired/env)
- Handler tier tests + admin create tests

## Ops
1. Run migration `000106`
2. Create keys with platform admin key; distribute raw `reg_…` once
3. Prefer unsetting `REGULATOR_API_KEY` in production once DB keys exist

## Next
- **S-13** password policy (or next open security item)
