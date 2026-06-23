# Full-Stack Code Review — ExportReady Battery

**Date:** 2026-06-10
**Scope:** `services/battery-api` (Go, ~240 source files, 130+ routes in `cmd/server/main.go`) and `apps/battery-web` (Next.js 16 / React 19, axios-based API layer).

**Overall assessment:** The backend is generally well-built — parameterized SQL everywhere, tenant-scoped queries with explicit IDOR guards, bcrypt password/API-key hashing, HS256 JWT with `alg` confusion protection, rate limiting, security headers, graceful shutdown. Most findings below are at the edges: deployment config, a token-in-query-string fallback, a few unprotected public routes, and frontend resilience gaps.

---

## 1. Issue Table (sorted by severity)

| Severity | Category | File | Description |
|---|---|---|---|
| **Critical** | Security / Connection | `apps/battery-web/vercel.json:17-25` | Sets `Access-Control-Allow-Origin: *` **together with** `Access-Control-Allow-Credentials: true` on all `/api/*` Vercel routes. This combination is rejected by browsers and, where honored, is a serious CSRF/credential-exposure misconfiguration. It also contradicts the carefully whitelisted CORS in the Go API. |
| **Critical** | Config | `apps/battery-web/vercel.json:7-16` | Production rewrites point at placeholder hosts `https://battery-api.yourdomain.com` and `https://api.yourdomain.com`. If deployed as-is, all proxied API calls 404 / leak to a domain you may not own. |
| **High** | Security | `services/battery-api/internal/middleware/auth.go:51-54` | `Protect` accepts the JWT from a `?token=` query parameter as a fallback. Access tokens in URLs leak via browser history, server/proxy logs, and `Referer` headers. Comment says it's for `window.open`/PDF viewing. |
| **High** | Security | `services/battery-api/cmd/server/main.go:381-382` | `POST /api/v1/supplier/login` and `POST /api/v1/suppliers/accept` are registered directly on `mux`, **outside** the `authRateLimiter` that wraps `/api/v1/auth/`. Supplier credentials/invite tokens are brute-forceable without rate limiting. |
| **High** | Error Handling | `apps/battery-web/app/` (no `error.tsx` / `global-error.tsx`) | There is no React error boundary anywhere in the App Router tree. Any render-time exception in a dashboard page white-screens the entire app instead of showing a recoverable fallback. |
| **High** | Security | `apps/battery-web/lib/api.ts:23,55,105` | Access token is stored in `localStorage`. Combined with `script-src 'unsafe-inline'` in the production CSP (`next.config.ts:18`), any XSS can exfiltrate the bearer token. The refresh token is correctly HttpOnly — the access token should follow the same model or at least not pair with `unsafe-inline`. |
| **Medium** | Security | `services/battery-api/internal/handlers/razorpay_handlers.go:56-117` | `VerifyRazorpayPayment` has no idempotency/replay guard. A valid `(order_id, payment_id, signature)` triple re-POSTed credits quota again via `AddQuota`. No check that the payment ID was already processed. |
| **Medium** | Security / Data | `services/battery-api/internal/models/models.go:377` + `supplier_handlers.go:249` | `Supplier.InvitationToken` is serialized (`json:"invitation_token,omitempty"`) and returned by `GET /api/v1/suppliers` to the whole tenant team. The active invite/login token should not be exposed in a list response. |
| **Medium** | Connection / Config | `apps/battery-web/components/dashboard/battery-dashboard-page.tsx:220-229` | Frontend sends `?tenant_id=${user.tenant_id}` on `/dashboard/stats`, `/batches`, `/scans/feed`, but the handlers ignore it and use the JWT tenant (`dashboard_handlers.go:16`). Dead/misleading param that implies client-controlled tenant selection. |
| **Medium** | Performance | `apps/battery-web/components/dashboard/battery-dashboard-page.tsx:221` | Dashboard fetches `/batches?limit=200` (full rows incl. specs JSON) purely to compute charts/compliance counts client-side. Should use a server-side aggregate endpoint; `GetDashboardStats` already exists for stats. |
| **Medium** | Security | `services/battery-api/uploads/**` (committed) | Real tenant-uploaded compliance PDFs and logos (e.g. `uploads/12e20b08-.../bis.pdf`, `epr.pdf`, `pli.pdf`, `logo.png`) are committed to git. `.env` files are correctly gitignored, but these customer documents are in history. |
| **Medium** | Code Quality | `services/battery-api/cmd/server/main.go:905-906` | `Access-Control-Allow-Methods` is set twice with the identical value — copy-paste dead line. |
| **Low** | Performance | `services/battery-api/internal/repository/analytics.go:121-140` | `certificateExpirySummary` runs 4 sequential queries in a loop (one per cert type). Bounded (4), but combinable into a single query with `FILTER` clauses. |
| **Low** | Data Validation | `services/battery-api/internal/handlers/ai_handlers.go:62-73` | `ParseDatasheet` decodes `req.Text` and forwards to the LLM with no max-length/empty check, so an arbitrarily large body (up to the 10 MB `MaxBytesReader` cap) is sent to Groq per request. |
| **Low** | Code Quality | `services/battery-api/` root | Stray build/dev artifacts tracked or present: `server.exe`, `server_output.txt`, `server_errors.txt`, `_patch_handler.py`, `apply_magic_link_fix.ps1`, `restart_backend.ps1`, `fake_*_cert.pdf`, `test_labels.pdf`. Clutter; some should be gitignored. |
| **Low** | Config | `apps/battery-web/.env.local.example` | `JWT_SECRET` is documented as a **frontend** env var (the proxy needs it to verify token product claims, `proxy.ts:22-32`). Sharing the signing secret with the frontend runtime widens its blast radius; consider verifying via a backend call or an asymmetric (RS256) key instead. |
| **Low** | Testing | `apps/battery-web` (32 test files) vs backend | No contract/integration tests assert request/response **shape** parity between the axios layer and Go handlers; mismatches like the `tenant_id` param go undetected. |

---

## 2. Verified-correct (checked, no issue found)

So you know these were actually inspected, not skipped:

- **SQL injection:** Parameterized throughout. Dynamic `WHERE` clauses in `dgft_claims.go`, `suppliers.go`, `telemetry.go` all use `$N` placeholders, not string interpolation of user data.
- **Multi-tenant IDOR:** Tenant guards present — `GetBatch` (`batch_handlers.go:327`) extracts tenant from JWT, plus a cross-product check at `:353`.
- **Quota race:** `DeductQuota` is atomic (`UPDATE ... WHERE quota_balance > 0 RETURNING`, `tenant.go:249`).
- **JWT algorithm confusion:** `ValidateToken` rejects non-HMAC algorithms (`auth_service.go:157`).
- **API keys:** bcrypt-hashed with O(1) prefix lookup (`apikey_auth.go`, `apikey_service.go`).
- **Refresh cookie:** HttpOnly, Secure-in-prod, SameSite (`auth_handlers.go:107`).
- **Path traversal:** Uploads handler guards against `..` (`main.go:610`).
- **Prod config:** Production requires `JWT_SECRET` and `CORS_ORIGINS`, errors out if missing (`config.go:71,85`).
- **Pagination:** Present on list endpoints (`ListBatches` `batch_handlers.go:273`, capped at 200).
- **Secrets:** `.env` and `.env.local` are gitignored and were never committed.
- **CORS (API):** Origin whitelist with O(1) map lookup, not wildcard (`main.go:884-917`).

---

## 3. Top 5 Priority Fixes

### 1. Remove the wildcard-CORS-with-credentials in `vercel.json` (Critical)
`apps/battery-web/vercel.json:17-25` currently:
```json
"headers": [
  { "source": "/api/(.*)", "headers": [
    { "key": "Access-Control-Allow-Credentials", "value": "true" },
    { "key": "Access-Control-Allow-Origin", "value": "*" }
  ]}
]
```
CORS for the API is already handled (correctly, with an origin whitelist) by the Go backend in `cmd/server/main.go:884-917`. Delete this `headers` block entirely so the browser-rejected `*` + credentials combo is gone, and fix the placeholder rewrite hosts in the same file (`battery-api.yourdomain.com` → your real API origin, ideally from an env var).

### 2. Drop the `?token=` JWT fallback, or scope it tightly (High)
`services/battery-api/internal/middleware/auth.go:51-54`:
```go
// Fallback to query parameter (needed for window.open / pdf viewing)
if tokenString == "" {
    tokenString = r.URL.Query().Get("token")
}
```
Tokens in query strings end up in logs and `Referer` headers. Preferred fix: remove this fallback and have the frontend fetch the PDF/blob with an `Authorization` header then `window.open(URL.createObjectURL(blob))`. If a query token must stay for download links, gate it to only the download/export GET routes and issue a short-lived, single-purpose token rather than the full access token.

### 3. Put supplier auth routes behind the rate limiter (High)
`services/battery-api/cmd/server/main.go:381-382` registers them on the bare mux. Wrap them like the other auth routes:
```go
// add to authMux (which is wrapped by authRateLimiter at line 295)
authMux.HandleFunc("POST /api/v1/suppliers/accept", h.AcceptSupplierInvitation)
authMux.HandleFunc("POST /api/v1/supplier/login", h.SupplierLogin)
// remove the two bare mux.Handle(...) registrations at 381-382
```
(Note `/api/v1/supplier/...` vs `/api/v1/suppliers/...` prefixes — confirm the `authMux` pattern covers both, or wrap each individually with `authRateLimiter.Limit(...)`.)

### 4. Add a React error boundary (High)
There is no `error.tsx` anywhere under `apps/battery-web/app/`. Add at minimum `app/global-error.tsx` and `app/dashboard/error.tsx`:
```tsx
// apps/battery-web/app/dashboard/error.tsx
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-semibold">Something went wrong loading this page.</h2>
      <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      <button onClick={reset} className="mt-4 underline">Try again</button>
    </div>
  );
}
```
This prevents a single render exception (e.g. an unexpected null in a chart) from white-screening the whole dashboard.

### 5. Make Razorpay verification idempotent (Medium, but financial)
`services/battery-api/internal/handlers/razorpay_handlers.go:104-117` calls `AddQuota` after signature verification with no replay guard. Record processed payments and short-circuit duplicates inside a transaction:
```go
// after signature verification, before AddQuota:
already, err := h.repo.PaymentAlreadyProcessed(r.Context(), req.PaymentID)
if err != nil {
    respondError(w, http.StatusInternalServerError, "verification failed"); return
}
if already {
    respondJSON(w, http.StatusOK, map[string]any{"status": "already_processed"}); return
}
// Then: in ONE transaction — insert payment_id (unique constraint) + AddQuota + log Transaction.
```
A `UNIQUE` constraint on `payment_id` in the transactions table is the durable backstop so a race can't double-credit.

---

## 4. Additional Notes

**On the `tenant_id` query params (Medium item):** they're harmless today because every handler derives the tenant from the JWT, but they read like client-controlled tenant selection and will mislead the next developer. Strip them from the axios calls in `battery-dashboard-page.tsx` and friends, and consider a small contract test (the repo already has `msw` installed) asserting the dashboard's expected response shape so the gap between client expectations and `dashboard_handlers.go` is caught in CI.
