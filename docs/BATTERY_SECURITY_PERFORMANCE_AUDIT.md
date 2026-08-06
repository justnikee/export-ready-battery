# Battery Web & API — Security & Performance Audit

**Scope:** `apps/battery-web`, `services/battery-api`  
**Date:** 2026-08-04  
**Method:** Static code review of auth/middleware, handlers, repositories, frontend proxy/API layer, and known hot paths. No live penetration test or load test was run.

**Severity scale**

| Level | Meaning |
|-------|---------|
| **Critical** | Exploitable cross-tenant or privileged abuse with high impact |
| **High** | Significant confidentiality, integrity, or availability risk |
| **Medium** | Meaningful weakness; exploitability depends on conditions |
| **Low** | Defense-in-depth / hardening gap |
| **Info** | Observation or already-mitigated pattern worth tracking |

---

## Executive summary

Both apps show intentional security design in several places (HttpOnly refresh cookies, in-memory access tokens, tenant-scoped batch lookups, passport access tiers, security headers/CSP, bcrypt passwords, payment signature verification, disabled destructive bulk deletes).

The highest-priority problems are **authorization gaps** (cross-tenant admin document verification, missing VIEWER write enforcement, unscoped alert mutation, global job triggers), **SSRF risk on outbound webhooks**, **supplier token storage in `localStorage`**, and **performance bottlenecks** (very small default DB pool, unbounded list limits, large in-memory batch exports on external API, missing global API rate limiting).

Prior performance work (ADR 003) already fixed several known issues (rate-limiter lock contention, dashboard query parallelism, Recharts code-splitting, storage client reuse). Remaining items below are still open or only partially addressed.

---

## Positive controls already in place

These are working patterns and should be preserved:

| Area | What works |
|------|------------|
| Access tokens | Held in memory only in battery-web (`lib/api.ts`); not written to `localStorage` |
| Refresh sessions | HttpOnly cookie, path-scoped to `/api/v1/auth`, rotated on refresh, JTI revocation on logout |
| Password hashing | bcrypt with configurable cost |
| JWT validation | HMAC alg check in Go and in Next proxy |
| Passport tiers | Public / partner magic-link / regulator key with constant-time key compare |
| Tenant isolation (common path) | Most batch/passport handlers take `tenant_id` from JWT and pass it into repo queries |
| Compliance locks | Bulk status update / passport delete / batch delete permanently disabled |
| CORS | Explicit allow-list; credentials only for allowed origins; required in production |
| Security headers | API OWASP headers + CSP; battery-web CSP/HSTS/XFO via `next.config.ts` |
| Body size | Global `MaxBytesReader` 10 MB |
| Auth rate limit | Login/register/forgot/magic-link under ~5 req/min |
| AI rate limit | Per-tenant AI limiter |
| Payments | Razorpay HMAC verification + payment idempotency |
| Magic links | Token hashed at rest; high-risk actions can require OTP |

---

## Security findings

### Critical

#### S-01 — Cross-tenant document verification (IDOR) — **FIXED 2026-08-04**

**Where:** `services/battery-api/internal/handlers/admin_handlers.go` (`AdminVerifyDocument`)  
**Route:** `POST /api/v1/admin/verify-doc`

**Was:** Any authenticated **OWNER of any tenant** could pass an arbitrary `tenant_id` and set EPR/BIS/PLI status for **another tenant**.

**Fix applied:**

1. Auth is now **platform `ADMIN_API_KEY`** via `X-Admin-API-Key` (`middleware.AdminAPIKey`), not tenant JWT / OWNER role.
2. Fail-closed when `ADMIN_API_KEY` is empty (503).
3. Handler verifies the target tenant exists before mutating status.
4. Frontend `adminVerifyDocument` requires an explicit server-side key argument; not wired to manufacturer UI.
5. Tests: middleware unit tests + handler tests proving OWNER JWT alone cannot call the route.

---

### High

#### S-02 — VIEWER (and weak RBAC) can perform write operations — **FIXED 2026-08-04**

**Where:** `middleware.RequireWrite` + `cmd/server/main.go` helpers (`protectWrite*`, `featWrite*`)

**Was:** Most mutating endpoints used only JWT `Protect`; VIEWER could write via API.

**Fix applied:**

1. `RequireWrite` allows OWNER|ADMIN|MEMBER only (fail-closed).
2. Tenant mutations wired through write helpers; soft reads (logout, alert-read, pure compute) exempt.
3. Supplier document upload uses `RequireRole("supplier")`, not general write.
4. Frontend `canWrite` remains UX; server is authoritative (ADR 006).

---

#### S-03 — Global background jobs callable by any authenticated user — **FIXED 2026-08-04**

**Where:** `POST /api/v1/jobs/daily-alerts`, `POST /api/v1/jobs/upgrade-anchors`

**Was:** Any JWT (later any write-role) could trigger cross-tenant jobs.

**Fix applied:**

1. Both routes use `middleware.AdminAPIKey` (`X-Admin-API-Key`) — same as S-01 (ADR 007).
2. Fail-closed when `ADMIN_API_KEY` empty.
3. Manufacturer admin UI job buttons removed; helpers require explicit server-side key.
4. In-process background tickers unchanged (scheduled work does not need HTTP).

---

#### S-04 — Outbound webhook SSRF — **FIXED 2026-08-04**

**Where:** `internal/services/ssrf.go`, outbound webhook create + deliver

**Was:** Any http(s) host accepted; private/metadata IPs and unsafe redirects allowed.

**Fix applied (ADR 008):**

1. `ValidateOutboundWebhookURL` at create and every delivery attempt.
2. Blocks loopback, RFC1918, link-local, CGNAT, metadata hosts, userinfo, fragments.
3. Production requires HTTPS (`APP_ENV=production`).
4. Safe HTTP client: no env proxy, DialContext IP check, redirect re-validation (max 5).

---

#### S-05 — Supplier auth tokens stored in `localStorage` — **FIXED 2026-08-04**

**Where:** supplier portal login/dashboard/upload + API auth middleware

**Was:** JWT and ids in `localStorage` (XSS-stealable).

**Fix applied (ADR 009):**

1. Login sets HttpOnly `supplier_token` cookie; token also returned once for memory.
2. `Protect` accepts cookie when Authorization absent.
3. Frontend: `supplier-session` + `supplier-api` (`withCredentials`); no localStorage.
4. Logout clears cookie.

---

#### S-06 — JWT accepted from query string — **FIXED 2026-08-04**

**Where:** `middleware/auth.go` Protect, export downloads, OAuth callback

**Was:** Session JWT accepted from `?token=`; exports/OAuth put access tokens in URLs.

**Fix applied (ADR 010):**

1. Protect: Bearer → supplier_token cookie → auth_token cookie only (no query).
2. Exports: signed storage URL via authenticated refresh API.
3. OAuth: HttpOnly cookies + callback rehydrate via `/auth/refresh`.
4. One-time email tokens (magic/verify/invite) remain URL-based with dedicated validators.

---

### Medium

#### S-07 — `MarkAlertRead` not tenant-scoped — **FIXED 2026-08-04**

**Where:** tenant alerts + regulatory alerts mark-read/dismiss

**Was:** `UPDATE … WHERE id = $1` only; tenant from JWT ignored.

**Fix applied (ADR 011):**

1. `MarkAlertRead(alertID, tenantID)` with `WHERE id AND tenant_id`; 0 rows → 404.
2. Same for regulatory alert read/dismiss.
3. Interface/mock/fakes/handler tests updated.
4. List limit caps on alert GETs (related hardening).

---

#### S-08 — Next.js proxy treats any `auth_token` cookie as authenticated — **FIXED 2026-08-04**

**Where:** `apps/battery-web/proxy.ts`

**Was:** Protected routes only checked cookie presence.

**Fix applied (ADR 012):**

1. `verifyAuthToken` — HS256 + exp (Web Crypto, `JWT_SECRET`).
2. Dashboard/onboarding/admin require valid claims; forged cookie → login + clear cookie.
3. Auth-page bounce to dashboard only when token is cryptographically valid.
4. Unit tests in `proxy.test.ts`.

---

#### S-09 — Rate limiter trusts client-controlled `X-Forwarded-For` — **FIXED 2026-08-04**

**Where:** `middleware/client_ip.go`, rate limiters, scan/lifecycle IP helpers

**Was:** Leftmost XFF always trusted.

**Fix applied (ADR 013):**

1. `ClientIP` ignores XFF/X-Real-IP unless `TRUST_PROXY` or production/staging.
2. When trusted, uses **rightmost** XFF hop (proxy-observed client).
3. Rate limiters + scan geo + lifecycle IP use the same helper.
4. Unit tests prove spoofed XFF does not open new rate-limit buckets when untrusted.

---

#### S-10 — Compliance certificate files may be world-readable — **FIXED 2026-08-05**

**Where:** cert upload/view, `/auth/me`, passport views, storage path extract

**Was:** Permanent public object URLs stored and returned for EPR/BIS/PLI PDFs.

**Fix applied (ADR 014):**

1. DB stores canonical private-bucket refs only (public-URL shape or bare key).
2. Upload/ViewDocument/Me/passport responses re-sign (1h) via `resolveFreshBucketURL`.
3. ViewDocument never redirects to unauthenticated public object URLs.
4. Frontend opens signed URLs via authenticated ViewDocument / absolute hrefs.
5. **Ops:** keep Supabase `compliance-docs` bucket private.

---

#### S-11 — Upload content validation is extension/MIME based — **FIXED (2026-08-05)**

**Where:** `UploadDocument` (and similar)

**Was:** Accepted PDF if `Content-Type: application/pdf` **or** filename ends with `.pdf`. No magic-byte check.

**Fix applied:** `services/file_sniff.go` (`RequirePDF`, `DetectImageType`, `DetectAllowedDocMIME`) wired on cert, logo, passport docs, DGFT, AI datasheet, and supplier uploads. Extension/MIME alone is insufficient. ADR 015.

**Residual:** Antivirus scanning and per-tenant upload quotas still open.

---

#### S-12 — Single global regulator API key — **FIXED (2026-08-05)**

**Where:** `REGULATOR_API_KEY` env + `detectAccessTier`

**Was:** One shared env key granted regulator-tier data for **all** passports; no attribution.

**Fix applied:** DB `regulator_api_keys` with tenant/market scopes + `regulator_access_log`; admin CRUD under `X-Admin-API-Key`; env key retained as audited global bootstrap only; data-access REGULATOR tokens tenant-matched. ADR 016. Migration `000106`.

---

#### S-13 — Weak password policy — **FIXED (2026-08-05)**

**Where:** `auth_handlers.go` Register

**Was:** Only rule length ≥ 8.

**Fix applied:** `services.ValidatePassword` — min 12, letter+digit, common-password blocklist, reject email/local-part. Wired on register, reset, supplier accept. Frontend `lib/password-policy.ts` aligned. ADR 017.

**Residual:** HaveIBeenPwned k-anonymity and captcha-after-N-failures still optional later.

---

#### S-14 — Email enumeration on register — **FIXED (2026-08-05)**

**Where:** Register returns `409 Email already registered`

**Was:** Distinct 409 revealed whether an email was registered.

**Fix applied:** Existing email (and unique races) return **202** with the same success message as new signup; owner gets `SendAccountExistsEmail` (login/forgot links). Password hashed before existence check. Invite + existing user activates membership without oracle. ADR 018.

---

#### S-15 — Production CSP still allows `'unsafe-inline'` scripts — **FIXED (2026-08-05)**

**Where:** `apps/battery-web/next.config.ts` (now `proxy.ts` + `lib/csp.ts`)

**Was:** Production `script-src` included `'unsafe-inline'`.

**Fix applied:** Per-request nonce CSP in `proxy.ts` with `'strict-dynamic'`; no script `'unsafe-inline'`. Razorpay loaded via `next/script` + nonce. Static CSP removed from next.config. ADR 019.

**Residual:** `style-src 'unsafe-inline'` still present for shadcn/Tailwind.

---

### Low / Info

| ID | Finding | Notes |
|----|---------|-------|
| S-16 | Bulk repo methods lack `tenant_id` filter | Handlers currently hard-disabled; still a footgun if re-enabled |
| S-17 | Auth rate limiter does not cover all auth-adjacent protected routes | `/auth/me` etc. not under authMux limiter (lower risk) |
| S-18 | Most API routes have **no** global rate limit | Only auth, AI, scans, public passport GET |
| S-19 | OpenAPI + Swagger UI public at `/docs` | Docs CSP allows `unpkg.com`; ensure no secrets in OpenAPI |
| S-20 | Refresh JTI is single-session per user | New login/device invalidates previous session (security OK; UX multi-device limited) |
| S-21 | Magic-link request reveals passport existence | `404 Passport not found` vs other errors |
| S-22 | `ConstantTimeCompare` on regulator key | Safe when lengths match; empty env key correctly denies all |
| S-23 | Local `uploads/` tree in repo/service | Confirm not served statically in production |
| S-24 | Frontend entitlements are UX-only | Backend `RequireFeature` is real gate — good; keep it that way |

---

## Performance findings

### High

#### P-01 — Default DB pool max connections is 4 — **FIXED (2026-08-05)**

**Where:** `internal/db/postgres.go` / `pool_config.go`

**Was:** `MaxConns` default 4 — starved HTTP + in-process workers.

**Fix applied:** Defaults **MaxConns=20**, **MinConns=2** via `LoadPoolConfig()`; clamps; `.env.example` pooler math; startup log; `/health` exposes `db_pool` stats. ADR 020.

**Ops:** Set `DB_MAX_CONNS` so `instances × max ≤` Supabase/PgBouncer client limit.

---

#### P-02 — Unbounded `limit` on alerts (and similar list endpoints) — **FIXED (2026-08-05)**

**Where:** `alert_handlers.go` (+ siblings)

**Was:** Many lists accepted unbounded `?limit=`.

**Fix applied:** Shared `handlers/pagination.go` (`ParseQueryLimit`, max **200**); wired across alerts, regulatory, fleet, anchors, telemetry, DGFT, bulk passports, batches, admin access log; repo clamps where needed. ADR 021.

---

#### P-03 — External labels endpoint loads up to 10,000 passports in memory — **FIXED (2026-08-05)**

**Where:** `external_handlers.go` `ExternalDownloadLabels`

**Was:** Loaded up to 10,000 passports then built PDF in memory; JWT path already capped at 500.

**Fix applied:** Count first; reject if `count > maxDownloadLimit` (500) with pointer to `export-jobs` LABELS_PDF; fetch only `count` rows. ADR 022.

---

### Medium

#### P-04 — No global API rate limiting for authenticated traffic — **FIXED (2026-08-05)**

**Where:** `main.go` / rate limiter middleware

**Was:** `apiRateLimiter` only on public passport/scan; JWT routes unmetered.

**Fix applied:** Per-tenant limiter in `Auth.Protect` (`NewTenantAPIRateLimiter` ~300/min); global per-IP `LimitAPIPaths` on `/api/*` (~600/min, health skipped). Auth + AI remain stricter. ADR 023.

---

#### P-05 — Synchronous heavy exports on request path — **FIXED (2026-08-05)**

**Was:** QR/labels capped at 500; serial CSV + audit CSV still loaded all rows on the request goroutine.

**Fix applied:** Shared 500-passport gate + `syncExportTooLargeMsg` → export-jobs for QR_ZIP, LABELS_PDF, **CSV**, **AUDIT_CSV**. Frontend routes large CSV/audit to async jobs. ADR 024.

**Residual:** Batch-level PDFs (compliance/DD/DVA) still sync (no N-passport load). ≤500 still generates ZIP/PDF on request.

---

#### P-06 — Multipart vs MaxBytes mismatch — **FIXED (2026-08-05)**

**Was:** Global MaxBytesReader 10 MB; some handlers used `ParseMultipartForm(32 << 20)`.

**Fix applied:** `internal/limits` single source of truth (10 MiB ceiling); all multipart caps ≤ that; oversize → **413**. ADR 025.

---

#### P-07 — Frontend client-side filtering of large lists — **FIXED (2026-08-05)**

**Was:** `useEuActiveBatches` fetched `limit=200&status=ACTIVE` then filtered EU/GLOBAL client-side.

**Fix applied:** `ListBatchesFiltered` supports `market_region=EU,GLOBAL` (SQL `ANY`); FE uses that param only. ADR 026.

---

#### P-08 — Dashboard still does multiple independent fetches

Dashboard uses TanStack Query well in places, but pages still compose many parallel endpoints. Without request coalescing/BFF, mobile/high-latency users pay waterfall costs.

**Impact:** Slow TTFD on dashboard.

**Fix:** Aggregate “dashboard bootstrap” endpoint (stats + recent batches + unread counts) already partially present — expand and prefer it.

---

### Low / already improved

| ID | Finding | Status |
|----|---------|--------|
| P-09 | Rate limiter write-lock on every request | Mitigated (ADR 003 2-stage RLock) |
| P-10 | Correlated subquery in recent batches | Mitigated (JOIN aggregation) |
| P-11 | Per-upload new HTTP client / EnsureBucket | Mitigated (shared client + bucket cache) |
| P-12 | Full event history for hash chain step | Mitigated (`GetLatestEventHash`) |
| P-13 | Analytics Recharts bundle weight | Mitigated (`next/dynamic` on analytics/dashboard charts) |
| P-14 | JSONB expression indexes for specs | Migration 000105 (ADR 003) — verify applied in all envs |
| P-15 | Default API timeout 30s client-side | OK for most; long exports should use jobs not longer timeouts |

---

## Frontend-specific notes (`battery-web`)

| Topic | Assessment |
|-------|------------|
| Token handling (manufacturer) | Strong: memory access token + HttpOnly refresh |
| Proxy JWT secret | Required in production; good |
| Supplier portal | Weaker session model (`localStorage`) — see S-05 |
| CSP / HSTS / XFO | Present and reasonably strict |
| Query caching | Solid `staleTime` defaults in `use-queries.ts` / `query-provider.tsx` |
| Code splitting | Charts/maps dynamically imported |
| RBAC UI | Helpers exist; not enforced server-side (S-02) |
| Error handling | 401 refresh-retry present; careful not to loop |

---

## Backend-specific notes (`battery-api`)

| Topic | Assessment |
|-------|------------|
| Framework | stdlib mux; explicit middleware composition |
| SQL injection | Parameterized queries dominate; dynamic SQL uses `$n` placeholders |
| Tenant isolation | Generally good on batch paths; gaps on admin/alerts/jobs |
| Lifecycle integrity | Strong compliance locks against raw status writes |
| Secrets | Production requires JWT/CORS/DB; regulator key optional with warn |
| Workers | Multiple tickers in-process — share DB pool with HTTP (P-01) |

---

## Recommended remediation order

### Sprint 1 — authorization (stop the bleeding)

1. **S-01** Fix or remove cross-tenant `AdminVerifyDocument`.  
2. **S-03** Lock down `/jobs/*` endpoints.  
3. **S-07** Tenant-scope `MarkAlertRead` (and audit similar update-by-id patterns).  
4. **S-02** Deny VIEWER on all write routes.

### Sprint 2 — abuse & data exposure

5. **S-04** SSRF protections on webhooks.  
6. **S-05** Supplier session hardens to cookies.  
7. **S-06** Remove JWT-from-query.  
8. **S-10** Private compliance bucket + signed URLs.  
9. **P-02 / P-04** Cap list limits + global/per-tenant rate limits.

### Sprint 3 — performance scale-up

10. **P-01** Tune DB pool + document pooler math.  
11. **P-03 / P-05** Async/streaming exports only for large batches.  
12. **P-07 / P-08** Server-side filters + dashboard bootstrap.

### Sprint 4 — hardening

13. Password policy, regulator key model, proxy JWT verification, CSP nonces, upload magic-byte checks.

---

## Suggested verification checklist

After fixes:

```bash
# API
cd services/battery-api && go test ./internal/handlers/... ./internal/middleware/... ./internal/services/...

# Web
pnpm --filter @anvaya/battery-web test

# Full gates
bash scripts/preflight.sh
```

Add explicit tests for:

- Owner A cannot verify Owner B documents  
- VIEWER receives 403 on `POST /batches`  
- Non-admin cannot call `/jobs/daily-alerts`  
- Webhook create rejects `http://127.0.0.1/` and metadata IPs  
- Alert mark-read with foreign ID returns 404  
- Alert list `limit=999999` clamps to max  

---

## Out of scope / not fully assessed

- Live dependency CVE scan (`go list -m`, `pnpm audit`)  
- Production Render/Vercel network policy and WAF  
- Supabase RLS (API uses service role; app-layer tenancy is primary)  
- Full IDOR sweep of every `/{id}` handler (~230 routes)  
- Load testing / p99 latency measurement  
- Textile stack (explicitly out of scope)

A full automated IDOR suite against all path-parameter resources is recommended before production launch.

---

## Appendix — key files reviewed

| Area | Paths |
|------|--------|
| Auth | `middleware/auth.go`, `services/auth_service.go`, `handlers/auth_handlers.go` |
| Security middleware | `middleware/security.go`, `middleware/rate_limiter.go`, `middleware/apikey_auth.go` |
| Routing | `cmd/server/main.go` |
| Passports | `handlers/passport_handlers.go`, `handlers/bulk_handlers.go`, `handlers/external_handlers.go` |
| Admin / jobs | `handlers/admin_handlers.go`, `handlers/alert_handlers.go`, `handlers/certificate_anchor_handlers.go` |
| Webhooks | `handlers/outbound_webhook_handlers.go`, `services/outbound_webhook.go` |
| Storage | `services/storage_service.go`, `handlers/document_handlers.go` |
| Frontend auth | `lib/api.ts`, `proxy.ts`, `context/auth-context.tsx`, supplier pages |
| Frontend perf | `hooks/use-queries.ts`, analytics/dashboard dynamic imports |
| Prior work | `memory/decisions/003-backend-performance-optimizations.md` |
