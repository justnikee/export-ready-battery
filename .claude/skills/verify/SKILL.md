---
name: verify
description: Launch-and-drive recipe for verifying changes in this repo at runtime — service ports, health endpoints, auth tiers, and gotchas. Use when confirming a change actually works in the running app (tests/typecheck belong to the preflight skill instead).
---

# Verifying changes at runtime (ExportReady)

Verification here means driving the running app, not running tests. For the
deterministic gates (vitest / go test / tsc) use the `preflight` skill.

## Check what's already running FIRST

This is a dev machine — battery-api and battery-web are usually already up.
Don't start a second copy; probe before launching:

```powershell
Invoke-WebRequest http://localhost:8080/health   # battery-api  → {"database":"connected","status":"healthy",...}
Invoke-WebRequest http://localhost:8081/health   # platform-core (auth/billing)
Invoke-WebRequest http://localhost:8082/health   # textile-api
Invoke-WebRequest http://localhost:3000          # battery-web (Next dev; /health 404s — any HTTP response means it's up)
```

A Go service restarted from source picks up your changes; the Next dev server
hot-reloads on save, so frontend changes usually need no restart at all.
**Backend changes DO need a restart** of the affected Go binary — the running
process won't reflect them.

## Launch (only what's missing)

Env files must exist first (`.env` per service, `.env.local` per app — copy
from the `.env.example` counterparts; `JWT_SECRET` must be identical
everywhere or logins verify in one service and 401 in the next).

```powershell
cd services/battery-api;   go run ./cmd/server   # :8080  (also starts background workers)
cd services/platform-core; go run ./cmd/server   # :8081  (needed for any login/auth flow)
cd services/textile-api;   go run ./cmd/server   # :8082
pnpm --filter @anvaya/battery-web dev            # :3000  (package name, not folder name)
pnpm --filter @anvaya/textile-web dev            # also defaults to :3000 — pass `-- -p 3001` if battery-web is up
```

`go build ./...` in the service dir is a fast compile check before launching
(~verified working). Prefer running these commands directly over `make` —
Makefile targets assume Git Bash semantics and misbehave in PowerShell.

## Drive the change

- **Handler / route change** → hit the route on :8080 with the right auth
  tier (below). Route wiring lives in `cmd/server/main.go` — if your route
  404s, check it's wired there before debugging the handler.
- **Frontend change** → open it at :3000 through the real page, logged in.
  API calls go through the axios instance in `lib/api.ts` (in-memory token,
  auto-refresh) — don't curl the API and call the UI verified.
- **Auth/billing change** → platform-core (:8081) must be up; battery-web
  login depends on it.
- **Background worker change** → workers start inside the battery-api binary;
  restart it and watch its slog output for the worker's structured log lines.

### Auth tiers for API requests

Three distinct access tiers — don't collapse them when testing:

1. **Tenant JWT** — `Authorization: Bearer <token>`; obtain via platform-core
   login. Most `/api/v1` routes.
2. **Partner magic-link Bearer** — public passport routes for partners.
3. **Regulator** — `X-Regulator-Key` header on regulator routes.

Public passport views need no auth (frontend uses `apiPublic`).

## Gotchas observed

- `GET /health` (and `/api/v1/health`) reports DB connectivity too — a
  "healthy" response is proof the service is up *and* migrated/connected.
- Ports 8080/3000 being busy usually means the dev instances are already
  running — reuse them, don't kill them.
- Data in the dev Supabase DBs is real test data; drive destructive endpoints
  (deletes, schema tools) against throwaway records only, and never touch the
  `schema-reset-*` / `schema_reset.sql` paths.
