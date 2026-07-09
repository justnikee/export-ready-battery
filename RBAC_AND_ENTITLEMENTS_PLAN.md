# RBAC, PBAC & Entitlements — Access Control Plan

**Scope:** `apps/battery-web` + `services/battery-api`
**This is the access-control source of truth.** Pricing amounts, tier economics, and the billing-model decisions live in **`PRICING_AND_PACKAGING_STRATEGY.md`**. This doc defines *how* access is gated; that doc defines *what* each tier costs and includes.
**Status:** Phase 0 ✅ done. Phase 1 ✅ done (entitlements + quota, R1 resolved). Phase 2 ✅ done (frontend gating). Phase 3 ✅ done — the expiry-enforcement gap found on 2026-07-05 re-verification was closed the same day (see below). Only one open item remains (#4, a product decision, not code).

## ✅ Closed on 2026-07-05 (re-verification + same-day fix)

Re-verifying the plan against the actual code on 2026-07-05 found R1 had already shipped (previously mis-tracked as blocked) plus two undocumented gaps. All were fixed same-day:

| # | What | Resolution |
|---|---|---|
| 1 | `QuotaService` — mis-tracked as blocked on R1 | Was already done: `ActivateBatch` (`billing_handlers.go`) meters per-**passport** (`CountPassportsByBatch` → `GetQuotaBalance` → `DeductQuota`), 402 if insufficient. Covered by `TestActivateBatch_PassportMeteredQuota`. Doc corrected. |
| 2 | Plan-expiry not enforced on read/Growth-feature routes | **Fixed.** Added `services.IsSubscriptionExpired(planStatus, expiresAt)` — one pure, tested function (`entitlements.go` + `entitlements_test.go`). New lean repo query `GetTenantSubscriptionStatus` (replaces `GetTenantPlanType`, adds `plan_status`/`subscription_expires_at` to the same round trip). `RequireFeature` now checks expiry **before** `PlanIncludes`, so an expired Growth tenant gets `402 subscription_expired` on every Growth route, not just writes. New test case in `TestRequireFeature_Gating` (Case 3). |
| 3 | Dead code: `checkActiveSubscription` / `RequireActiveSubscription` | **Deleted.** Both duplicated logic now centralized in `IsSubscriptionExpired`, used by both `checkIfOnboardingCompleted` and `RequireFeature`. The misleadingly-named `TestRequireActiveSubscription_Expired` (it never actually tested that middleware) renamed to `TestRequireOnboardingComplete_ExpiredSubscription`. |
| 5 | Stale "Batch Activation" copy vs. per-passport metering | **Fixed.** Backend: `razorpay_service.go` + `billing_handlers.go` package descriptions now say "Passport Activations". Frontend: `battery-billing-page.tsx` + `pricing-card.tsx` props renamed `batchCount`→`quotaCount`, `pricePerBatch`→`pricePerUnit`; display copy updated ("10 passports @ ₹499/passport", "passports remaining"/"passports activated"). Backend JSON field `price_per_batch` kept as-is (API-contract stability) with a comment explaining it means "per quota unit". Added a GST invoice download button per transaction row (`GET /billing/invoices/{payment_id}/download` was built but had no UI entry point). |

## Still open

| # | What | Status |
|---|---|---|
| 4 | Downgrade policy (issued DPPs stay valid after Growth→Starter downgrade) | Still an open **product** decision, not enforced in code — this is a policy call, not a bug fix |

---

## TL;DR

- Access = **`planIncludes(feature)` AND `roleAllows(action)` AND `withinQuota(meter)`** — three policy gates.
- The codebase has **three misaligned role vocabularies** and partly-broken role checks (live bugs). **Phase 0 fixes these first.**
- Formalize the scattered middleware chain into one **PolicyService** (PBAC) — a single, testable, auditable decision point.
- The server is authoritative; frontend gating is UX only.

---

## Part 1 — Current state (verified in code)

### 1.1 Three misaligned role vocabularies

| Layer | Values | Source |
|---|---|---|
| JWT `role` claim | `owner` \| `operator` \| `viewer` \| `supplier` (lowercase); registration hardcodes `"owner"` | `internal/services/auth_service.go:55`, `internal/handlers/auth_handlers.go:493` |
| Team members (DB) | `OWNER` \| `ADMIN` \| `MEMBER` \| `VIEWER` (uppercase) | `internal/models/team_member.go:38` |
| Route checks | `owner` \| `admin` \| `operator` (lowercase, mixed) | 10× `RequireRole(...)` in `cmd/server/main.go` |

`RequireRole` (`internal/middleware/auth.go:83`) is exact-match, case-sensitive.

### 1.2 Live bugs — fix in Phase 0

| Bug | Root cause | Impact | Verified |
|---|---|---|---|
| **BUG-A** | JWT emits lowercase `owner`; `dispatch-page.tsx:43` and `lifecycle-page.tsx:273` check uppercase `"OWNER"` | Real owner cannot use QR dispatch or lifecycle bulk ops — core workflows silently broken | ✅ confirmed |
| **BUG-B** | `RequireRole("owner","admin")` — `admin` never appears in a JWT | Every admin-gated route collapses to owner-only; invited ADMINs locked out | ✅ confirmed |
| **BUG-C** | Legacy `operator` referenced in `RequireRole("owner","operator")` (bulk delete) but **never emitted** anywhere | The route is stricter than intended (owner-only, not member) rather than users being stranded | ✅ corrected — `"operator"` is never assigned in backend code |
| **BUG-D** ⭐ | `Login` (`auth_handlers.go:493`) and OAuth login (`oauth_handler.go:253`) **hardcode `role = "owner"`** and key off `tenants WHERE email`; neither consults `team_members`. `AcceptInvite` sends new invitees to register their own tenant (`team_handlers.go:277`). | **RBAC role separation is not wired into auth at all.** `ADMIN`/`MEMBER`/`VIEWER` are stored but never appear in a JWT — every login is `owner`. Casing is a symptom; this is the root. | ✅ confirmed — no auth path resolves team membership or role |

### 1.2.1 Identity-model reality (BUG-D expanded)

There is **no `users` table** — identity == the `tenants` table (one email = one org = always owner). A `team_members` row links (optionally) to a `tenants` row via `user_id`, but:
- Login/OAuth always issue `tenant_id` = the caller's *own* tenant and `role` = `owner`.
- An invited member either already owns a tenant (logs into *their* org, not the inviter's) or is told to register a new tenant (as owner).
- `GetTeamMemberByEmail` needs a `tenantID`, so it's only used inside an already-authenticated tenant context, never at login.

**Consequence:** true role separation requires an identity-model decision (see revised Phase 0), not just a casing migration.

### 1.3 Plan model duplicated; no feature gating

- Tenant has both `PlanType` (STARTER/GROWTH/ENTERPRISE) and `Tier` (free/pro/enterprise) — `internal/models/models.go:96-97`. **Drop `Tier`.**
- `PlanType` currently drives **only** seat limits (`team_member.go:20`, 2/10/100).
- **No feature is plan-gated.** Every nav item in `apps/battery-web/lib/products.ts` renders for everyone; only `product_type` filters nav.
- Quota **is** enforced today, but only at **batch activation** (`billing_handlers.go:208-280`: `balance < 1` blocks, debits `balance - 1`). Passport creation is not separately gated. It is coarse and not formalized.

---

## Part 2 — The model: PBAC over three gates

Do not conflate "what the org paid for" with "what this user may do" with "how much they've used."

- **Plan (tenant entitlement)** — does this org's plan include this feature? Billing concern.
- **Role (user RBAC)** — within included features, what may this user do? Security concern.
- **Quota (usage meter)** — has the org exceeded its issuance allowance? Metering concern.

> **Effective access = plan gate AND role gate AND quota gate.**

The existing middleware chain `Protect → RequireOnboardingComplete → RequireFeature → RequireRole` **is already PBAC**, just scattered imperatively. Formalize it.

### 2.1 The five policy axes

| # | Axis | Checks | Status |
|---|---|---|---|
| 1 | Identity | JWT valid + unexpired | ✅ `Protect()` |
| 2 | Onboarding | Tenant onboarding complete | ✅ `RequireOnboardingComplete()` |
| 3 | Plan entitlement | Tenant plan includes feature | 🔴 `RequireFeature()` — planned |
| 4 | Role (RBAC) | User role allows action | ⚠️ `RequireRole()` — built, buggy (§1.2) |
| 5 | Quota | Tenant within issuance meter | 🔴 `RequireQuota()` — not formalized |

### 2.2 PolicyService (recommended)

Create `internal/services/policy.go` exposing `policy.Evaluate(ctx, feature, action) → {Allow, Deny, Reason}` composing all five axes. One source of truth; auditable and testable in one place.

**Do not** adopt OPA/Casbin yet — ~3× the cost for the same result at current scale. Go-native composition suffices until Enterprise ABAC (factory-level segmentation) is needed.

---

## Part 3 — Canonical roles

Standardize on **UPPERCASE** everywhere (least DB churn). Map legacy `operator` → `MEMBER`.

| Role | Purpose | Key powers |
|---|---|---|
| `OWNER` | Founder / billing owner | Everything + billing, delete org, transfer ownership |
| `ADMIN` | Ops / compliance lead | All data + team mgmt (except owner), compliance config, API keys — **no** billing/delete-org |
| `MEMBER` | Operator | Create/edit batches, dispatch, compliance, lifecycle — no team/billing/org-settings |
| `VIEWER` | Auditor / read-only | Read everything the plan includes; no writes |
| `supplier` | **External** persona (magic-link) — excluded from internal RBAC | |

---

## Part 4 — Definitive policy table (source of truth for implementation)

Roles: OWNER / ADMIN / MEMBER / VIEWER. **Min Plan** and **Quota** columns; feature→plan boundaries are confirmed (rationale in pricing doc).

> **Quota unit caveat:** the "Quota ✅" rows mark issuance events. Today the meter debits per **batch activation**; the pricing doc proposes a per-**passport** meter. Which unit is authoritative is an open reconciliation — see `PRICING_AND_PACKAGING_STRATEGY.md` §"Billing-model reconciliation". Wire the gate now; bind the unit once decided.

### Core platform
| Action | OWNER | ADMIN | MEMBER | VIEWER | Min Plan | Quota |
|---|---|---|---|---|---|---|
| View dashboard | ✅ | ✅ | ✅ | ✅ | STARTER | — |
| Create / edit batch | ✅ | ✅ | ✅ | — | STARTER | — |
| Archive / delete batch | ✅ | ✅ | — | — | STARTER | — |
| Dispatch QR scan | ✅ | ✅ | ✅ | — | STARTER | — |
| Activate batch / issue India DPP | ✅ | ✅ | ✅ | — | STARTER | ✅ debit |
| Bulk lifecycle transitions | ✅ | ✅ | ✅ | — | STARTER | — |
| Bulk delete passports | ✅ | ✅ | — | — | STARTER | — |

### India compliance
| Action | OWNER | ADMIN | MEMBER | VIEWER | Min Plan | Quota |
|---|---|---|---|---|---|---|
| View India compliance hub | ✅ | ✅ | ✅ | ✅ | STARTER | — |
| Upload BIS/EPR/PLI certs | ✅ | ✅ | ✅ | — | STARTER | — |
| Edit compliance config | ✅ | ✅ | — | — | STARTER | — |
| Carbon Calculator (preview class) | ✅ | ✅ | ✅ | ✅ | STARTER | — |

### EU compliance & DPP
| Action | OWNER | ADMIN | MEMBER | VIEWER | Min Plan | Quota |
|---|---|---|---|---|---|---|
| EU Compliance hub (Art.7/8/11) | ✅ | ✅ | ✅ | ✅ | GROWTH | — |
| Issue EU DPP (VC + OTS anchor) | ✅ | ✅ | ✅ | — | GROWTH | ✅ debit |
| Art.7 carbon declaration (certified) | ✅ | ✅ | ✅ | — | GROWTH | — |
| Mass Balance ledger (Art.8) — view | ✅ | ✅ | ✅ | ✅ | GROWTH | — |
| Create mass balance entry | ✅ | ✅ | ✅ | — | GROWTH | — |
| EPCIS 2.0 JSON-LD export | ✅ | ✅ | ✅ | ✅ | GROWTH | — |

### Supply chain & intelligence
| Action | OWNER | ADMIN | MEMBER | VIEWER | Min Plan | Quota |
|---|---|---|---|---|---|---|
| Suppliers & Due Diligence | ✅ | ✅ | ✅ | ✅ | GROWTH | — |
| Create corrective action | ✅ | ✅ | ✅ | — | GROWTH | — |
| DGFT claims (RoDTEP, Drawback) | ✅ | ✅ | ✅ | ✅ | GROWTH | — |
| Regulatory intelligence feed | ✅ | ✅ | ✅ | ✅ | GROWTH | — |
| Partners & magic-link buyer access | ✅ | ✅ | — | — | GROWTH | — |

### Fleet & telemetry
| Action | OWNER | ADMIN | MEMBER | VIEWER | Min Plan | Quota |
|---|---|---|---|---|---|---|
| Fleet Health & BMS Telemetry (view) | ✅ | ✅ | ✅ | ✅ | GROWTH | — |
| Register BMS device token | ✅ | ✅ | — | — | GROWTH | — |

### Developer
| Action | OWNER | ADMIN | MEMBER | VIEWER | Min Plan | Quota |
|---|---|---|---|---|---|---|
| API keys & webhooks | ✅ | ✅ | — | — | GROWTH | — |
| Tally ERP sync | ✅ | ✅ | — | — | GROWTH | — |

### Team & billing
| Action | OWNER | ADMIN | MEMBER | VIEWER | Min Plan | Quota |
|---|---|---|---|---|---|---|
| Invite / manage team members | ✅ | ✅ | — | — | STARTER | — |
| Billing / change plan / buy quota | ✅ | — | — | — | STARTER | — |
| Delete org / transfer ownership | ✅ | — | — | — | STARTER | — |

### Enterprise-only
| Action | OWNER | ADMIN | MEMBER | VIEWER | Min Plan | Quota |
|---|---|---|---|---|---|---|
| SSO / SAML | ✅ | — | — | — | ENTERPRISE | — |
| Advanced analytics + custom reports | ✅ | ✅ | ✅ | ✅ | ENTERPRISE | — |
| Multi-entity (subsidiary mgmt) | ✅ | ✅ | — | — | ENTERPRISE | — |

---

## Part 5 — Additional gaps to close

- **Quota enforcement (formalize):** `QuotaService` tracks tenant → issuance count for the current period; `RequireQuota()` returns `402 { used, limit, overage_url }`. Hard-block vs soft-overage behavior is per-plan (see pricing doc).
- **Role-change audit log:** immutable `team_audit_log` (actor, subject, old_role, new_role, timestamp) on every invite/promote/demote/remove. Enterprise buyers and EU auditors will ask for it.
- **ABAC extension path (future, do not build now):** design resource-level attributes (e.g. factory/site) into the data model so factory-A vs factory-B segmentation is possible when the first Enterprise customer needs it.
- **Downgrade vs issued artifacts (policy decision):** entitlement enforcement must distinguish "cannot issue new" from "existing DPPs stay valid" — an issued VC/OTS-anchored DPP cannot be un-issued. Define this before Phase 1.

---

## Part 6 — Implementation architecture

> **Principle: the server is authoritative. Frontend gating is UX only.**

**Backend:**
1. `internal/services/entitlements.go` — `Feature → minPlan` map (single source of truth).
2. `RequireFeature("eu_compliance")` — per-request plan lookup (cached ~60s), `402 { feature, required_plan, upgrade_url }` if not entitled. **Do not** bake plan into the JWT.
3. Standardize + fix `RequireRole` to the UPPERCASE set; add role gates to unguarded write routes.
4. Compose: `Protect → RequireOnboardingComplete → RequireFeature(x) → RequireRole(y) → RequireQuota(meter)` — ideally behind `PolicyService.Evaluate`.
5. Distinct errors: `402` (plan/quota) vs `403` (role) — different frontend UI.

**Frontend:**
1. Add `plan_type` + `role` to `/auth/me` and the `User` interface (`context/auth-context.tsx`).
2. `useEntitlements()` → `{ has(feature), can(action), plan, role }`, config mirrored from backend.
3. Extend `NavItem` (`lib/products.ts`) with `feature` + `minRole`; sidebar shows locked items with a padlock + "Available on Growth" chip (show value, don't hide).
4. Replace all ad-hoc `user.role === "..."` checks with `can(...)`; fix the 4 broken checks.
5. Upgrade interstitial for locked feature pages.

---

## Part 7 — Phased rollout

- **Phase 0a — Casing consistency (1–2 days, safe, do now).** UPPERCASE everywhere: JWT emission in `Login` + OAuth + `Register` (`owner`→`OWNER`), all 10 `RequireRole` sites in `main.go`, and the 4 frontend checks (`dispatch-page.tsx`, `lifecycle-page.tsx`, `admin/page.tsx`, `regulatory/page.tsx`). SQL migration: `UPPER(role)` on `team_members`; `operator → MEMBER`. Corrected JWT on next login. This makes the (currently all-owner) reality consistent — it does **not** by itself make ADMIN/MEMBER/VIEWER function.
- **Phase 0b — Wire team-member identity + role into auth (the real blocker; needs decision D0).** Make `Login`/OAuth resolve: email → is this an active `team_member` of some tenant? → issue JWT with that `tenant_id` + team `role`. Fix `AcceptInvite` so a member joins the inviter's tenant with credentials, instead of registering a new org. Requires deciding the identity model (see D0 below). Without 0b, every `RequireRole("OWNER","ADMIN",...)` route remains owner-only in practice.
- **Phase 1 — Plan entitlement backend.** ✅ **DONE, including quota (R1 resolved to passport).**
  - ✅ `internal/services/entitlements.go` — `Feature → minPlan` map + `PlanIncludes`/`RequiredPlan`/`EntitlementsForPlan` (unit-tested).
  - ✅ `repo.GetTenantSubscriptionStatus` — one lean query returning `plan_type` + `plan_status` + `subscription_expires_at` together (replaces the earlier `GetTenantPlanType`, which only returned plan type and couldn't see expiry).
  - ✅ `h.RequireFeature(feature)` middleware → checks expiry first (`402 subscription_expired`), then plan inclusion (`402 { feature, required_plan, current_plan, upgrade_url }`). `feat(...)` helper in `main.go`.
  - ✅ Gated all Growth routes: eu-attribute-score, dgft-claims, suppliers/due-diligence/corrective-actions/cmrt, mass-balance, fleet, telemetry (device-tokens + soh-upload; **device ingest left open** for external devices), partners, api-keys, outbound-webhooks (+deliveries/retry), tally integrations, regulatory (sources/items/alerts).
  - ✅ `/auth/me` now returns `plan_type` + `entitlements` map for frontend gating.
  - ✅ **Quota resolved and built**: `ActivateBatch` meters per-passport (`CountPassportsByBatch` → `DeductQuota`), 402 on insufficient balance. Not a separate `RequireQuota` middleware — inlined in the one route that needs it (activation). Test: `TestActivateBatch_PassportMeteredQuota`.
  - ✅ **Expiry now enforced on Growth-feature routes too** (was a gap as of 2026-07-05 morning re-verification, closed same day — see "Closed on 2026-07-05" above).
  - ✅ Dropped duplicate `tenants.Tier` column — migration `000099_drop_tenant_tier`, already applied.
- **Phase 2 — Frontend gating.** ✅ **DONE.**
  - ✅ `lib/entitlements.ts` — `Feature` type + `FEATURE_MIN_PLAN` map + `planIncludes`/`normalizePlan`/`FEATURE_LABELS` (mirrors backend exactly).
  - ✅ `hooks/use-entitlements.ts` — `useEntitlements()` hook with `has(feature)`, `requiredPlanFor`, `labelFor`.
  - ✅ `context/auth-context.tsx` — `plan_type` + `entitlements` on `User` interface (consumed from `/auth/me`).
  - ✅ `components/billing/feature-gate.tsx` — `FeatureGate` wrapper + `FeatureLocked` upgrade interstitial.
  - ✅ All 9 Growth page.tsx files wrapped with `FeatureGate`: eu-compliance, mass-balance, due-diligence, fleet, dgft-claims, telemetry, partners, developer, regulatory.
  - ✅ `lib/products.ts` — `NavItem` type extended with `feature?: Feature`; all Growth nav items tagged.
  - ✅ `components/dashboard/DashboardSidebar.tsx` — lock icon + "Growth" badge on locked nav items via `useEntitlements`.
  - ✅ `lib/rbac.ts` — shared `isAdminRole()`/`isOwnerRole()`/`canWrite()` helpers; replaces 4 ad-hoc inline checks.
  - ✅ Replaced ad-hoc `user.role === "OWNER" || user.role === "ADMIN"` in: `admin/page.tsx`, `regulatory/page.tsx`, `battery-dispatch-page.tsx`, `battery-lifecycle-page.tsx`.
- **Phase 3 — Hardening.** ✅ **DONE** (expiry-enforcement gap found on 2026-07-05 re-verification closed same day).
  - ✅ Database migrations `000098_create_team_audit_log`, `000099_drop_tenant_tier`, `000100_add_subscription_expiries` (`plan_status`, `subscription_expires_at` on `tenants`).
  - ✅ `models.TeamAuditLog` struct and updated `models.Tenant` model.
  - ✅ `RepositoryInterface` and `MockRepository` extended with `CreateTeamAuditLog`, `UpdateTenantSubscription`, `GetTenantSubscriptionStatus`.
  - ✅ Integrated audit logging inside `InviteUser`, `RemoveTeamMember`, `UpdateTeamMemberRole`, `AcceptInvite`, and invite registration flows.
  - ✅ Razorpay purchase flow (`razorpay_handlers.go` + webhook path) now stamps `plan_type` + a `subscription_expires_at` + `plan_status='ACTIVE'` on every successful payment — a lightweight time-boxed plan window layered on the existing one-time-purchase model. **This is not full recurring billing** (no Razorpay Subscriptions/autopay mandate — nothing auto-charges at expiry; the tenant just silently loses Growth access unless they buy again). Partially addresses pricing-doc R2. **2026-07-06:** window length is now per-SKU (`QuotaPackage.BillingCycleDays`) — 30 days for monthly tiers, 365 for the new annual tiers (`starter-annual`/`growth-annual`, see `PRICING_AND_PACKAGING_STRATEGY.md` §3) — not hardcoded to 30.
  - ✅ Expiry is now enforced consistently on **both** write routes (`RequireOnboardingComplete`) and Growth-feature routes including reads (`RequireFeature`), via the single shared `services.IsSubscriptionExpired`.
  - ✅ Integration test suite in `access_control_integration_test.go` verifying role gates (VIEWER gets 403), entitlement gates (STARTER gets 402 on Growth features, expired Growth gets 402 subscription_expired), audit log creation on team changes, passport-metered quota, and write-route expiry (`TestRequireOnboardingComplete_ExpiredSubscription`).
  - ✅ Quota reporting UI (billing page) copy updated to match passport-based metering (was describing the old batch-based meter).
  - ✅ GST invoice download wired into the billing page (backend endpoint existed but had no UI entry point).
  - 🔴 **Trial-expiry auto-downgrade flow** — `plan_status` supports `TRIAL` as a value in comments but no code path sets it or handles trial-to-Starter transition. Still not built (blocked on pricing-doc R3, unchanged).

---

## Open decisions (access-control side)

0. **D0 — Identity model for team members.** ✅ **Decided: Option A — real `users` table** with a user↔tenant membership join. Design in "Phase 0 identity refactor" below.
1. **Role casing** — ✅ confirmed UPPERCASE.
2. **Plan-change latency** — instant per-request lookup (recommended) vs one token refresh.
3. **Downgrade policy** — already-issued DPPs stay valid while new issuance is blocked? (still undecided/unenforced)
4. **Quota unit** — ✅ resolved: **passport**. `ActivateBatch` meters per-passport-in-batch.

---

## Phase 0 identity refactor design (D0 = users table)

Today `tenants` conflates **identity** (email, password_hash, oauth_provider, email_verified, reset_token, reset_token_expires, last_login) with **org** (company, compliance numbers, quota, plan, onboarding). We separate them and make membership+role authoritative, using **expand → migrate → contract** so nothing breaks mid-flight.

### Target schema
- **`users`** — `id, email UNIQUE, password_hash, oauth_provider, email_verified, reset_token, reset_token_expires, last_login, created_at`.
- **`memberships`** — evolve the existing `team_members` into the membership table: `user_id → users(id)`, `tenant_id → tenants(id)`, `role` (OWNER/ADMIN/MEMBER/VIEWER), `status`, invite fields, `UNIQUE(tenant_id, user_id)`. `team_members` already has `tenant_id, email, role, status, user_id` — reuse it.
- **`tenants`** keeps org columns; auth columns become legacy (dropped in the contract step).

### Migration (000097, expand — additive, reversible)
1. Create `users`.
2. Backfill: one `users` row per existing tenant (copy email + password_hash + oauth_provider + email_verified + reset_token + last_login).
3. Ensure each tenant has an owner membership: upsert a `team_members` row `{tenant_id, email, role: 'OWNER', status: 'ACTIVE', user_id: <new user>}`.
4. Link already-accepted invited members to `users` rows (create users for accepted invitee emails without a tenant of their own).
5. **Down:** drop `users`; remove synthesized OWNER membership rows. Tenants auth columns untouched, so rollback is clean.

### Auth rewrite (after migration)
- **Login/OAuth:** authenticate against `users` (email + password / oauth). Resolve `memberships WHERE user_id = ? AND status = 'ACTIVE'`. Issue JWT `{ tenant_id, role }` (UPPERCASE) for the selected membership.
- **Multi-membership:** if a user belongs to >1 tenant, default to the OWNER membership (or most-recent); add a `GET /auth/tenants` + `POST /auth/switch-tenant` for tenant switching (can be a fast follow).
- **Register:** create `users` row + `tenants` row + owner membership in one transaction.
- **AcceptInvite:** create/link a `users` row (set password if new) and flip the membership to `ACTIVE` in the **inviter's** tenant — **do not** create a new tenant.
- **Refresh:** keep role+tenant from claims (already correct once Login emits them).

### Sequencing (matches todo list)
Migration → models/repo (`GetUserByEmail`, membership resolution) → auth rewrite → AcceptInvite fix → casing pass (RequireRole + frontend) → verify. Casing lands **with** the auth rewrite (Login must emit UPPERCASE at the same commit the route checks switch), so 0a and 0b ship together.

### Contract step (later, separate migration)
Once auth reads exclusively from `users`, drop the legacy auth columns from `tenants`. Not part of the initial ship.

## Key files

| Concern | File |
|---|---|
| Role middleware | `services/battery-api/internal/middleware/auth.go` |
| Route wiring / `RequireRole` sites | `services/battery-api/cmd/server/main.go` |
| Role + seat + plan constants | `services/battery-api/internal/models/team_member.go` |
| Tenant `PlanType` / `Tier` | `services/battery-api/internal/models/models.go` |
| JWT role emission | `services/battery-api/internal/services/auth_service.go`, `internal/handlers/auth_handlers.go` |
| Quota debit today | `services/battery-api/internal/handlers/billing_handlers.go` (ActivateBatch) |
| Team management | `services/battery-api/internal/handlers/team_handlers.go` |
| Nav / feature map | `apps/battery-web/lib/products.ts` |
| User/session | `apps/battery-web/context/auth-context.tsx` |
| Ad-hoc role checks to replace | `app/dashboard/admin/page.tsx`, `app/dashboard/regulatory/page.tsx`, `components/dispatch/battery-dispatch-page.tsx`, `components/lifecycle/battery-lifecycle-page.tsx` |
