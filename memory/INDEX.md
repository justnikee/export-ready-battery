# ExportReady — Memory Index

Start here only for **map + links**. Live priorities: **[`CURRENT.md`](CURRENT.md)**.

---

## Quick links

| Need | File |
|------|------|
| What are we doing now? | [CURRENT.md](CURRENT.md) |
| Product direction | [ROADMAP.md](ROADMAP.md) |
| Industry / regulation / product briefing | [INDUSTRY_PRODUCT_BRIEFING.md](INDUSTRY_PRODUCT_BRIEFING.md) |
| First-customer GTM | [PRODUCT_GTM_PLAN.md](PRODUCT_GTM_PLAN.md) |
| Hard rules | [rules.md](rules.md) |
| Ordered open work | [backlog.md](backlog.md) |
| Session handoffs | [sessions/](sessions/) |
| Decisions (ADRs) | [decisions/](decisions/) |
| Session template | [templates/session.md](templates/session.md) |
| Product/build behavior | [`CLAUDE.md`](../CLAUDE.md) |
| Agent workflow | [`AGENTS.md`](../AGENTS.md) |
| Security/perf audit | [`docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md`](../docs/BATTERY_SECURITY_PERFORMANCE_AUDIT.md) |

---

## Product (one paragraph)

Multi-tenant SaaS for Indian **battery** manufacturers exporting to EU/global. Issues Digital Product Passports (BPAN V2, QR, W3C VCs), India + EU compliance checks, OpenTimestamps anchoring. Textile is present in the monorepo but **out of scope**.

**Build state:** active development; breaking changes OK; do not destroy dev DB data without asking.

---

## Monorepo map

| Path | Role |
|------|------|
| `apps/battery-web` | Primary manufacturer UI (Next 16, React 19, TanStack Query) |
| `apps/marketing-web` | Marketing site |
| `apps/textile-web` | Present; **do not work** |
| `services/battery-api` | Battery domain API ~230 routes, workers |
| `services/platform-core` | Auth/teams/billing JWT issuer (:8081) |
| `services/textile-api` | Present; **do not work** |
| `packages/ui`, `packages/types` | Shared packages — **ui largely unused** |

---

## Key entry points (battery)

| Area | Location |
|------|----------|
| Route wiring + workers | `services/battery-api/cmd/server/main.go` |
| Lifecycle engine | `services/battery-api/internal/services/lifecycle.go` |
| Models / BatchSpec | `services/battery-api/internal/models/models.go` |
| Repository | `services/battery-api/internal/repository/` |
| Compliance registry | `services/battery-api/internal/compliance/` |
| Auth middleware | `services/battery-api/internal/middleware/auth.go` |
| Platform admin key | `services/battery-api/internal/middleware/admin_auth.go` |
| Frontend API + tokens | `apps/battery-web/lib/api.ts` |
| Frontend queries | `apps/battery-web/hooks/use-queries.ts` |
| Edge proxy | `apps/battery-web/proxy.ts` |

---

## ADRs

| # | Title |
|---|--------|
| [001](decisions/001-harness-setup.md) | Graphify + memory vault harness |
| [002](decisions/002-advanced-analytics-growth-tier.md) | Advanced analytics growth tier |
| [003](decisions/003-backend-performance-optimizations.md) | Backend/web performance optimizations |
| [004](decisions/004-s01-platform-admin-doc-verify.md) | Platform admin key for document verification (S-01) |
| [005](decisions/005-agent-memory-harness-v2.md) | Agent memory harness v2 (session-useful) |
| [006](decisions/006-s02-require-write-rbac.md) | Server-side RequireWrite for tenant mutations (S-02) |
| [007](decisions/007-s03-platform-jobs-admin-key.md) | Platform admin key for global job triggers (S-03) |
| [008](decisions/008-s04-webhook-ssrf.md) | Outbound webhook SSRF protection (S-04) |
| [009](decisions/009-s05-supplier-httponly-session.md) | Supplier portal HttpOnly session (S-05) |
| [010](decisions/010-s06-no-jwt-in-query.md) | No session JWT in query strings (S-06) |
| [011](decisions/011-s07-tenant-scoped-alert-mutations.md) | Tenant-scoped alert mutations (S-07) |
| [012](decisions/012-s08-proxy-jwt-verify.md) | Edge proxy verifies JWT, not cookie presence (S-08) |
| [013](decisions/013-s09-trusted-client-ip.md) | Trusted client IP for rate limits (S-09) |
| [014](decisions/014-s10-private-compliance-certs.md) | Private compliance certificates + signed URLs (S-10) |
| [015](decisions/015-s11-upload-magic-bytes.md) | Upload content validation via magic bytes (S-11) |
| [016](decisions/016-s12-regulator-key-model.md) | Scoped regulator API keys + access audit (S-12) |
| [017](decisions/017-s13-password-policy.md) | Password policy on register/reset (S-13) |
| [018](decisions/018-s14-register-email-enumeration.md) | No email-enumeration oracle on register (S-14) |
| [019](decisions/019-s15-csp-nonces.md) | Nonce-based CSP without script unsafe-inline (S-15) |
| [020](decisions/020-p01-db-pool-defaults.md) | DB pool defaults for API + workers (P-01) |
| [021](decisions/021-p02-list-limit-cap.md) | Hard-cap list pagination limit (P-02) |
| [022](decisions/022-p03-external-labels-cap.md) | Cap external label PDF at maxDownloadLimit (P-03) |
| [023](decisions/023-p04-global-api-rate-limit.md) | Global + per-tenant API rate limiting (P-04) |
| [024](decisions/024-p05-sync-export-gates.md) | Gate synchronous heavy exports (P-05) |
| [025](decisions/025-p06-upload-body-limits.md) | Unified HTTP body / multipart upload limits (P-06) |
| [026](decisions/026-p07-market-region-filter.md) | Server-side batch market_region list filter (P-07) |
| [027](decisions/027-p08-dashboard-bootstrap.md) | Dashboard bootstrap endpoint (P-08) |
| [032](decisions/032-credits-plan-term-and-payment-fulfillment.md) | Credits, plan term and atomic payment fulfillment |

---

## ADRs (recent security/perf sprint)

Latest correctness decision: [ADR 030 — atomic issuance and enforced passport privacy](decisions/030-atomic-issuance-and-passport-privacy.md).
Activation gate decision: [ADR 033 — activation gate and carbon screening labels](decisions/033-activation-gate-and-carbon-screening.md).
Session refresh decision: [ADR 031 — coordinated battery-web session refresh](decisions/031-coordinated-battery-refresh.md).
Full table above. Latest for this sprint: **004–027** (S-01…S-15 + P-01…P-08).

---

## Agent harness health

| Piece | Role |
|-------|------|
| `AGENTS.md` | Session start/end + task protocol |
| `CLAUDE.md` | Commands, architecture, pitfalls |
| `memory/*` | Live state, rules, backlog, ADRs, sessions |
| `graphify-out/` | Local symbol graph (gitignored; run `graphify update .`) |
| `.claude/skills/preflight` | Deterministic gates |
| `.claude/skills/verify` | Runtime drive checklist |

**Session start:** read `CURRENT.md` → last handoff session → `rules.md` as needed.  
**Session end:** update **CURRENT**, **backlog**, **session** log; decisions → **ADR**; `graphify update .` if structure changed.

**Tomorrow’s start task:** Apply `000107`, then ROADMAP L-15 or L-16 — see [ROADMAP.md](ROADMAP.md).
