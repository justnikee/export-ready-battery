# CLAUDE.md

Instructions for Claude Code sessions in this repo. README.md has the full product/feature overview — don't duplicate it; this file covers what changes behavior.

## Agent memory (read every session)

| File | Purpose |
|------|---------|
| [`AGENTS.md`](AGENTS.md) | Session start/end protocol, skills, doc trust hierarchy |
| [`memory/CURRENT.md`](memory/CURRENT.md) | **Live priorities** — read first |
| [`memory/rules.md`](memory/rules.md) | Hard constraints (auth, lifecycle, tenancy) |
| [`memory/backlog.md`](memory/backlog.md) | Ordered open security/perf work |
| [`memory/sessions/`](memory/sessions/) | Handoffs from prior work |

After meaningful work: update CURRENT + backlog, write a session log, ADR if you made a decision. Structural code changes → `graphify update .`.

## Project Overview

ExportReady — multi-tenant SaaS for Indian battery (and, early-stage, textile) manufacturers exporting to the EU. Issues Digital Product Passports (BPAN V2 serials, QR codes, W3C Verifiable Credentials), runs India + EU compliance validators, anchors certificate hashes to Bitcoin via OpenTimestamps.

**Build state:** active development, no production users. Breaking changes are fine; data-destroying ones are not (dev DBs hold real test data).

**Active work:** `battery-web` + `battery-api` are mature; `textile-*` is being built by mirroring the battery stack (current branch `feat/textile-foundation`).

## Tech Stack

- **Frontend:** Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui (vendored per-app), TanStack Query v5, axios, react-hook-form + zod v4, sonner, next-intl, vitest + Testing Library + MSW
- **Backend:** Go 1.24, stdlib `http.ServeMux` (no framework, no ORM), pgx/v5, `log/slog`
- **DB:** PostgreSQL (Supabase) — one DB per service (platform-core, battery, textile)
- **Monorepo:** pnpm workspaces + Turborepo; Go services are NOT in the pnpm workspace

## Commands

```bash
pnpm install && make deps              # JS + Go deps
make dev                               # all Next.js apps (Go services NOT included)
cd services/battery-api && go run ./cmd/server     # API :8080
cd services/platform-core && go run ./cmd/server   # auth/billing :8081
pnpm --filter @anvaya/battery-web dev  # frontend :3000 (package name, not folder name)

pnpm --filter @anvaya/battery-web test # vitest
cd services/battery-api && go test ./... && go vet ./...
make lint                              # eslint + golangci-lint (Go lint errors don't fail: `|| true`)
make migrate-up                        # battery-api migrations
```

- There is **no typecheck script** in any package despite the `typecheck` turbo task; use `pnpm exec tsc --noEmit` inside the app dir (**not** `npx tsc` — npx resolves a decoy `tsc` package in this workspace and fails). <!-- TODO: add a real typecheck script -->
- `bash scripts/preflight.sh` runs every deterministic gate (vitest + tsc for both web apps, go vet/test for all three services) and exits non-zero on any failure — the pre-push check and the stop condition for `/goal` loops. `--fast` skips the tsc gates. Repo-specific checklists live in `.claude/skills/preflight` (gates) and `.claude/skills/verify` (runtime verification).
- `make schema-reset-*` targets **drop all data** — never run without an explicit user request.

## Architecture

- **Three Go services:** `platform-core` (auth, teams, billing, JWT issuing — shared), `battery-api` (~230 routes), `textile-api` (a fork of battery-api, being cleaned up). Each has its own Supabase DB and migrations.
- **Backend layering (battery-api):** `cmd/server/main.go` (all route wiring, ~230 `mux.Handle` calls, background workers) → `internal/handlers` → `internal/services` → `internal/repository` → pgx. Domain logic for validators lives in `internal/compliance` (`Registry` maps `(ProductType, MarketRegion)` → validator).
- **Repository pattern:** one `Repository` struct split across per-domain files. Every new method must be added in **three places**: the domain file, `repository/interface.go`, and `repository/mock_repository.go` — handler tests break otherwise (this has bitten before).
- **`BatchSpec` is JSONB** (`batches.specs`). Adding a product field = Go struct tag in `internal/models/models.go` + update `TestBatchSpec_JSONRoundTrip` + frontend zod schema (`components/batches/batch-form-schema.ts`) + wizard/template mappings. **No DB migration needed** for spec fields.
- **Frontend data flow:** axios instance in `lib/api.ts` (access token in memory only, auto-refresh on 401, redirects to login). `apiPublic` = same but no 401 redirect — use for public/passport views. Domain API modules in `lib/api/*.ts`. TanStack Query hooks + `queryKeys` factory in `hooks/use-queries.ts` — add new keys to the factory, don't inline key arrays.
- **Auth:** JWTs issued by platform-core, HS256, verified by all Go services AND by `apps/*/proxy.ts` (Next middleware) — so `JWT_SECRET` must be identical in backend and frontend envs. Tokens carry a `product_type` claim; proxy.ts enforces product-scoped route access.
- **Public passport access tiers:** tenant JWT / partner magic-link Bearer / regulator `X-Regulator-Key` header. Don't collapse these.
- **Background workers** start inside the battery-api binary (registry sync pool, OTS anchor upgrade, Tally sync, regulatory intel, daily alerts). Adding one = wire it in `cmd/server/main.go` `main()`.

## Coding Conventions

- **Frontend files:** kebab-case (`batch-details-page.tsx`); components organized by domain under `components/<domain>/`. A few legacy PascalCase files exist — new files are kebab-case.
- **shadcn primitives:** import from `@/components/ui/*` (each app vendors its own copies). `packages/ui` (`@anvaya/ui`) exists but **nothing imports it** — do not start importing it or adding to it without discussion. <!-- TODO: delete or adopt packages/ui -->
- **API shape:** REST under `/api/v1`, snake_case JSON, paginated lists return `{ items..., total, total_pages, has_more }` with `page`/`limit` params (default 50, max 200), server-side ordering — don't re-sort client-side.
- **Go handlers:** methods on `*handlers.Handler`, one `<domain>_handlers.go` + `<domain>_handlers_test.go` per domain. Tests use the repo mocks, not a live DB.
- **Migrations:** `internal/db/migrations/NNNNNN_snake_name.up.sql` + `.down.sql`, sequential numbering (currently at 000101 in battery-api). Start each with a comment explaining the why. Applied via `cmd/migration_runner`.
- **Errors/logging:** `log/slog` structured logging in Go; toasts via `sonner` on the frontend.

## Testing

- Frontend: `vitest run` per app; tests co-located (`foo.test.ts` next to `foo.ts`), MSW for network mocking.
- Backend: `go test ./...`; handler tests against `mock_repository.go`.
- `TestBatchSpec_JSONRoundTrip` is the contract test for spec fields — extend it whenever `BatchSpec` changes.
- After changing any calculation (carbon, DVA, incentives, mass balance): **grep the entire backend for other inline copies of the same formula** before declaring done — duplicated formulas have caused inconsistent results before.

## Common Pitfalls

- **Planning docs drift.** The root and `docs/` are full of plans/audits (`BATTERY_MASTER_IMPLEMENTATION_PLAN.md`, `AUDIT.md`, `HANDOFF.md`, …). Treat them as historical intent, not truth — verify every claim against code, including items marked "already fixed."
- README inaccuracies to know about: it references a `typecheck` script that doesn't exist, calls `packages/ui` the shared component library (unused), and cites stale migration counts.
- `pnpm --filter` needs the **package name** (`@anvaya/battery-web`), not the folder name.
- textile-api contains leftover debugging junk (`server_output.txt`, `_patch_handler.py`, fake cert PDFs, `restart_backend.ps1`) — don't pattern-match off these; battery-api is the reference implementation.
- battery-api also has scratch dirs (`tmp/`, `uploads/`, `cmd/tmp_*`, `cmd/check_migration_state_tmp/`) — not patterns to copy.
- Windows dev machine: Makefile targets need Git Bash/WSL semantics; prefer running the underlying pnpm/go commands directly if `make` misbehaves.

## Do Not Do

- Never edit an existing migration file — migrations are append-only; write a new numbered pair.
- Never run `make schema-reset-battery` / `schema-reset-textile` or `schema_reset.sql` unprompted.
- Never commit or modify `.env` / `.env.local` files; edit only the `.env.example` counterparts.
- Never store the access token in localStorage or weaken the in-memory-token + HttpOnly-refresh-cookie design in `lib/api.ts`.
- Never bypass the `queryKeys` factory or the `lib/api/*` modules with ad-hoc `fetch`/axios calls in components.
- Don't touch `pnpm-lock.yaml` by hand; don't upgrade Next/React/Tailwind majors as a side effect of another task.

## Deployment

Render (Singapore) via `render.yaml` blueprint: `platform-core` :8081, `battery-api` :8080, `textile-api` :8082, plus per-service migration jobs that run `migration_runner up` on deploy. Secrets are set in the Render dashboard, not in the blueprint. CI exists at `.github/workflows/ci.yml`: PRs to main run builds + all JS/Go tests; merges to main additionally run the three migration jobs, deploy the frontends (marketing, battery-web, textile-web, admin-web) to **Vercel**, and trigger a Render deploy hook for the backends. CI only gates `main` — run `bash scripts/preflight.sh` locally before pushing.

## Environment Variables

Copy the examples first: `services/battery-api/.env.example` → `.env`, `apps/battery-web/.env.local.example` → `.env.local`. Full table in README.md. The ones that cause silent breakage:

- `JWT_SECRET` — must be **identical** across platform-core, battery-api, textile-api, and each Next.js app (proxy.ts verifies tokens).
- `NEXT_PUBLIC_API_URL` — must include the `/api/v1` suffix (`lib/api.ts` strips it to build static-file URLs).
- `VC_SIGNING_KEY` — Ed25519 key for passport VC signing; regenerating invalidates previously issued credentials.
