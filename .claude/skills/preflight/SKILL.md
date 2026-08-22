---
name: preflight
description: Deterministic pre-merge gates (vitest, tsc, go vet/test) plus the repo's manual contract checks. Run before committing/pushing, and use as the stop condition for /goal loops ("preflight passes" = done).
---

# Preflight gates (ExportReady)

Two layers: a **scripted battery** any loop can run mechanically, and
**contract checks** that need judgment about what the diff touched. Both must
hold before a change is "done". Runtime verification (actually driving the
app) is the separate `verify` skill — preflight passing is necessary, not
sufficient.

## 1. Scripted battery

```bash
bash scripts/preflight.sh          # full run, ~2-4 min; exit 0 = all green
bash scripts/preflight.sh --fast   # skips the two tsc gates (slowest step)
```

Runs vitest + `pnpm exec tsc --noEmit` for battery-web and textile-web, and
`go vet ./...` + `go test ./...` for battery-api, textile-api, and
platform-core. Prints a PASS/FAIL summary and exits non-zero on any failure —
usable directly as a `/goal` success criterion.

Touched only one area? Run just its gates (same commands the script uses):

| Touched | Gates |
|---|---|
| `apps/battery-web` | `pnpm --filter @anvaya/battery-web test` + `pnpm exec tsc --noEmit` (inside the app dir) |
| `apps/textile-web` | `pnpm --filter @anvaya/textile-web test` + `pnpm exec tsc --noEmit` |
| `services/battery-api` | `go test ./... && go vet ./...` |
| `services/textile-api` | `go test ./... && go vet ./...` |
| `services/platform-core` | `go test ./... && go vet ./...` (auth changes affect ALL services — run everything) |

**Not** `npx tsc` — in this pnpm workspace npx resolves a decoy `tsc` package
and fails; use `pnpm exec tsc --noEmit`.

## 2. Contract checks (by what the diff touched)

- **New/changed `Repository` method** → present in all **three** places:
  the domain file, `internal/repository/interface.go`, and
  `internal/repository/mock_repository.go`. Handler tests break otherwise.
- **`BatchSpec` field** (JSONB — no migration) → Go struct tag in
  `internal/models/models.go` **and** `TestBatchSpec_JSONRoundTrip` extended
  **and** frontend zod schema (`components/batches/batch-form-schema.ts`)
  **and** wizard/template mappings.
- **Any calculation changed** (carbon, DVA, incentives, mass balance) → grep
  the entire backend for other inline copies of the same formula; duplicated
  formulas have diverged before.
- **New API route** → wired in `cmd/server/main.go`, and the frontend caller
  goes through `lib/api/*.ts` + the `queryKeys` factory in
  `hooks/use-queries.ts` (no ad-hoc fetch/axios, no inline key arrays).
- **New migration** → new `NNNNNN_*.up.sql`/`.down.sql` pair, sequential
  number, opening comment saying why. Never edit an existing migration.
- **Auth/JWT change** → remember `JWT_SECRET` is shared by all three Go
  services AND each app's `proxy.ts`; a change that assumes otherwise breaks
  login silently.

## Wording stop conditions for loops

Good `/goal` criteria are checkable, e.g.:
- "`bash scripts/preflight.sh` exits 0"
- "`go test ./...` in services/textile-api passes and `git grep <formula>` shows one implementation"

Bad: "code is clean", "feature works" (unverifiable → loop can't stop).
