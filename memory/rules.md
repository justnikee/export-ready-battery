# Project conventions & hard rules

Agents **must** follow these. Prefer updating this file when a new invariant is established (with an ADR if the decision is non-obvious).

---

## 1. Lifecycle & audit integrity

- All passport **status** changes go through `LifecycleService` (`services/battery-api/internal/services/lifecycle.go`). No direct SQL status writes.
- Actor role + evidence/reason required for discretionary transitions.
- Every transition produces an immutable `PassportEvent` (hash chain). Bulk raw status update / passport delete endpoints stay **disabled** (compliance lock).
- New passports (auto-generate, CSV, external API) set factory-gate SoH to 100% via `models.FactoryGateSoHFields`. In-life updates go through `LifecycleService.UpdateStateOfHealth` or telemetry ingest — both must append `soh_history`.

---

## 2. Repository three-file rule

Any new/changed DB method on `Repository` must appear in **all three**:

1. Domain file under `services/battery-api/internal/repository/`
2. `repository/interface.go`
3. `repository/mock_repository.go`

Missing mock → handler tests break.

---

## 3. BatchSpec / typing

- `BatchSpec` is JSONB on `batches.specs` — **no migration** for new spec fields.
- Add field → Go struct in `models.go` + `TestBatchSpec_JSONRoundTrip` + frontend zod (`batch-form-schema.ts`) + wizard/template mappings.
- Keep Go models aligned with `apps/battery-web/lib/types.ts`.

---

## 4. Auth, tenancy, platform admin

| Concern | Rule |
|---------|------|
| Manufacturer access token | Memory only in battery-web; refresh via HttpOnly cookie. Never localStorage for manufacturer JWT. |
| Supplier access token | Memory only (`lib/supplier-session.ts`) + HttpOnly `supplier_token` cookie; `withCredentials` via `lib/supplier-api.ts`. Never localStorage (ADR 009 / S-05). |
| Tenant isolation | Handlers take `tenant_id` from JWT/context; repo queries/mutations filter by it. Never trust body/query `tenant_id` for authorization. Alert mark-read/dismiss must include `tenant_id` (S-07 / ADR 011). |
| Cross-tenant **platform** ops | `ADMIN_API_KEY` + header `X-Admin-API-Key` (`middleware.AdminAPIKey`). Fail-closed if unset. |
| Document verify | `POST /api/v1/admin/verify-doc` is platform-key only (ADR 004 / S-01). Not tenant OWNER. |
| Global jobs | `POST /jobs/daily-alerts` and `POST /jobs/upgrade-anchors` are platform-key only (ADR 007 / S-03). Background tickers still run in-process. |
| Outbound webhooks | URLs must pass `ValidateOutboundWebhookURL` (no private/metadata IPs; HTTPS in production). Deliver via `NewSafeWebhookHTTPClient` only (ADR 008 / S-04). |
| Regulator tier | Prefer DB-scoped keys (`regulator_api_keys` via admin API). Env `REGULATOR_API_KEY` is global bootstrap only. Scope tenant/market; audit all reads (ADR 016 / S-12). Data-access REGULATOR tokens must match passport tenant. Do not collapse with partner/public. |
| Partner tier | Magic-link / data-access tokens; validate passport scope. |
| Frontend RBAC | `lib/rbac.ts` is UX-only. Server gate: `RequireWrite` (OWNER\|ADMIN\|MEMBER) on mutations (S-02 / ADR 006). |
| Tenant writes | New mutating JWT routes must use `protectWrite` / `protectWriteOnboard` / `featWrite*` helpers — not bare `Protect`. |
| Supplier portal | Upload uses `RequireRole("supplier")`, not `RequireWrite`. Session via HttpOnly cookie + memory (S-05 done). |
| JWT in URL | Session JWT never from `?token=` (Protect). One-time email tokens (magic/verify/invite) OK. Downloads use signed storage URLs (ADR 010 / S-06). |
| Edge proxy | `proxy.ts` must **verify** `auth_token` (HS256 + exp), not presence alone. Invalid cookies cleared on redirect to login (ADR 012 / S-08). `JWT_SECRET` must match API. |
| Client IP | Rate limits use `middleware.ClientIP` — ignore XFF unless `TRUST_PROXY` / production; when trusted use **rightmost** hop (ADR 013 / S-09). |
| Compliance certs | Store private-bucket canonical refs only; **re-sign on every read** (`resolveFreshBucketURL` / ViewDocument). Never persist long-lived signed URLs (ADR 014 / S-10). |
| Upload sniff | PDF certs/AI/DGFT: `services.RequirePDF` (`%PDF-`). Logos: `DetectImageType`. Multi-type docs: `DetectAllowedDocMIME`. Never accept on extension/MIME alone (ADR 015 / S-11). |
| Passwords | Register/reset/supplier accept: `services.ValidatePassword` — min 12, letter+digit, blocklist, not email (ADR 017 / S-13). Keep `lib/password-policy.ts` in sync. |
| Register enum | Never return `409 Email already registered`. Existing email → same 202 success + `SendAccountExistsEmail` (ADR 018 / S-14). |
| CSP scripts | Production `script-src` must not use `'unsafe-inline'`. Nonce + `'strict-dynamic'` via `proxy.ts` / `lib/csp.ts`; third-party scripts take `nonce` (ADR 019 / S-15). |
| DB pool | battery-api defaults MaxConns=20 MinConns=2 (`LoadPoolConfig`). Keep `instances × DB_MAX_CONNS` under Supabase/PgBouncer max (ADR 020 / P-01). |
| List limits | Parse with `ParseQueryLimit` / `ClampLimit` — default 50, **max 200**. Never honor unbounded `?limit=` (ADR 021 / P-02). |
| Sync label PDF | JWT + external label downloads: count first, reject if > `maxDownloadLimit` (500). Bulk → export-jobs LABELS_PDF (ADR 022 / P-03). |
| Sync exports | QR/labels/**CSV/audit** sync paths reject if passports > 500; use export-jobs (`QR_ZIP`/`LABELS_PDF`/`CSV`/`AUDIT_CSV`). Keep FE aligned (ADR 024 / P-05). |
| Upload sizes | Global body **10 MiB** (`limits.MaxRequestBodyBytes`). Never `ParseMultipartForm` above that; oversize → **413** via `parseMultipartForm` (ADR 025 / P-06). |
| Batch market filter | Prefer `GET /batches?market_region=EU,GLOBAL` (server SQL). Do not fetch all markets then filter in the browser (ADR 026 / P-07). |
| Dashboard first paint | Prefer `GET /dashboard/bootstrap` over parallel stats+chart+recent (ADR 027 / P-08). Keep fine-grained endpoints for other pages. |
| API rate limits | JWT routes: tenant limiter in `Auth.Protect` (~300/min). All `/api/*`: global IP via `LimitAPIPaths` (~600/min). Auth/AI stay stricter (ADR 023 / P-04). |
| Quota mint | Passport credits come from Razorpay verify + webhook only. Never reintroduce `POST /billing/top-up` (or any free `AddQuota` from tenant JWT). Refunds of a failed charge may credit back. (ADR 029) |
| Paid credits and term | Passport credits stay usable after plan expiry; only plan-only features expire. Captured Razorpay payments must match provider order tenant/SKU/price and be fulfilled once transactionally. (ADR 032) |

`JWT_SECRET` must match across platform-core, battery-api, and each app `proxy.ts`.

Do not start textile work (`apps/textile-web`, `services/textile-api`). Battery product only.

---

## 5. Frontend data access

- Use `lib/api.ts` axios instance + domain modules in `lib/api/*`.
- Keep battery-web access tokens in memory and refresh in the HttpOnly cookie. Coordinate refresh calls and guard stale completions as in ADR 031.
- TanStack keys only via `queryKeys` in `hooks/use-queries.ts`.
- Public passport pages: `apiPublic` / `apiAnonymous` as appropriate — do not attach privileged auth to public scan analytics. Public UI must not claim official registry, filing, or lab verification without live evidence (ADR 035).
- shadcn: `@/components/ui/*` per app. Do not start using unused `packages/ui` without discussion.

---

## 6. API & handlers

- REST `/api/v1`, snake_case JSON.
- List pagination: default 50, max **200** (clamp; never unbounded `limit`).
- New routes: wire in `cmd/server/main.go`; add handler tests with mocks.
- Go logging: `log/slog`. Frontend errors: sonner toasts.
- QR ZIP and label PDF are production artifacts: issue only when batch is **ACTIVE or ARCHIVED**. Never on DRAFT (`CanIssueProductionIdentifiers`). Same rule on JWT, API-key, and export jobs.

---

## 7. Migrations & data safety

- Migrations append-only: new `NNNNNN_name.up.sql` + `.down.sql`.
- Never edit an applied migration.
- Never run `schema-reset-*` / `schema_reset.sql` without explicit user request.
- Never commit real `.env` / `.env.local` — only `.env.example`.

---

## 8. Investigation & verification

- Prefer **graphify** before broad monorepo grep for architecture questions.
- After calculation changes (carbon, DVA, incentives, mass balance): search backend for **duplicate formulas**.
- Before “done”: preflight skill (and verify skill for runtime).
- After structural changes: `graphify update .` so the graph stays useful.

---

## 9. Docs hygiene

- Root/planning `docs/*` drift — verify against code.
- When fixing a backlog item, mark it in `memory/backlog.md` and refresh `memory/CURRENT.md`.

## 10. Issuance and privacy (ADR 030)

- HTTP passport creation must use `InsertPassportsAtomic`; activation must use `ActivateBatchAtomic`. No separate handler debit/refund/status sequence. Tenant-then-batch lock order; issuance callbacks perform no DB/network calls.
- Draft snapshots are provisional; finalize on activation. Never rewrite an already-issued snapshot to repair a draft-era error. Draft passports are not public.
- Batch attachment writes and signing reads validate tenant and staging document purpose. Persist canonical keys; do not pass through arbitrary legacy URLs.
- Saved visibility categories must be enforced on server responses and document endpoints. Defaults match the PARTNER setting; do not silently expose unconfigured categories.
