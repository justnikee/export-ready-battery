# Backlog (agent-oriented)

Ordered work agents should pick from when the user says “continue” / “next issue” without a new topic.  
Source of truth for security/perf detail: [`docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md`](../docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md).

**Legend:** `todo` · `doing` · `done` · `blocked`

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

## Product / platform (not security sprint)

| Item | Notes |
|------|--------|
| Textile stack | Mirror battery; branch history may say `feat/textile-foundation` — verify current branch |
| `admin-web` | Still placeholder; platform admin key is the interim auth for cross-tenant ops |
| `packages/ui` | Unused — do not adopt without discussion |

---

## How agents should update this file

- Flip status `todo` → `doing` when starting; `doing` → `done` when preflight/tests pass.
- Add a one-line note under the row or in CURRENT.md if blocked.
- New findings: add a row with an ID; do not bury only in chat.
