# ExportReady Battery — Deep Dive Audit
*Code-grounded issues across every layer of the app*

---

## How to read this

Each issue is tagged: 🐛 **Bug** (wrong behaviour today) · ⚠️ **Gap** (missing feature) · 🎨 **UX** (confusing or friction-heavy experience) · 🔥 **Perf** (measurable performance problem)

Severity: **P1** blocks users or ships wrong data · **P2** degrades experience significantly · **P3** polish / nice-to-have

---

## 1. Authentication & Session

### 🐛 P1 — Login makes two round-trips to get the full user
**File:** `context/auth-context.tsx` → `login()`

After a successful `POST /auth/login`, the code immediately calls `GET /auth/me` again because the login response returns a minimal payload missing `onboarding_completed`. The comment says it all: *"Fetching /auth/me here ensures the correct flag is present before the dashboard layout ever mounts."* This is a workaround for the API, not a fix. Consequence: every login has double latency.

**Fix:** Return the full user object (same shape as `GET /auth/me`) from `POST /auth/login`. One call, one round-trip.

---

### 🐛 P2 — Silent logout with no user feedback
**File:** `context/auth-context.tsx` → `checkAuth()`

When the refresh token is expired or invalid, the code calls `clearProductCookies()` and `setLoading(false)` — the user is just silently redirected to `/login`. There's no message saying why. Users who leave a tab open overnight will return to a login screen with no explanation.

**Fix:** Pass `?reason=session_expired` to the redirect URL and show a banner on the login page: *"Your session expired. Please sign in again."*

---

### ⚠️ P2 — No "remember me" option
The refresh token is set by the backend but the frontend has no control over its lifetime. There's no UI toggle for "keep me signed in". B2B SaaS users (manufacturers, compliance teams) expect 30-day sessions.

---

### ⚠️ P3 — No password change in Settings
There's a forgot-password → reset-password flow for unauthenticated users, but no "change password" form in the Settings page for authenticated users.

---

### ⚠️ P3 — No 2FA/MFA
No two-factor authentication. For a compliance platform handling regulatory data, this is a notable gap for enterprise buyers.

---

## 2. Onboarding

### 🎨 P1 — Market selection is Step 2, but it should be Step 0
**File:** `components/onboarding/battery-onboarding-page.tsx`

The user fills their company name, address, email, and logo on Step 1 — then picks their market (India / EU / Global) on Step 2. But the *market* determines which compliance fields appear on Step 3. If someone picks "EU" after filling Step 1, they then see EU rep fields they didn't expect. If they pick "India", they see EPR/BIS fields.

Market selection should happen *before* anything else. It reframes every subsequent step.

**Fix:** Move market selection to a pre-wizard modal (same change recommended in the batch creation strategy — the pattern is identical).

---

### 🐛 P2 — `morth_manufacturer_code !== "TBC"` is a hardcoded magic string
**File:** `components/dashboard/profile-completeness-banner.tsx`

```ts
const hasMorth = !!user.morth_manufacturer_code?.trim() && user.morth_manufacturer_code !== "TBC"
```

The string `"TBC"` is hardcoded as a sentinel value meaning "not really filled yet". If anyone enters `TBC` as their actual code, they're permanently marked incomplete. If the sentinel changes, this silently breaks.

**Fix:** Use `null` / empty string as the "not set" state at the DB level. Remove the `"TBC"` check.

---

### 🎨 P2 — No "skip compliance for now" path
After finishing Step 1 (company profile) and Step 2 (market), Step 3 asks for EPR/BIS registration numbers. New users often don't have these ready. There's no way to skip and come back later — the wizard just blocks progress.

The profile completeness banner exists precisely to handle incomplete profiles post-onboarding, but users can't reach it because the wizard is a wall.

**Fix:** Make compliance step optional with a "I'll add this later" path. The banner handles the follow-up nudge.

---

### 🎨 P2 — No completion moment / no "what next" after onboarding
After `PUT /auth/profile` succeeds on Step 4, the user is immediately redirected to `/dashboard`. No celebration, no checklist, no guidance. They land on the dashboard with zero batches and have to figure out what to do.

The first-run checklist on the dashboard partially covers this, but it's a separate widget they have to notice.

**Fix:** Step 4 (Review & Submit) becomes the celebration screen. Before redirecting, show: "You're ready. Here's what to do next: → Create your first batch". One big CTA button.

---

### 🐛 P3 — Zod real-time validation is only on Steps 1 and 3
**File:** `components/onboarding/battery-onboarding-page.tsx`

Step 2 (market) and Step 4 (review) have no client-side validation feedback. Step 3 has validation but the error state `step3Errors` is set but I don't see it being passed to `StepComplianceSetup` props in the rendered component — the wiring may be incomplete.

---

## 3. Dashboard Home

### 🔥 P1 — Fetching 200 raw batches to draw a line chart
**File:** `components/dashboard/battery-dashboard-page.tsx`

```ts
api.get<BatchesChartDataResponse>(`/batches/chart-data?limit=200`)
```

The dashboard fetches up to 200 full batch objects, then does client-side date-bucketing to build a 7-point rolling 60-day chart. As a tenant grows to thousands of batches, this endpoint returns more and more data for a chart that only needs 7 numbers.

**Fix:** Add `GET /dashboard/production-trend?days=60` that returns pre-aggregated `[{date, count}]` from the database. The frontend chart becomes trivial.

---

### 🐛 P1 — `DRAFT` status is labeled "Ready" in the batch status chart
**File:** `components/dashboard/battery-dashboard-page.tsx`

```ts
const readyCount = statusMap["DRAFT"] || 0;       // DRAFT = not ready
const processingCount = statusMap["ACTIVE"] || 0;  // ACTIVE = live
```

Then:
```tsx
<BatchStatusChart ready={readyCount} processing={processingCount} completed={completedCount} />
```

The chart is being passed DRAFT batches as the "ready" segment. DRAFT means *not yet activated* — the exact opposite of "ready". Users seeing a "Ready: 5" on the chart while all 5 are drafts that need activation is wrong and confusing.

**Fix:** Rename: `draftCount`, `activeCount`, `completedCount`. Update the chart labels accordingly.

---

### 🎨 P2 — Quota card shows "0 / 0" when quota limit is not set
**File:** `battery-dashboard-page.tsx`

```ts
const quotaLimit = stats?.quota_limit ?? 0;
const quotaPercent = quotaLimit > 0 ? Math.round((quotaUsed / quotaLimit) * 100) : 0;
```

When `quota_limit` is 0 (unlimited plan or unset), the card shows `0 / 0` with a flat empty progress bar. Users on unlimited plans see a broken-looking stat card.

**Fix:** When `quotaLimit === 0`, show "Unlimited" instead of the progress bar.

---

### 🐛 P2 — Scans with unknown location all plot at (0, 0) — Null Island
**File:** `battery-dashboard-page.tsx`

```ts
latitude: s.latitude ?? 0,
longitude: s.longitude ?? 0,
```

Any scan where GeoIP lookup fails gets plotted in the Atlantic Ocean (0°N, 0°E). The scan map could show a cluster of hundreds of dots in the ocean for corporate VPN users, Tor users, or failed lookups.

**Fix:** Filter out scans where `latitude === null || longitude === null` before passing to `ScanMap`. Show an "(Unknown location)" count as a footnote instead.

---

### 🎨 P2 — First-run check uses `total_batches === 0` which is wrong after deletions
**File:** `battery-dashboard-page.tsx`

```ts
const isFirstRun = (stats?.total_batches ?? 0) === 0;
```

A user who created and then deleted a batch sees the first-run onboarding checklist again. `total_batches` should count lifetime batches (including deleted), not current active ones.

**Fix:** The API should return `ever_created_batches` or the frontend should use a separate signal (e.g., a `first_run_dismissed` flag stored per-user).

---

### 🎨 P2 — Compliance status strip makes 4 parallel API calls on every dashboard load
**File:** `battery-dashboard-page.tsx` → `fetchDashboardData()`

`Promise.all` runs 3-4 API calls in parallel, plus a separate scan fetch. This is fine architecturally but the compliance status (EPR, BIS, PLI) is read from the `user` object in AuthContext — which was already fetched at login. The dashboard renders a separate compliance strip from `user` data without re-fetching, which is correct. But `stats`, `chart-data`, `recent`, and `scans` are all separate calls. A single `GET /dashboard` endpoint returning all four datasets would halve the waterfall.

---

### ⚠️ P3 — Audit log mixes scan events and batch events, no search or filter
The audit log on the dashboard combines QR scan events and batch creation events. There's no way to filter by type, time range, or user. For compliance purposes (especially EU audit trail requirements), this is a significant gap.

---

## 4. Batch List

### 🐛 P2 — `duplicateBatch` exists but isn't surfaced prominently
**File:** `components/batches/battery-batches-page.tsx`

```ts
import { duplicateBatch } from "@/lib/api/batches";
```

The function is imported and presumably wired to a menu item, but it's buried in a `MoreHorizontal` dropdown that users have to discover. Cloning a batch is one of the most common actions for manufacturers running the same product in multiple markets or seasons.

**Fix:** Add a "Duplicate" button as a visible action on each row (not buried in the dropdown), or as a primary action on the batch detail page.

---

### ⚠️ P2 — No column sorting on batch list
The batch list has search and status/compliance filters but no column sorting. Users can't sort by "newest", "oldest", "most units", or "lowest compliance score". For tenants with 50+ batches, this makes finding things frustrating.

---

### ⚠️ P2 — No bulk activate
The `BulkActionToolbar` component exists, but "activate" is not listed as a bulk action. Manufacturers with 10 draft batches ready for activation have to activate them one by one.

---

## 5. Batch Detail

### 🎨 P1 — No "Edit Batch" capability after creation
There's no visible way to edit a batch after it's been submitted. The batch detail page has an `ActivationChecklist` that links to "Fix in Settings" for tenant-level fields, and "View in Overview" for batch-level fields — but "View in Overview" is read-only. If a user entered the wrong capacity, voltage, or HSN code, they appear to have no recourse except delete and recreate.

**Fix:** Add an "Edit Batch" action (available only for DRAFT status) that reopens the wizard pre-filled with existing data. For ACTIVE batches, allow editing of non-compliance-critical fields (batch name, notes) without deactivating.

---

### 🎨 P2 — ActivationChecklist disappears on success — no confirmation state
**File:** `components/batches/detail/ActivationChecklist.tsx`

```ts
if (!hasIssues) return null;
```

When all blockers are resolved and the batch is activated, the checklist component renders nothing. There's no "✓ All clear — passport is live" state. Users activate and then see a blank space where the checklist was.

**Fix:** When `!hasIssues && batch.status === "ACTIVE"`, render a success state: *"Passport activated · Live since [date] · QR codes ready to print"*.

---

### 🎨 P2 — Batch actions hidden in a `MoreHorizontal` dropdown
**File:** `components/batches/detail/BatchActions.tsx`

Key actions — Print Labels, Download QR, Export Compliance Report — are all buried behind an icon button that shows a dropdown. First-time users often don't discover these at all. The most important action after activation is "Print Labels", which should be a primary visible button.

**Fix:** Promote "Print Labels" and "Download QR" to visible buttons in the batch header. Keep secondary actions (export CSV, archive, delete) in the dropdown.

---

### 🎨 P2 — Compliance gaps link to "Fix in Settings" but Settings is a long page
When an activation blocker says "Fix in Settings", clicking it opens `/dashboard/settings?tab=compliance`. That's a tab switch — the user has to scroll to find the specific field. There's no anchor jump to the exact field.

**Fix:** Link to `?tab=compliance#epr-registration` (or similar anchors). Each compliance field in Settings should have an `id` attribute.

---

## 6. Profile Completeness Banner

### 🎨 P2 — Banner dismisses globally for 24h, re-appears even if user is in the middle of fixing it
**File:** `components/dashboard/profile-completeness-banner.tsx`

The banner has a 24-hour cooldown dismiss. If a user dismisses it, does their work in Settings, but doesn't upload the final certificate, the banner reappears the next day. This is correct behaviour for nudging, but there's no "I'm working on it" state that gives the user a week's grace before nagging again.

More critically: after dismissal, the banner checks `needsAttention || dismissed` — so if the profile becomes complete while dismissed, it won't show a "Profile complete ✓" confirmation either.

---

### 🎨 P3 — Banner links are hardcoded, not using `productRoutes()`
**File:** `profile-completeness-banner.tsx`

```ts
<Link href="/onboarding?step=3">  // hardcoded
<Link href="/dashboard/settings?tab=compliance">  // hardcoded
```

The rest of the app uses `productRoutes(user?.product_type)` for routing. These hardcoded links will break if route structure ever changes.

---

## 7. AI Features

### 🎨 P1 — AI applies results silently with no preview or confidence shown
**File:** `components/batches/batch-form-steps/step-identity.tsx`

The AI parses a datasheet and populates fields without showing what it extracted or how confident it was. Users have no way to know AI changed a field. The backend returns a `confidence` float (0–1) and a `method` field (`regex` / `llm` / `cached`), but the frontend doesn't surface either.

Already covered in the batch strategy doc — restating here because it's the single highest-leverage AI improvement.

---

### ⚠️ P2 — NL mode (`/ai/nl-create-batch`) only extracts 10 fields
**File:** `lib/ai/parse-datasheet.ts` — `NLCreateResult`

The natural language endpoint only returns: batch_name, model_name, chemistry, capacity, voltage, quantity, market_region, customer_name, weight, battery_category. The full datasheet parser extracts 40+ fields including all compliance data (EPR, BIS, HSN, EU rep, certifications). The NL endpoint should be expanded to extract at least the compliance-relevant fields.

---

### ⚠️ P2 — AI cache uses `filename` but shows it as a list — not very useful
**File:** `lib/ai/datasheet-cache.ts`

The cache stores up to 10 entries, keyed by SHA-256 hash. The UI shows cached files as a raw filename list. Users can't tell which cache entry corresponds to which product without remembering what they uploaded previously.

---

## 8. Missing Features (Gaps)

### ⚠️ P1 — No batch editing after creation
Covered above. This is the most commonly requested feature in any CRUD workflow.

### ⚠️ P1 — No notification system for critical events
`internal/jobs/daily_alerts.go` exists, but there's no in-app notification center. These events have no in-app surface:
- Quota running low (< 10% remaining)
- Compliance certificate about to expire
- Batch activation failed
- Supplier document approved/rejected
- Blockchain anchor confirmed/failed

Users only discover these via email (if the daily_alerts job is even wired up).

### ⚠️ P2 — Mass Balance, DGFT Claims, Regulatory pages — placeholder or real?
These are listed in the sidebar nav but the implementation wasn't visible from the file tree (no complex component trees). If these are placeholder/empty pages, users clicking them are hitting dead ends. Empty state pages should say "Coming soon — [what this page will do]" rather than showing a blank layout.

### ⚠️ P2 — No search, filter, or sort on Templates
Templates have a simple list (or dropdown in the batch wizard). No search, no market filter, no sort by last-used. Grows unmanageable beyond 10 templates.

### ⚠️ P2 — No webhook system for external integrations
The API has a Razorpay webhook receiver, but no outbound webhook system for customers to subscribe to compliance events (batch activated, passport scanned, cert expiring). This blocks enterprise integrations with ERP systems.

### ⚠️ P2 — Public passport page has no analytics for the manufacturer
Users scan QR codes on `/p/[uuid]`. The ScanMap shows aggregate scan locations, but manufacturers can't see: *which specific passport was scanned when and where*. Per-passport analytics would help manufacturers understand their supply chain.

### ⚠️ P3 — No API key rotation / expiry
The developer page has API key management, but there's no key expiry, rotation, or per-key scope. Enterprise customers need to rotate keys without downtime.

### ⚠️ P3 — No batch archiving from the list page
Archive is available from the batch detail page (dropdown) but not from the batch list. Bulk archive isn't available at all.

### ⚠️ P3 — No password change in Settings
Covered in Auth section — restating as a gap in Settings completeness.

---

## 9. API Design Issues

### 🔥 P1 — `GET /batches/chart-data?limit=200` returns full objects for a chart
Should return pre-aggregated time-series data. Full objects include all specs, compliance data, etc. — none of which is needed for a chart.

### ⚠️ P2 — No rate limiting visible in API spec
The OpenAPI spec has no mention of rate limiting headers. For a platform that may receive thousands of QR scans per day (`GET /passports/{uuid}`), no rate limiting on the public passport endpoint is a risk.

### ⚠️ P2 — Quota check only happens at activation, not at batch creation
A user can create 1000 draft batches with zero quota. The quota only triggers on `POST /batches/{id}/activate`. This is correct business logic, but there's no warning in the batch creation form showing remaining quota so users know before they go through the wizard.

**Fix:** Show current quota balance in the batch creation wizard header or the batch list page stat card (it's already shown on the dashboard but not at the point of action).

### ⚠️ P3 — `GET /passports/{uuid}` has no caching headers
Public passport pages could have aggressive CDN caching (the data rarely changes once activated). A `Cache-Control: public, max-age=300` header would dramatically reduce load on the Go API for viral QR scans.

---

## 10. Quick Wins Summary

These are all low-effort, high-impact fixes that can be done in a day or two each:

| Fix | File | Impact |
|---|---|---|
| Draft banner `!isDirty` guard | `create-batch-wizard.tsx` | P1 — users lose work |
| DRAFT labeled "Ready" in chart | `battery-dashboard-page.tsx` | P1 — wrong data shown |
| Null Island scans `?? 0` | `battery-dashboard-page.tsx` | P2 — map looks broken |
| Quota "0 / 0" on unlimited | `battery-dashboard-page.tsx` | P2 — stat card looks broken |
| `morth !== "TBC"` magic string | `profile-completeness-banner.tsx` | P2 — fragile sentinel |
| Banner hardcoded links | `profile-completeness-banner.tsx` | P3 — routing inconsistency |
| ActivationChecklist null on success | `ActivationChecklist.tsx` | P2 — no feedback after activation |
| API: `/batches/login` double call | `auth-context.tsx` | P2 — latency |
| Promote Print Labels / QR buttons | `BatchActions.tsx` | P2 — discoverability |
| `first_run` check after deletion | `battery-dashboard-page.tsx` | P2 — wrong state |
