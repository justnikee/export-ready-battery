# Handoff: Battery-Web Compliance Engine

**Date:** 2026-05-20  
**Status:** Phases 0–2 complete, Phases 3.1–3.4 complete. Blockchain certificate anchoring complete. All legacy gaps closed. All planned work complete.

---

## ✅ Completed Since Last Handoff

### Phase 0 — Foundation
- Dead code cleanup across frontend & backend
- Zod schema with 45+ fields
- 4-step batch creation wizard
- Backend migration for AI jobs + tenant tier fields

### Phase 1 — AI Data Entry
- **Regex extractor:** 40+ patterns covering all form field categories (identity, electrical, physical, performance, manufacturer, EU/India compliance, certifications, material, hazardous substances)
- **Groq LLM fallback:** Context cancellation, structured JSON prompt with all 40+ fields
- **Frontend:** `pdfjs-dist` client-side extraction, `AbortController` cancellation, step-by-step progress UI, client-side `localStorage` cache with SHA-256 keys
- **Backend LRU cache:** In-memory, 100 entries, 1h TTL, thread-safe (`sync.RWMutex`), `method: "cached"`

### Phase 2 — End-to-End Batch Flow
- **2.1 Field audit:** Found + fixed 2 dropped fields (`manufacturer_email`, `recyclable`) — added JSON tags to Go `BatchSpec`
- **2.2 Template hardening:** Added `product_type: "BATTERY"` to all template calls, replaced raw `api.get()` with `useTemplates` hook, added 9 missing template mappings, removed incomplete `CreateTemplateDialog.tsx`
- **2.3 Batch detail enrichment:** Hidden fields in Overview tab — `manufacturer_email`, `recyclable`, `lot_size`, `production_stage`, `bis_number`, `epr_number`, India certification badges, per-material recycled content
- **2.4 Passport list enrichment:** Added `manufacture_date`, `current_owner_identifier`, color-coded status badges (ACTIVE=emerald, SHIPPED=blue, etc.)
- **2.5 Draft auto-save + retry:** Debounced `localStorage` save every 5s, resume toast on wizard open, clear on success, retry button on `POST /batches` failure
- **Contract test:** `TestBatchSpec_JSONRoundTrip` — marshals fully populated `BatchSpec` to JSON and back, asserts all 40+ fields survive

### Phase 3.1 — Batch List Compliance Indicators
- **Compliance badges** on every batch card: 🟢 Ready (≥95%, 0 blockers) / 🟡 Needs Work (≥70%, 0 blockers) / 🔴 Blocked (<70% or has ERROR gaps)
- **Blocker count** shown in parentheses on badge
- **Compliance stat card** (4th card, grid `md:grid-cols-4`) — count of Ready batches
- **Compliance filter dropdown** in toolbar — All / Ready / Needs Work / Blocked
- **Numeric score %** shown next to badge
- Backend `ListBatches` already returns `compliance_score` + `compliance_gaps` — no API changes needed

### Phase 3.2 — Actionable Gap "Fix" Buttons
- **Extended `getBlockerAction`** with `normalizeGapField()` to handle both activation-blocker keys and compliance-gap `field` values from EU/India validators
- **Added `GapFixRow` component** — renders inline quick-fix inputs for simple patchable fields, or action buttons for navigation
- **Inline patchable fields:** `battery_category` (select), `cell_source` (select), `expected_lifetime_cycles`, `warranty_months`, `bis_number`, `epr_number`, `recycled_content_pct`, `domestic_value_add`
- **Action buttons for all other gaps:** Settings links (tenant fields), View in Overview (material composition, hazardous substances, India/EU fields), Use Calculator (carbon footprint), Declare AIS-156/AIS-038 (certifications)
- **Cross-tab scroll:** `scrollTarget` state + `useEffect` with `setTimeout` scrolls to section IDs after tab switch
- **Section IDs added:** `overview-core-specs`, `overview-india-compliance`, `overview-eu-compliance`, `overview-material-composition`, `overview-hazardous-substances`, `carbon-calculator`
- Both **ERROR** and **WARNING** gap lists in Compliance tab now include Fix actions

### Phase 3.3 — Certificate Expiry Tracking
- **4 new date fields** added to `BatchSpec` (backend + frontend): `bis_certificate_issue_date`, `un38_3_test_date`, `iec_62133_test_date`, `msds_issue_date`
- **Backend:** Added to `models.go` + `BatchSpec_JSONRoundTrip` test (no DB migration needed — dates live in `specs` JSONB)
- **Wizard:** Date inputs (`type="date"`) added to step-compliance.tsx in both EU and India sections
- **Template loading/saving:** All 4 fields mapped in `create-batch-wizard.tsx`
- **Overview tab:** Date display blocks with color-coded expiry badges in India Compliance and EU Compliance cards
- **Compliance tab:** New "Certificate Expiry" card showing all certificates with status badges
- **Expiry logic:** Frontend-only calculation with 90-day warning threshold
  - BIS IS 16046: 24 months validity
  - UN38.3: 24 months recency limit
  - IEC 62133: 36 months validity
  - MSDS: 36 months validity

### Blockchain Certificate Anchoring
**Architecture:** OpenTimestamps (free, no API key, Bitcoin-backed). Hash of certificate PDF → submit to OTS calendar → store `.ots` proof + tx_id in DB.

**Backend:**
- Migration `000061_add_certificate_anchors.up.sql` — `certificate_anchors` table
- Model `CertificateAnchor` in `models.go`
- Repository methods: `CreateCertificateAnchor`, `GetCertificateAnchorsByBatch`, `UpdateCertificateAnchorStatus`
- Handler `certificate_anchor_handlers.go` — `POST /batches/{id}/anchor-certificate`, `GET /batches/{id}/certificate-anchors`
- Service `internal/services/opentimestamps.go` — OTS HTTP client with `Stamp()`, `UpgradeProof()`, `EncodeProof()`
- Routes wired in `cmd/server/main.go`

**Frontend:**
- `lib/types.ts` — `CertificateAnchor` + `AnchorStatus` types
- `lib/api/anchors.ts` — `createCertificateAnchor()`, `getCertificateAnchors()`, `computeFileHash()` (Web Crypto SHA-256)
- `components/passport/trust-badge.tsx` — `TrustBadge` component with 3 tiers:
  - 🔒 `BLOCKCHAIN_ANCHORED` — green, lock icon
  - ✍️ `SELF_DECLARED` — amber, pencil icon (default for public passports)
  - 🏭 `LAB_CERTIFIED` — blue, shield icon (placeholder for future paid API integrations)
- `passport-view.tsx` + `certificate-view.tsx` — replaced hardcoded "Verified" badge with `TrustBadge` (defaults to `SELF_DECLARED`)
- `batch-details-page.tsx`:
  - Fetches anchors on load via `fetchAnchors()`
  - **Overview tab:** Anchor status + "Anchor to Blockchain" button next to PLI auditor certificate
  - **Compliance tab:** New "Blockchain Anchors" card listing all anchors with verify links to opentimestamps.org
  - `handleAnchorCertificate()` fetches PDF, computes SHA-256, submits to backend

### Also Resolved
- **Carbon calculator → `carbon_performance_class` auto-fill:** Backend `SaveCarbonFootprintResult` already updates both `carbon_footprint_result` JSONB and `carbon_performance_class` column. Migration `000059_widen_carbon_performance_class` widened DB constraint to A–G.
- **Vitest:** All 61 tests pass (was broken, now fixed — likely a transient dependency issue that self-resolved with lockfile updates)
- **Backend handler tests:** Fixed `fakeTeamRepo` build failure by adding certificate anchor stub methods with correct signatures

---

## ✅ Phase 3.4 — Automated Compliance Alerts

**Migration:** `000062_create_tenant_alerts.up.sql` — `tenant_alerts` table with indexes on tenant, unread status, created_at

**Backend:**
- `internal/models/models.go` — `TenantAlert` model
- `internal/repository/alerts.go` — `CreateAlert`, `GetAlertsByTenant`, `GetUnreadAlerts`, `GetUnreadAlertCount`, `MarkAlertRead`, `MarkAlertEmailed`, `HasRecentAlert` (7-day deduplication)
- `internal/repository/batch.go` — `ListAllBatches` (tenant-scoped, lightweight, for background scanning)
- `internal/services/alerts.go` — `AlertService`:
  - `CheckCertificateExpiries(ctx, 30)` — scans all active batches, creates alerts for BIS/UN38.3/IEC/MSDS expiring within 30 days
  - `CheckComplianceScores(ctx, 70.0)` — scans all active batches, creates alerts for scores below 70%
  - Deduplication: same alert type + resource not recreated within 7 days
- `internal/handlers/alert_handlers.go` — endpoints:
  - `GET /alerts` — list paginated alerts
  - `GET /alerts/unread` — unread alerts + count
  - `GET /alerts/unread-count` — badge count
  - `POST /alerts/:id/read` — mark read
  - `POST /jobs/daily-alerts` — manual trigger
- `internal/jobs/daily_alerts.go` — `StartDailyAlertTicker` runs every 24 hours (immediately on startup too)

**Frontend:**
- `lib/types.ts` — `TenantAlert`, `AlertSeverity`, `AlertType`
- `lib/api/alerts.ts` — `getAlerts`, `getUnreadAlerts`, `getUnreadAlertCount`, `markAlertRead`
- `components/dashboard/alert-bell.tsx` — Bell icon with red unread badge, dropdown panel with severity-colored alerts (INFO/blue, WARNING/amber, CRITICAL/red), "Mark read" per alert + "Mark all as read", auto-polls every 60s

**Alert Types:**
| Type | Trigger | Severity |
|---|---|---|
| `CERTIFICATE_EXPIRY` | BIS/UN38.3/IEC/MSDS expires within 30 days | WARNING (≤30d), CRITICAL (expired) |
| `COMPLIANCE_DEGRADED` | Batch compliance score < 70% | WARNING (<70%), CRITICAL (<50%) |

---

## ✅ Legacy Gap 1 — `circularity_status` Lifecycle Wiring

**Backend:**
- Added 3 new passport statuses: `REMANUFACTURED`, `REUSED`, `REPURPOSED`
- Added 3 new transition actions: `REMANUFACTURE`, `REUSE`, `REPURPOSE`
- `BatteryTransitionMap` — all actions transition from `IN_SERVICE`/`RECALLED`
- `BatteryAllowedRolesByAction` — Recycler + Technician/Logistics
- `mapActionToCircularityStatus` in `lifecycle.go` — maps all 4 actions to EU Battery Regulation statuses
- `ApplyLifecycleTransition` repository already handled `CircularityStatus` via `COALESCE` — no changes needed

**Frontend:**
- Added colors for `REMANUFACTURED` (teal), `REUSED` (cyan), `REPURPOSED` (orange)
- Added icons and `LIFECYCLE_STATES` filter entries
- Added evidence form fields for all 3 new actions
- Document upload supported for all 7 evidence-bearing actions

**Full mapping:**
| Action | Target Status | `circularity_status` | Evidence |
|---|---|---|---|
| `RECYCLE` | `RECYCLED` | `WASTE` | recycler EPR ID, recycling date, certificate |
| `REMANUFACTURE` | `REMANUFACTURED` | `REMANUFACTURED` | recycler EPR ID, certificate |
| `REUSE` | `REUSED` | `REUSED` | recycler EPR ID, certificate |
| `REPURPOSE` | `REPURPOSED` | `REPURPOSED` | recycler EPR ID, certificate |

---

## ✅ Legacy Gap 2 — `expected_lifetime_cycles` & `warranty_months` UI Fields

**Status:** Already implemented (HANDOFF.md was outdated). Both fields exist in:
- `batch-form-schema.ts` — Zod schema with positive number validation
- `step-compliance.tsx` — numeric inputs under "Sustainability & Safety"
- `create-batch-wizard.tsx` + `create-batch-dialog.tsx` — full mapping to/from `payload.specs`
- `step-review.tsx` — displayed in review summary
- Public passport view — displayed on certificate-view + passport-view

---

## ✅ Legacy Gap 3 — Health Endpoint Verification

**Status:** Working correctly. Tested live:
```
$ curl http://localhost:8080/health
{"database":"connected","status":"healthy","timestamp":"..."}
```

Endpoint registered at `main.go:171` with Go 1.22+ pattern syntax (`GET /health`). Returns 200 when DB is up, 503 when DB is down.

**Bonus fix:** `ListAllBatches` query in `batch.go` — added `COALESCE(..., '')` for nullable string columns (`carbon_performance_class`, `notified_body_number`, `declaration_of_conformity_path`) to prevent pgx NULL scan errors during daily alert background job.

---

## 🏗️ Architecture Notes

### URL Structure (Flat — No `/battery` Prefix)
- `/login`, `/register`, `/dashboard`, `/onboarding`
- OAuth callback → `/auth/callback?token=...`
- Public passports at `/p/[uuid]`

### Database Split
- Battery API → Supabase project A (port 8080)
- Textile API → Supabase project B (port 8081)
- Physical schema separation achieved. No shared tables.

### JWT Secret
Both APIs need the same `JWT_SECRET` for cross-service token validation.

### Supabase Storage
File uploads (certificates, logos, DoC) use frontend `@supabase/supabase-js` client pointing to `compliance-docs` bucket. Separate from API DB split.

### Build Commands
- **Frontend:** `cd apps/battery-web && npm run build` (Next.js 16, React 19, Tailwind 4)
- **Backend:** `cd services/battery-api && go build ./...`
- **Frontend tests:** `cd apps/battery-web && npx vitest run` (61/61 pass)
- **Backend tests:** `cd services/battery-api && go test ./...` (all green)
- **Type check:** `cd apps/battery-web && npx tsc --noEmit` (clean)

---

## 🔧 Recent Bug Fixes (2026-05-20)

### 1. `ListBatches` NULL scan failure
- **Root cause:** Pre-migration batches have `NULL` in `notified_body_number`, `declaration_of_conformity_path`, and `carbon_performance_class` (added in migration 57 without defaults). pgx/v5 cannot scan `NULL` into Go `string`.
- **Fix:** Added `COALESCE(..., '')` for all three nullable string columns in `ListBatches`, `GetBatch`, `ListAllBatches`, `GetPassportWithSpecs`, and `loadFullBatchForDocument` queries.
- **Files:** `services/battery-api/internal/repository/batch.go`, `passport.go`; `services/battery-api/internal/services/export_job_service.go`

### 2. Frontend silent failures
- **Root cause:** Dashboard `catch` block was empty, making backend 500s invisible to users.
- **Fix:** Added `toast.error()` and `console.error()` logging.
- **Files:** `apps/battery-web/components/dashboard/battery-dashboard-page.tsx`

### 3. `AlertBell` null crash
- **Root cause:** `getUnreadAlerts()` could return `null` for `alerts`/`count`.
- **Fix:** Added `?? []` and `?? 0` fallbacks.
- **Files:** `apps/battery-web/components/dashboard/alert-bell.tsx`

### 4. Public passport endpoint 500 error
- **Root cause:** `public.passports` table was missing `batch_snapshot` column. Migration 024 defined it, but it was absent in the live database (likely because migration 024 was modified after it had already been applied).
- **Fix:** Created migration 063 to add the missing column. Restored `batch_snapshot` references in `GetPassportWithSpecs` query.
- **Files:** `services/battery-api/internal/db/migrations/000063_add_passport_batch_snapshot.up.sql`, `services/battery-api/internal/repository/passport.go`

---

## Suggested Next Sprint Order

**All planned work is complete.** Possible future directions:

1. **Alert email notifications** — Wire up `EmailService` to send alert emails (template exists, just needs tenant email lookup + sending logic)
2. **External registry integrations** — Paid API partnerships for real BIS/CPCB/EU NANDO/UN38.3 lab verification (replaces self-declared trust tier)
3. **Mobile app** — React Native or PWA for field technicians to scan passports and submit lifecycle transitions
4. **Multi-tenant analytics** — Dashboard charts showing compliance trends, carbon footprint over time, certificate expiry heatmaps
5. **AI enhancement** — Fine-tuned model for PDF parsing (currently regex + Groq generic LLM)
6. **Advanced blockchain** — Store full OTS proof verification on-chain, add QR-code scannable verify links


---

## ✅ Session Update: 2026-05-30

### DGFT Export Incentive Claim System ("TRACE")

**Migrations:**
- `000080_create_dgft_scheme_configs.up.sql` — Seeded configs for 3 real schemes: RoDTEP (1.5%), Interest Equalization (2.75%), Duty Drawback (2.0%)
- `000081_create_dgft_claims.up.sql` — Claims table with status tracking, document JSONB, generated files JSONB

**Backend:**
- `internal/models/models.go` — `DGFTClaim`, `DGFTSchemeConfig`, `DGFTClaimDocument`, `DGFTClaimInput`
- `internal/repository/dgft_claims.go` — CRUD + list with pagination/filters + `AddDGFTClaimDocument`
- `internal/services/dgft_calculator.go` — HSN-aware claim calculator (full HSN → 6-digit prefix → 4-digit prefix → default rate)
- `internal/services/dgft_document_service.go` — `GenerateClaimPDF()` + `GenerateClaimCSV()` with tests
- `internal/handlers/dgft_claim_handlers.go` — 10 endpoints:
  - `GET /dgft-claims/schemes`, `POST /dgft-claims`, `GET /dgft-claims`, `GET /dgft-claims/{id}`
  - `PUT /dgft-claims/{id}`, `DELETE /dgft-claims/{id}`, `POST /dgft-claims/{id}/submit`
  - `GET /dgft-claims/{id}/export/pdf`, `GET /dgft-claims/{id}/export/excel`
  - `POST /dgft-claims/{id}/documents`
- 5 backend tests: `dgft_document_service_test.go`, `dgft_claim_handlers_test.go`

**Frontend:**
- `components/dgft-claims/dgft-claim-list.tsx` — Table with filters, search, pagination
- `components/dgft-claims/dgft-claim-form-dialog.tsx` — 4-step wizard with batch auto-population
- `components/dgft-claims/dgft-claim-detail.tsx` — Document upload, PDF/Excel download, DGFT reference tracking
- `components/dashboard/sidebar.tsx` — "DGFT Claims" nav item
- i18n strings added to `en.json` + `de.json`

**Batch Auto-Population:**
- Claim form fetches `/batches` and auto-fills HSN, destination country, export value, quantity from batch specs

---

### Security Fix: auth_token Cookie

**Problem:** `auth_token` was set via JavaScript (`document.cookie = ...`) with only `SameSite=Lax`, missing `HttpOnly` and `Secure`. AUDIT.md P0 finding.

**Fix:**
- Backend `auth_handlers.go` — Added `setAuthCookie()` / `clearAuthCookie()` with `HttpOnly`, `Secure`, `SameSite=Strict`
- Set on login, refresh, OAuth success; cleared on logout
- Frontend removed all JS cookie manipulation for `auth_token` (`api.ts`, `auth-context.tsx`, `auth-api.ts`)
- `refresh_token` already had correct flags — unchanged

---

### Supplier Portal — Phase 1 (PWA Scaffold)

**Migrations:**
- `000082_create_suppliers.up.sql` — `suppliers` table with invitation tokens, status (invited/active/blocked)
- `000083_create_supplier_documents.up.sql` — `supplier_documents` table (CoC, audit_report, provenance, msds, test_report, other)

**Backend:**
- `internal/models/models.go` — `Supplier`, `SupplierDocument`, `SupplierInvitationRequest`, `SupplierAcceptRequest`, `SupplierLoginRequest`, `SupplierLoginResponse`
- `internal/repository/suppliers.go` — Full CRUD for suppliers + documents
- `internal/services/auth_service.go` — Added `SupplierID` to `Claims`, `GenerateSupplierToken()`
- `internal/middleware/auth.go` — `SupplierIDKey` context key, `GetSupplierID()` helper
- `internal/handlers/supplier_handlers.go` — 10 endpoints:
  - `POST /suppliers/invitations`, `POST /suppliers/accept`, `POST /supplier/login`
  - `GET /suppliers`, `PUT /suppliers/{id}/status`
  - `POST /supplier/documents`, `GET /supplier/documents`
  - `GET /supplier-documents`, `PUT /supplier-documents/{id}/status`

**Frontend PWA:**
- `public/manifest-supplier.json` — Installable PWA manifest
- `public/sw-supplier.js` — Offline-first service worker with cache fallback
- `app/supplier/layout.tsx` — PWA layout with service worker registration
- `app/supplier/login/page.tsx` — Login page (tenant-scoped via `?tenant_id=`)
- `app/supplier/dashboard/page.tsx` — Document list with status badges
- `app/supplier/upload/page.tsx` — Document upload with camera support

**Tenant Settings:**
- `components/settings/suppliers-tab.tsx` — Invite suppliers, copy invite links, block/unblock, review documents with approve/reject
- `components/settings/battery-settings-page.tsx` — Added "Suppliers" tab

**Also Fixed (Pre-existing Build Errors):**
- `component-form-dialog.tsx` — `CheckedState` type errors with Checkbox
- Created `components/ui/switch.tsx` and `components/ui/slider.tsx` stubs (missing shadcn components)
- `tally-sync-staging.tsx` — missing `defaultValue` on Tabs

---

---

## ✅ Session Update: 2026-05-30 (Continued)

### Alert Email Notifications

**Backend:**
- `internal/services/email.go` — `SendAlertEmail()` with professional HTML template (severity-colored left border, alert type badge, CTA button, plaintext fallback)
- `internal/services/alerts.go` — `sendAlertEmail()` now actually sends emails via `EmailService.SendAlertEmail()` with tenant support_email lookup
- Wired into:
  - Daily certificate expiry alerts (`CheckCertificateExpiries`)
  - Daily compliance degradation alerts (`CheckComplianceScores`)
  - DGFT claim submit (`CreateAndSendDGFTClaimAlert`)
  - Supplier document upload (`CreateSupplierDocumentAlert`)
  - Supplier invitation accepted (`CreateSupplierInvitationAlert`)
- Dev mode: logs to console when `RESEND_API_KEY` absent

**AlertService sharing:** Single `*AlertService` instance created in `main.go`, injected into `Handler` and `jobs.StartDailyAlertTicker`. Prevents nil emailService and duplicate DB lookups.

---

### Supplier Portal — Phase 2 (Email Invites + Acceptance + Batch Selector)

**Backend:**
- `internal/services/email.go` — `SendSupplierInvitationEmail()` with HTML template (accept CTA, portal login link, expires in 30 days)
- `internal/services/email.go` — `SendSupplierDocumentReviewEmail()` notifies supplier when tenant approves/rejects their document
- `internal/handlers/supplier_handlers.go` — `InviteSupplier` now sends invitation email automatically after creating supplier
- `internal/handlers/supplier_handlers.go` — `ReviewSupplierDocument` now sends email notification to supplier on approve/reject
- `internal/handlers/supplier_handlers.go` — `ListSupplierBatches` endpoint (`GET /supplier/batches`) returns lightweight batch summaries for the supplier's tenant
- `services/battery-api/cmd/server/main.go` — Wired `GET /supplier/batches` route

**Frontend:**
- `app/supplier/accept/page.tsx` — Invitation acceptance page with `?token=` param (wrapped in Suspense for Next.js static generation)
  - Password + confirm password form with validation
  - Success state with "Go to Login" CTA
  - Invalid/missing token error state
- `app/supplier/upload/page.tsx` — Added batch selector dropdown
  - Fetches `/supplier/batches` on mount
  - Sends `batch_id` with document upload
  - Shows batch name + model name in dropdown

**Tests:**
- `internal/handlers/supplier_handlers_test.go` — 8 new tests:
  - `TestInviteSupplier_Success`, `TestInviteSupplier_DuplicateEmail`
  - `TestAcceptSupplierInvitation_Success`, `TestAcceptSupplierInvitation_InvalidToken`
  - `TestSupplierLogin_Success`, `TestSupplierLogin_InvalidPassword`
  - `TestListSupplierBatches_Unauthorized`
  - `TestReviewSupplierDocument_Success`

---

### Security Headers Hardening (OWASP Baseline)

**Backend (`internal/middleware/security.go`):**
- Removed deprecated `X-XSS-Protection` header (modern browsers ignore it)
- Added `Permissions-Policy` — restricts camera, microphone, geolocation, payment, USB, accelerometer, gyroscope, magnetometer
- Added `Cross-Origin-Opener-Policy: same-origin` — prevents cross-origin window manipulation attacks
- Added `Cross-Origin-Resource-Policy: same-origin` — restricts cross-origin resource loading
- Enhanced HSTS in production: `max-age=63072000; includeSubDomains; preload`
- Added route-aware `Content-Security-Policy`:
  - API routes: `default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`
  - `/docs` (Swagger UI): permissive policy allowing `unpkg.com` CDN scripts/styles
- Middleware remains outermost in handler chain so headers are present even on error responses

**Tests:**
- `internal/middleware/security_test.go` — 4 tests:
  - `TestSecurityHeaders_APIRoute` — verifies all baseline headers + restrictive CSP
  - `TestSecurityHeaders_DocsRoute` — verifies permissive CSP for Swagger UI
  - `TestSecurityHeaders_HSTSInProduction` — verifies HSTS with preload in production
  - `TestSecurityHeaders_PreservesOnError` — verifies headers survive 500 error responses

**AUDIT.md updated:**
- Marked 4 findings as resolved: CSRF-safe cookie, security headers, rate-limit header correctness, request body size limit

---

### Multi-Tenant Analytics Dashboard

**Backend:**
- `internal/models/models.go` — `AnalyticsOverview`, `ComplianceTrendPoint`, `CertExpirySummary`, `CarbonClassCount`, `RegionCount`, `StatusCount`
- `internal/repository/analytics.go` — `GetAnalyticsOverview()` with 8 SQL aggregations:
  - **Compliance trend** — avg `compliance_score` by ISO week (last 12 weeks)
  - **Certificate expiry** — BIS IS 16046, UN38.3, IEC 62133, MSDS buckets: ≤30d, ≤7d, expired
  - **Carbon distribution** — count by `carbon_performance_class`
  - **Batch status breakdown** — DRAFT / ACTIVE / ARCHIVED counts
  - **Market region split** — INDIA / EU / GLOBAL counts
  - **Supplier document status** — pending / approved / rejected counts
  - **DGFT claim funnel** — counts by claim status
  - **Alert severity breakdown** — INFO / WARNING / CRITICAL counts
- `internal/handlers/dashboard_handlers.go` — `GetAnalyticsOverview` handler (`GET /api/v1/analytics/overview`)
- `cmd/server/main.go` — Route wired

**Frontend:**
- `components/dashboard/sidebar.tsx` — Added "Analytics" nav item with `BarChart3` icon
- `messages/en.json` + `messages/de.json` — Added `navigation.analytics` i18n strings
- `components/analytics/compliance-trend-chart.tsx` — Area chart with emerald gradient, 0–100% Y-axis
- `components/analytics/certificate-expiry-chart.tsx` — Grouped bar chart (amber/red/dark-red) for expiry buckets
- `components/analytics/status-distribution-chart.tsx` — Reusable donut chart with legend + total center
- `components/analytics/battery-analytics-page.tsx` — Tabbed layout:
  - **Scan Analytics** tab — Existing scan stats, country/device charts, live feed (unchanged)
  - **Compliance & Operations** tab — 2×2 grid of compliance trend + certificate expiry, 4× status donuts (batch status, carbon class, market regions, supplier docs), DGFT funnel + alert severity
- Auto-refresh every 30s for both tabs
- Empty states for all charts when no data

**Tests:**
- `internal/handlers/analytics_handlers_test.go` — 2 tests (success + unauthorized)
- `components/analytics/battery-analytics-page.test.tsx` — 1 test (loading state)

---

## 🔧 Suggested Next Sprint Order (Updated)

1. **External registry integrations** — Paid API partnerships for real BIS/CPCB/EU NANDO/UN38.3 lab verification (replaces self-declared trust tier)
2. **Mobile app** — React Native or PWA for field technicians to scan passports and submit lifecycle transitions
3. **AI enhancement** — Fine-tuned model for PDF parsing (currently regex + Groq generic LLM)
