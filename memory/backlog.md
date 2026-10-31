# Backlog (agent-oriented)

Ordered work agents should pick from when the user says “continue” / “next issue” without a new topic.  
Source of truth for security/perf detail: [`docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md`](../docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md).

**Legend:** `todo` · `doing` · `done` · `blocked`

---

## Billing and payment integrity — 2026-10-25

| ID | Status | Priority | Result |
|----|--------|----------|--------|
| B-01 | done locally | P0 | Verify and webhook bind captured provider payment/order to tenant, SKU, amount, and currency. |
| B-02 | done locally | P0 | One DB transaction grants credits/seats/plan and records unique payment ID. Concurrent duplicate and rollback tests pass. |
| B-03 | done locally | P1 | Expiry no longer blocks core writes or renewal billing routes. |
| B-04 | done locally | P1 | Credits survive plan term; billing UI shows term and balance separately. ADR 032. |

Provider sandbox and logged-in UI verification remain before accepting production self-service payments.

---

## Security (battery)

| ID | Status | Title | Primary surfaces | Done when |
|----|--------|-------|------------------|-----------|
| S-01 | **done** | Cross-tenant doc verify IDOR | `admin_handlers.go`, `middleware/admin_auth.go` | ADR 004; admin key only; tests green |
| S-02 | **done** | VIEWER can write | `middleware.RequireWrite`, `cmd/server/main.go` helpers | ADR 006; VIEWER 403 on writes; tests green |
| S-03 | **done** | Write-role users can run global jobs | `main.go` jobs routes, admin UI | ADR 007; admin key only; UI removed |
| S-04 | **done** | Webhook SSRF | `services/ssrf.go`, outbound webhook create/deliver | ADR 008; private/metadata blocked; safe client |
| S-05 | **done** | Supplier `localStorage` tokens | supplier cookie + `supplier-api.ts` | ADR 009; HttpOnly + memory; no localStorage |
| S-06 | **done** | JWT in query string | `middleware/auth.go`, OAuth callback, exports | ADR 010; Protect never reads `?token=` |
| S-07 | **done** | `MarkAlertRead` not tenant-scoped | alerts + regulatory alert repos/handlers | ADR 011; tenant_id in UPDATE; 404 foreign |
| S-08 | **done** | Proxy cookie presence-only | `apps/battery-web/proxy.ts` | ADR 012; HS256+exp verify; clear bad cookie |
| S-09 | **done** | Rate limit trusts `X-Forwarded-For` | `middleware/client_ip.go` | ADR 013; rightmost XFF only when TRUST_PROXY |
| S-10 | **done** | Compliance docs public URLs | cert upload/view/me/passport | ADR 014; re-sign on every read |
| S-11 | **done** | Upload content sniff (PDF magic) | `file_sniff.go` + cert/logo/passport/DGFT/AI/supplier | ADR 015; magic-byte reject |
| S-12 | **done** | Regulator key model | `regulator_api_keys`, passport tier, admin routes | ADR 016; scoped + audit |
| S-13 | **done** | Password policy | `password_policy.go` + register/reset/supplier + web | ADR 017; 12+ letter+digit |
| S-14 | **done** | Email enumeration on register | `auth_handlers.go` Register | ADR 018; 202 + exists email |
| S-15 | **done** | CSP unsafe-inline scripts | `lib/csp.ts`, `proxy.ts`, layout | ADR 019; nonce + strict-dynamic |

---

## Performance (battery)

| ID | Status | Title | Primary surfaces | Done when |
|----|--------|-------|------------------|-----------|
| P-01 | **done** | DB `MaxConns` default 4 → 20 | `pool_config.go`, health `db_pool` | ADR 020; env + pooler math |
| P-02 | **done** | Unbounded list `limit` | `pagination.go` + list handlers | ADR 021; max 200 |
| P-03 | **done** | External labels 10k in memory | `ExternalDownloadLabels` | ADR 022; same maxDownloadLimit 500 |
| P-04 | **done** | No global API rate limit | `Auth.Protect` + `LimitAPIPaths` | ADR 023; tenant+IP |
| P-05 | **done** | Sync heavy exports on request path | CSV/audit + QR/labels gates; FE async | ADR 024; max 500 |
| P-06 | **done** | Multipart vs MaxBytes mismatch | `internal/limits` + parseMultipartForm | ADR 025; 10MB + 413 |
| P-07 | **done** | Client-side EU batch filter | `ListBatchesFiltered` + useEuActiveBatches | ADR 026; market_region= |
| P-08 | **done** | Dashboard multiple fetches | `GET /dashboard/bootstrap` + FE | ADR 027; one first-paint call |

---

## Already mitigated (do not re-fix as new)

- Rate limiter 2-stage RLock (ADR 003)
- Dashboard/analytics query parallelism (ADR 003)
- Recharts dynamic imports (ADR 003)
- Storage shared HTTP client + bucket cache (ADR 003)
- GetLatestEventHash / recent-batches JOIN (ADR 003)

---

## Product / lifecycle (battery spine)

Source: [`ROADMAP.md`](ROADMAP.md). L-01…L-13 are implemented in the working tree.

| ID | Status | Title | Done when |
|----|--------|-------|-----------|
| L-01…L-13 | **done** (uncommitted) | Integrity spine (OTP evidence, API_KEY, VC path, ACTIVATE UX, carbon blockers, tenancy, …) | Code + tests; apply **000107** |
| L-14 | **done** (local) | Apply migration 000107 | Local applied; Oracle live DB must be checked independently |
| L-15 | **done** | Wizard persists `carbon_footprint_result` | POST `/batches/{id}/carbon` after create; specs fingerprint |
| L-16 | **done** | Cert/DoC via API (S-10/S-11) | Wizard uses `/uploads/compliance-doc`; persist `path` |
| L-17 | **done** | Bulk-import CSV template matches validator | Sample rows + per-field errors + DVA/EU columns |
| L-18 | **done** | Magic-link modal circularity actions | Status-filtered catalog + role check on issue |
| L-19 | **done** | VC UI | Issue + download from batch Passports tab; GET `/passports/{uuid}/vc`; 400 tests |
| L-20 | **done** | CPCB honesty | Format-only is `format_valid`; UI distinguishes format vs registry lookup |
| L-21 | **done** | Partner OTP evidence UX | First POST stashes evidence; form errors stay on form |
| L-22 | **done** | External API lifecycle test | SHIP→INSTALL→RECYCLE via API key + wrong-role / foreign-tenant 403 |
| L-23 | **done** | Draft QR vs labels policy | QR + labels only ACTIVE/ARCHIVED; DRAFT 403 JWT + API-key + export jobs |

## Product / platform (not security sprint)

| Item | Notes |
|------|--------|
| Textile | **Out of scope.** Do not work `textile-web` / `textile-api`. |
| `admin-web` | Still placeholder; platform admin key is the interim auth for cross-tenant ops |
| `packages/ui` | Unused — do not adopt without discussion |

---

## How agents should update this file

- Flip status `todo` → `doing` when starting; `doing` → `done` when preflight/tests pass.
- Add a one-line note under the row or in CURRENT.md if blocked.
- New findings: add a row with an ID; do not bury only in chat.

## Demo P1 correctness (ADR 030)

D01–D04 are implemented on the P1 branch and pass isolated API/unit/database checks; runtime demo verification remains before merge.

| ID | Status | Change |
|---|---|---|
| D01 | done (branch) | Tenant-owned staging document references on writes and signing reads |
| D02 | done (branch) | Server-enforced public/partner visibility and document access |
| D03 | done (branch) | Atomic activation and issuance with quota and ledger |
| D04 | done (branch) | Draft publication gate and final snapshot at activation |

## Activation gate review (ADR 033)

EU/India category gating and carbon-screening copy are implemented on a draft branch. Technical tests pass; current legal wording and browser walkthrough remain before merge.

## Demo workflow (ADR 031)

D06, D07, D09, D10, and D13 are done on the workflow branch with frontend tests/typecheck; D11 is on the preceding activation branch. Manual browser verification remains before merge.
