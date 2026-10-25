# Current focus

> **Agents: read this first every session.** Keep it short. Update when priorities shift.

**Last updated:** 2026-09-01  
**Last session:** [sessions/2026-10-25-billing-credit-and-payment-fix.md](sessions/2026-10-25-billing-credit-and-payment-fix.md)
**Prior:** [sessions/2026-09-01-industry-product-briefing.md](sessions/2026-09-01-industry-product-briefing.md)  
**Industry briefing:** [`INDUSTRY_PRODUCT_BRIEFING.md`](INDUSTRY_PRODUCT_BRIEFING.md) (sources verified; do not use the 2023-07-28 ELI as current law)  
**Spine plan:** [`PRODUCT_SPINE_FIX_PLAN.md`](PRODUCT_SPINE_FIX_PLAN.md) (PR 1–4 done)  
**GTM plan:** [`PRODUCT_GTM_PLAN.md`](PRODUCT_GTM_PLAN.md) — G2 mock top-up **done** (ADR 029)  
**Scope:** battery-web + battery-api only. Textile is out of scope.

---

## Now

**Billing (2026-10-25):** Passport credits survive plan expiry; plan-only features still expire. Razorpay verify and webhook now validate captured provider records and share atomic, idempotent fulfillment. See [ADR 032](decisions/032-credits-plan-term-and-payment-fulfillment.md) and the [session](sessions/2026-10-25-billing-credit-and-payment-fix.md). API tests/vet and web tests/typecheck pass. Live provider sandbox checkout and UI verification remain before production rollout.

1. **Prod login (2026-09-01):** Google `/login?error=oauth_session` + `/battery/*` email 404s. Code fix in tree; **needs Google Console redirect URI + Vercel + Oracle deploy** — see [sessions/2026-09-01-login-oauth-session.md](sessions/2026-09-01-login-oauth-session.md).
2. **Primary audit track complete:** S-01…S-15 + P-01…P-08.
   - Audit: [`docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md`](../docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md)
   - Backlog: [`backlog.md`](backlog.md)

| ID | Status | Notes |
|----|--------|--------|
| **S-01…S-15** | **Done** | ADRs 004–019 |
| **P-01…P-08** | **Done** | ADRs 020–027 |
| **S-16+** | Open (info) | Lower-priority audit notes |

---

## Do not

- Do not re-open S-01 as “tenant OWNER verifies docs” — platform key only.
- Do not put `RequireWrite` on supplier portal routes (use `RequireRole("supplier")`).
- Do not expose `ADMIN_API_KEY` via `NEXT_PUBLIC_*` or tenant admin UI.
- Do not weaken webhook SSRF (`ValidateOutboundWebhookURL` / safe dialer) for convenience.
- Do not store supplier or manufacturer access tokens in `localStorage`.
- Do not accept session JWT from `?token=` in Protect (S-06 / ADR 010).
- Do not accept uploads on extension/MIME alone — use `RequirePDF` / `DetectAllowedDocMIME` (S-11 / ADR 015).
- Do not treat env `REGULATOR_API_KEY` as the long-term Art. 78 model — use DB-scoped keys (S-12 / ADR 016).
- Do not accept passwords under 12 chars / without letter+digit — use `ValidatePassword` (S-13 / ADR 017).
- Do not return `409 Email already registered` on register — generic 202 + account-exists email (S-14 / ADR 018).
- Do not reintroduce `script-src 'unsafe-inline'` — use proxy nonces + `strict-dynamic` (S-15 / ADR 019).
- Do not set `DB_MAX_CONNS` so high that `instances × max` exceeds Supabase pooler (P-01 / ADR 020).
- Do not accept unbounded list `limit` — use `ParseQueryLimit` / max 200 (P-02 / ADR 021).
- Do not sync-export >`maxDownloadLimit` (500) passports (QR/labels/CSV/audit) — use export-jobs (P-03/P-05 / ADR 022/024).
- Do not remove global/tenant API rate limits (P-04 / ADR 023).
- Do not advertise multipart limits above `limits.MaxRequestBodyBytes` (10 MiB) (P-06 / ADR 025).
- Do not client-filter market regions when `?market_region=` exists — filter server-side (P-07 / ADR 026).
- Do not re-split dashboard first paint into stats+chart+recent GETs — use `/dashboard/bootstrap` (P-08 / ADR 027).
- Do not run `schema-reset-*` or edit applied migrations without explicit user ask.
- Do not treat root `docs/*` master plans as current truth without checking code.
- Do not pick up textile work (`textile-web`, `textile-api`, L-24). Battery only.
- Do not reintroduce `POST /billing/top-up` on tenant JWT — quota only via Razorpay (ADR 029).

---

## Next concrete task

1. **Battery DPP spine complete** (L-01…L-23) in git. Do **not** add more product surfaces.
2. GTM P0 remaining: slim nav (G6), strip fake landing stats (G1). G2 mock top-up **done**. Factory-gate SoH **done** (generate 100% + Lifecycle update).
3. Apply `000107` + `000108` on the **Oracle** battery DB if that environment is behind local.
4. Commercial: 15-account ICP list + 90-day paid pilot SKU (partners + EU + API included).

---

## Env notes

- `ADMIN_API_KEY` on battery-api for platform verify-doc + regulator key admin.
- Never `NEXT_PUBLIC_*` for admin/regulator secrets.
- Migration `000106_regulator_api_keys` before admin regulator-key routes.
- Prefer DB regulator keys; env `REGULATOR_API_KEY` = global bootstrap only.
- `DB_MAX_CONNS` defaults to 20 — size against pooler across replicas.
