# ExportReady Battery — Expanded Deep-Dive Audit v2
**Date:** June 2026 | **Scope:** All frontend components, hooks, lib utilities, Go backend services  
**Files read this session:** 18 new files (dispatch, lifecycle, mass-balance, DGFT, analytics, settings, carbon-calc, DVA-calc, public passport, use-queries, use-batch-validation, activation-compliance.go, lifecycle-handlers.go, batch-completion.ts, activation-blockers.ts, types.ts, create-batch-wizard.tsx)

> This document extends `deep-dive-audit.md`. Issues from v1 are NOT repeated here unless a related deeper problem was found. Severity follows the same tagging: **[P1] Critical / [P2] Important / [P3] Nice-to-fix**.

---

## 1. SECURITY

### [P1] Compliance Certificates Use Unauthenticated Public URLs
**File:** `components/batches/create-batch-wizard.tsx` lines 604–610

```ts
const { data: { publicUrl } } = supabase.storage
  .from("compliance-docs")
  .getPublicUrl(filePath);
setValue("uploadedFileUrl", publicUrl, ...);
```

`getPublicUrl()` generates a permanently accessible, unauthenticated URL. The `compliance-docs` bucket is **public**. This means BIS certificates, EPR registrations, DVA audit reports — all legally sensitive compliance documents — are accessible to anyone with the URL. There is no expiry, no auth check, and no row-level security on the bucket.

**Fix:** Use signed URLs with a short TTL (`createSignedUrl(path, 3600)`). Make the bucket private. Signed URLs expire and require authenticated generation but remain accessible to the end-user during their session.

---

### [P1] Dispatch Page Uses localStorage for Passport UUIDs
**File:** `components/dispatch/battery-dispatch-page.tsx` line 35

```ts
const STORAGE_KEY = "dispatch_pending_items";
localStorage.setItem(STORAGE_KEY, JSON.stringify(scannedItems));
```

Passport UUIDs — the public identifiers for physical batteries — are persisted in `localStorage` as a crash-recovery mechanism. On a shared warehouse computer, a subsequent user (different operator, or an attacker) can read these UUIDs, which are also the URLs to public passport pages. While the UUIDs themselves are by design public-facing, storing them alongside timestamps and raw scan values creates a traceability record anyone can read.

**Fix:** Clear localStorage on logout. Add a 24-hour expiry check when restoring. Consider using sessionStorage instead of localStorage so data is cleared when the tab closes.

---

### [P2] Backend Accepts Actor Field from Request Body
**File:** `services/battery-api/internal/handlers/lifecycle_handlers.go` line 63

```go
type LifecycleTransitionRequest struct {
    Action     string          `json:"action"`
    Actor      string          `json:"actor,omitempty"` // Who is making this change
    ...
}
```

The `Actor` field is accepted from the request body. If the backend uses this field directly in audit records rather than deriving it from the JWT `sub` claim, an authenticated user could forge their actor identity in lifecycle events ("actor: CEO" on a RECALL event). Audit chains would be polluted.

**Fix:** Remove `Actor` from the request body. The backend must derive actor identity exclusively from the verified JWT. The field comment says "Who is making this change" — this must come from auth, not from the client.

---

### [P2] Public Passport Page Sends Auth Headers on Every QR Scan
**File:** `apps/battery-web/app/p/[uuid]/page.tsx` line 54

```ts
const response = await api.get(`/passports/${params.uuid}`);
```

The same `api` Axios instance used for dashboard requests (which attaches the JWT `Authorization` header) is used on the public `/p/[uuid]` page. When a consumer scans a QR code, they are not authenticated — they receive a tier-aware public view. But if a manufacturer is logged in and scans their own QR in a browser tab, their JWT is sent to the backend. This is not a critical breach but means:
- Access logs show authenticated requests for public page views, corrupting analytics
- If the backend inadvertently returns privileged data on `200 OK` for authenticated users on the public endpoint, data overexposure occurs

**Fix:** Use a separate `publicApi` Axios instance without the auth interceptor for the `/p/[uuid]` route. The public passport endpoint should be auth-agnostic.

---

## 2. DATA INTEGRITY BUGS

### [P1] Completion Ring Shows 100% When Activation Would Be Blocked
**File:** `lib/batch-completion.ts` (entire EU block, lines 37–47)

The completion ring checks `carbonFootprint`, `carbonPerformanceClass`, `ceMarking`, `notifiedBodyNumber`, `euRepresentative`, `expectedLifetime`, `warrantyMonths` for EU batches.

**Missing from the ring but required by `activation-blockers.ts` for EU:**
- `specs.material_composition` (at least one non-zero %)
- `specs.hazardous_substances.declaration`
- `specs.expected_lifetime_cycles` (separate from `expectedLifetime` in form)
- EU battery category (`specs.battery_category`)

A user filling out a batch for the EU market can reach 100% completion ring, see "All fields filled — ready to create", click Create, and then find activation blocked immediately due to these missing fields. This is the exact failure mode the previous audit flagged as a historical bug ("the UI said ready while activation was rejected") — it still exists for these 4 fields.

**Fix:**
```ts
if (showEU) {
  checks.push(
    // ... existing checks ...
    { label: "Material Composition", filled: hasMaterialComposition(data.materialComposition), step: 1 },
    { label: "Hazardous Substances", filled: !!data.hazardousSubstancesDeclaration?.trim(), step: 1 },
    { label: "Lifetime Cycles", filled: (data.expectedLifetimeCycles ?? 0) > 0, step: 1 },
    { label: "Battery Category", filled: !!data.batteryCategory, step: 0 },
  );
}
```

---

### [P1] Dispatch: ACTIVATE Result is Silently Ignored
**File:** `components/dispatch/battery-dispatch-page.tsx` lines 235–240

```ts
// Phase 2 action flow: ACTIVATE (if needed), then SHIP
await bulkTransition("ACTIVATE");   // ← result thrown away

const result = await bulkTransition("SHIP", {
  shipment_reference: shipmentReference,
  shipment_date: shipmentDate,
});
```

The ACTIVATE transition result is completely discarded. If 3 out of 10 passports fail ACTIVATE (e.g. compliance gaps), the SHIP call still fires for all 10 passport IDs. The partial failure display only reflects SHIP failures, not ACTIVATE failures. Passports that failed ACTIVATE but were not marked as failed in the UI will appear to have been shipped without a proper audit trail.

**Fix:** Check the ACTIVATE result. Only pass successfully activated IDs to the SHIP call:
```ts
const activateResult = await bulkTransition("ACTIVATE");
const activeIds = scannedItems
  .map(i => i.id)
  .filter(id => !activateResult.failed_ids?.includes(id));
// Then SHIP only activeIds
```

---

### [P1] Analytics "Total Scans" Cap at 50
**File:** `components/analytics/battery-analytics-page.tsx` lines 116–149

```ts
const response = await api.get(`/scans/feed?limit=50`);
const scans: ScanFeedItem[] = response.data.scans || [];
// ...
setScanData({
  totalScans: scans.length, // ← always ≤ 50!
  ...
});
```

The scan analytics fetches 50 items for the live feed but then uses `scans.length` (always ≤ 50) as "Total Scans". Any user with more than 50 scans will see "50 scans" on their dashboard. The API almost certainly returns a `total` field in the response.

**Fix:**
```ts
setScanData({
  scans,
  totalScans: response.data.total ?? scans.length, // use API total
  ...
});
```

---

### [P2] Mass Balance "All Materials" Filter Uses Space Character
**File:** `components/mass-balance/mass-balance-page.tsx` line 208

```tsx
<SelectItem value=" ">All Materials</SelectItem>
```

The value is `" "` (a space), not `""`. In `fetchLedgers`:
```ts
const res = await listLedgers(materialFilter || undefined);
```
A space character is truthy in JavaScript, so `materialFilter || undefined` evaluates to `" "` and sends `material_type=" "` to the API. The API will receive an invalid filter value instead of returning all materials.

**Fix:** Change to `value=""` and handle the empty string case in the `onValueChange` handler.

---

### [P2] DGFT: Client-Side Search Applied to Server-Paginated Data
**File:** `components/dgft-claims/dgft-claim-list.tsx` lines 90–98

Server-side pagination returns 20 claims per page. Client-side search filters those 20 items. This means:
- Search for a claim on page 2 while on page 1 → not found
- The pagination counter (`Page 1 of N`) is based on the unfiltered server total, becoming misleading when client-side search is active
- "No claims yet" empty state can appear when claims exist on other pages

**Fix:** Move search to the server-side (`/dgft-claims?search=<term>`) or fetch all claims on load (if count is manageable) and do purely client-side pagination.

---

### [P2] Carbon Calculator: Wrong Ah→kWh Conversion for LFP
**File:** `components/batches/carbon-calculator.tsx` line 98

```ts
if (lower.includes("ah")) return num * 3.7 / 1000 // very rough conversion
```

The hardcoded 3.7V nominal voltage is appropriate for NMC but wrong for LFP (nominal 3.2V). An LFP battery rated at 100Ah would be calculated as 37 kWh instead of the actual ~32 kWh. This 15% error propagates directly into the carbon footprint declaration, resulting in incorrect kg CO₂e values reported on the EU Battery Passport.

**Fix:** Accept voltage as an input field, or set a default by chemistry type:
```ts
const voltageByChemistry: Record<string, number> = {
  LFP: 3.2, NMC_622: 3.6, NMC_811: 3.65, NCA: 3.65, SODIUM: 3.1,
};
const defaultVoltage = voltageByChemistry[chemistry] ?? 3.6;
return num * defaultVoltage / 1000;
```

---

## 3. VALIDATION GAPS

### [P2] Wizard `mode: "onBlur"` Allows Skipping Fields Without Blur
**File:** `components/batches/create-batch-wizard.tsx` line 149

```ts
const form = useForm<BatchFormData>({
  mode: "onBlur",
  ...
});
```

With `mode: "onBlur"`, validation only fires when a field loses focus. A user who programmatically navigates (e.g. presses Tab once into a field and then uses the "Next" button via keyboard) may never trigger blur. The "Next" button calls `trigger(requiredFields)` which forces validation — but only for the fields declared in `getRequiredFieldsForStep()`. Any field not in that array can be bypassed.

**Fix:** Use `mode: "all"` for immediate feedback. Alternatively, keep `onBlur` but ensure every field in the current step is in `getRequiredFieldsForStep()` so `trigger()` catches everything.

---

### [P2] MoRTH Factory Codes: Raw JSON Input with No Validation
**File:** `components/settings/battery-settings-page.tsx` lines 674–679

```tsx
<input
  type="text"
  placeholder='[{"code":"01","name":"Pune Plant"},...]'
  value={formData.morth_factory_codes}
  onChange={(e) => setFormData({ ...formData, morth_factory_codes: e.target.value })}
/>
```

Factory codes are stored as a raw JSON string. There is no validation that the string is valid JSON, has the correct shape, or that factory codes are exactly 2 characters. A typo (missing quote, trailing comma) will silently save invalid JSON. When the BPAN serial number generation service tries to parse this, it will fail at the worst possible time — during batch activation.

**Fix:** Use a dynamic key-value form builder for factory codes instead of raw JSON input. Add a live JSON parse validation:
```ts
onChange={(e) => {
  try { JSON.parse(e.target.value); setJsonError(false); }
  catch { setJsonError(true); }
  setFormData({ ...formData, morth_factory_codes: e.target.value });
}}
```

---

### [P2] DVA Calculator Formula Is Oversimplified for PLI Advanced Chemistry Cells
**File:** `components/batches/dva-calculator.tsx` lines 23–36

The calculator implements: `DVA = ((Sale Price − Imported Cost) / Sale Price) × 100`

The PLI scheme for Advanced Chemistry Cells (ACC) under MHI guidelines defines imported content differently across component tiers:
- **Cells imported as-is:** Full CIF value counts as imported
- **Cells manufactured domestically from imported precursors:** Only the precursor import value counts
- **Labour, depreciation, overheads:** Always count as domestic

The current calculator has no way to enter these sub-components. A manufacturer importing cells from China but adding significant domestic value in BMS, casing, and electrolyte assembly may calculate a lower DVA than their actual eligible DVA, potentially incorrectly disqualifying themselves from PLI benefits — or vice versa.

**Fix:** Add expandable sections for: (1) Cell cost breakdown (imported vs domestic), (2) BMS cost, (3) Structural/mechanical cost, (4) Labour & overheads. Calculate DVA using the MHI-defined formula per component category.

---

### [P3] Settings Page: `isCertValid` Accepts Unverified "PENDING" Status
**File:** `components/settings/battery-settings-page.tsx` lines 101–103

```ts
function isCertValid(status?: string) {
  return status === "PENDING" || status === "VERIFIED"
}
```

This function is used to decide if the EPR/BIS compliance readiness bar turns green. "PENDING" means the user uploaded a document that has NOT yet been verified by the registry or admin. The readiness bar will show green for pending certs, which misleads the user into thinking they're ready when the backend may still reject activation.

The activation blockers in `lib/activation-blockers.ts` check only if the cert path is present (via the number field), not the status — so there's a separate inconsistency between the settings page readiness indicator and the actual activation gate.

**Fix:** Only show green for `VERIFIED`. Show amber with tooltip for `PENDING` ("Submitted, awaiting registry verification — batches may still activate"). Red for `NOT_UPLOADED` or missing.

---

## 4. UX / WORKFLOW ISSUES

### [P1] Settings Page Has No Unsaved Changes Warning
**File:** `components/settings/battery-settings-page.tsx`

There is no `isDirty` tracking and no `beforeunload` warning. A user editing their EPR number, BIS R-number, or EU representative details can accidentally navigate away (click another tab, use the sidebar) and lose all changes silently. For compliance-critical settings, this is a significant UX failure.

**Fix:**
```ts
const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
useEffect(() => {
  if (!isDirty) return;
  const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [isDirty]);
```
Also show an inline "Unsaved changes" badge next to the Save button.

---

### [P2] EU Representative Section Appears on Two Tabs Simultaneously
**File:** `components/settings/battery-settings-page.tsx` line 687

```tsx
{(activeSettingsTab === 'profile' || activeSettingsTab === 'compliance') && (
  <div ... > {/* EU Authorized Representative */} </div>
)}
```

The EU Authorized Representative card renders on both the "Profile" tab AND the "India Compliance" tab. From the India Compliance tab, users see the EU rep section interleaved with BIS/EPR/IEC fields, which is confusing. It also means the Save button on the India Compliance tab saves EU rep data, giving a false sense that compliance groupings are logical.

**Fix:** Create a dedicated "EU Compliance" tab (currently there is only "India Compliance"). Move the EU rep section there. Update the tab strip to: Profile | India Compliance | EU Compliance | Data Privacy | API Tokens | Suppliers.

---

### [P2] Dispatch: No Scan Count Limit or Confirmation Threshold
**File:** `components/dispatch/battery-dispatch-page.tsx`

There is no maximum on how many items can be scanned before submitting. In a warehouse scanning thousands of items, a misfire (scanning the wrong items, loop in the barcode reader) could accumulate 500+ wrong UUIDs. There is no "you have 200+ items — are you sure?" checkpoint.

Additionally, once dispatch is confirmed, there is no undo. Passports are transitioned to SHIPPED state with no reversal mechanism in the UI.

**Fix:**
- Add a configurable warning threshold (e.g. 200 items): "You have scanned 200 items. Confirm this is correct before dispatching."
- Show a two-step confirm for large batches (>100 items): "Type 'SHIP' to confirm dispatch of X items"
- Add a "Cancel Shipment" action in the lifecycle page for recently shipped passports (within 30 minutes)

---

### [P2] Analytics Polls Server Every 30s Even When Tab is Hidden
**File:** `components/analytics/battery-analytics-page.tsx` lines 186–194

```ts
const interval = setInterval(() => {
  fetchScanAnalytics();
  fetchComplianceAnalytics();
}, 30000);
```

Both fetch functions run every 30 seconds regardless of whether the user is looking at the page. If the user switches to another app for 2 hours, the analytics tab fires ~240 unnecessary API calls. With multiple users, this creates significant background load.

**Fix:**
```ts
const interval = setInterval(() => {
  if (document.visibilityState === 'visible') {
    fetchScanAnalytics();
    fetchComplianceAnalytics();
  }
}, 30000);
```

---

### [P2] No Pagination on `useBatches` — Breaks at Scale
**File:** `hooks/use-queries.ts` lines 24–37

```ts
const response = await api.get(`/batches?${params.toString()}`)
```

No `limit`, `offset`, or pagination parameters. Every component that calls `useBatches` fetches the entire batch list for the tenant. A manufacturer with 5,000 batches will send 5,000 records over the wire on every page load, and the client sorts them in JavaScript. This is an O(n) network + memory problem that grows with the user's data.

**Fix:** Add server-side pagination with a reasonable default (e.g. limit=100 for list views, with load-more). The batch list component should track `currentPage` and pass `limit/offset`. `dashboardStats` is a separate endpoint already; keep it separate.

---

### [P3] React Query: No `staleTime` Configuration
**File:** `hooks/use-queries.ts` (all query hooks)

None of the queries configure `staleTime`. TanStack Query v5 treats all data as stale by default, meaning any query will refetch on every window focus event. When a user switches apps and comes back, every query on the page (batches, dashboard stats, templates, billing balance, API keys) fires simultaneously. With 6+ queries, this creates a burst of concurrent requests.

**Fix:** Set reasonable stale times per data type:
```ts
// Dashboard stats: 5 minutes
staleTime: 5 * 60 * 1000,
// Batches list: 1 minute (changes frequently)
staleTime: 60 * 1000,
// Billing packages: 30 minutes (rarely changes)
staleTime: 30 * 60 * 1000,
// API keys: 10 minutes
staleTime: 10 * 60 * 1000,
```

---

### [P3] Public Passport Page: Hardcoded Brand Name "ANVIORA"
**File:** `apps/battery-web/app/p/[uuid]/page.tsx` line 219

```tsx
<p className="text-foreground text-sm tracking-tight">
  ANVIORA
</p>
```

The brand name on the public passport header is hardcoded as "ANVIORA" — not "ExportReady" or "Battery Passport Registry" or any configurable string. This appears to be a leftover from a rebrand. Every consumer who scans a QR code sees "ANVIORA" as the registry operator, which is inconsistent with all other branding.

**Fix:** Move brand name to an environment variable (`NEXT_PUBLIC_BRAND_NAME`). Replace the hardcoded string.

---

### [P3] Lifecycle Page: Client-Side Role Gate Can Drift From Backend
**File:** `components/lifecycle/battery-lifecycle-page.tsx` lines 223–240

```ts
function getAllowedLifecycleActions(status: string, role: DashboardActorRole): string[] {
  switch (status) {
    case "ACTIVE":
      return role === "ADMIN" ? ["SHIP", "RECALL"] : ["SHIP"];
    ...
  }
}
```

This client-side function computes which actions are shown in the dropdown. The backend enforces the actual rules. If the backend adds a new action (e.g. `REMANUFACTURE` for ACTIVE batteries) or changes which roles can RECALL, the frontend will show wrong options until a code deploy. In the meantime, users may see "RECALL" in the dropdown and receive a 403 from the backend, or not see an action that's actually available.

The backend already has a `GET /passports/bulk/allowed-actions` endpoint used in `selectAllMode`. Use this for per-row actions too.

**Fix:** Fetch allowed actions from the backend per passport, or remove the client-side gate entirely and let the backend return 403 with an appropriate error message. The dropdown could show all possible actions and grey out disallowed ones after attempting.

---

## 5. MISSING FEATURES / REGULATORY GAPS

### [P1] Mass Balance Tracks Only 4 Materials — EU Requires More
**File:** `components/mass-balance/mass-balance-page.tsx` lines 83–96

```ts
const totals: Record<MaterialType, ...> = {
  cobalt: { ... }, lithium: { ... }, nickel: { ... }, lead: { ... },
};
```

EU Battery Regulation 2023/1542 Annex XIII requires recycled content tracking for: cobalt, lithium, nickel, **and lead** (EV/LMT/industrial batteries) from **February 2031**, with earlier mandatory reporting from August 2028 for all covered batteries. Additionally, **natural graphite** and **manganese** must be declared as of October 2030 under the expanded critical raw materials list.

The current system is already missing manganese. By the time the regulation fully applies, the system will need at least 6 materials in the ledger.

**Fix:** Add `manganese` now. Design the material type system to be extensible (database-driven, not a hardcoded TypeScript union). Plan for graphite addition in the Q4 2026 roadmap.

---

### [P1] No Bulk EPCIS Export for Batches
**File:** `components/lifecycle/battery-lifecycle-page.tsx` lines 433–447

EPCIS export exists per passport (`GET /passports/{uuid}/epcis`). There is no bulk EPCIS export for a batch or a filtered selection. EU importers operating under the Digital Product Passport regulation need to receive EPCIS event files per shipment — which means 50–5,000 passports per export.

**Fix:** Add `POST /passports/bulk/epcis` that accepts an array of passport IDs or a batch ID and returns a single EPCIS 2.0 JSON-LD file. Add a "Export EPCIS" button to the batch detail page and to the dispatch success screen.

---

### [P2] No Undo / Cancel for Lifecycle Transitions
**File:** `components/dispatch/battery-dispatch-page.tsx`, `components/lifecycle/battery-lifecycle-page.tsx`

Once a passport is transitioned (SHIP, RECALL, RECYCLE), there is no reversal UI. If an operator accidentally ships the wrong passports, they must contact support. This is especially painful in the dispatch flow where 200+ passports can be transitioned in one click.

**Fix:**
- For transitions within the last 30 minutes, show a "Undo" option in the lifecycle events panel that creates a reversal transition with an admin note
- This requires a backend `REVERSE_TRANSITION` admin action with strict audit logging
- Show a time-limited undo toast ("200 passports shipped — Undo within 10 minutes") immediately after bulk dispatch

---

### [P2] No Real-Time Scan Analytics (Polling vs. WebSocket)
**File:** `components/analytics/battery-analytics-page.tsx`

The "Live Scan Feed" uses 30-second polling. For a manufacturer at a trade show or port scanning event, real-time scan visibility (who is scanning their products, from where) is a key selling point. 30-second lag means the live feed is not actually live.

**Fix:** Implement Server-Sent Events (SSE) for the scan feed endpoint (`GET /scans/feed/stream`). The Go backend can easily support SSE. The frontend subscribes on mount and unsubscribes on unmount. This eliminates polling while providing genuine real-time data.

---

### [P2] DVA Calculator: No Linkage to Batch DVA Field
**File:** `components/batches/dva-calculator.tsx`, `components/batches/create-batch-wizard.tsx`

The DVA calculator exists as a dialog with an "Apply to Batch" button. But there is no storage of the DVA calculation inputs (sale price, imported cost). When a user opens the calculator again, all inputs are blank. If the DVA calculation needs to be audited or reproduced, there is no record.

**Fix:** Store the DVA calculation inputs in the batch record alongside the DVA percentage (e.g. `dva_inputs: { sale_price_inr, imported_cost_inr, calculated_at }`). Display a read-only summary of last calculation in the wizard field.

---

### [P2] No Certificate Expiry Notifications
**Files:** `components/analytics/battery-analytics-page.tsx` (has `CertificateExpiryChart`)

The analytics page shows a certificate expiry chart. But there are no proactive notifications — no email, no in-app alert — when a BIS or EPR certificate is approaching expiry. If a certificate expires, all batch activations for that market would be blocked. This is a business continuity risk.

**Fix:** 
- Backend: Scheduled job (daily) that checks certificate expiry dates and emits events 90/30/7 days before expiry
- Frontend: Add expiry warning banners on the dashboard when any cert expires within 30 days
- Email: Trigger automated emails for expiry warnings

---

### [P3] `use-batch-validation.ts` Uses `useMutation` Without Debounce
**File:** `hooks/use-batch-validation.ts`

The batch validation hook is `useMutation`. In the wizard, the parent component debounces calls at 500ms. But `useMutation` has no built-in deduplication — if two debounced calls fire close together, both POST requests are sent. The second response may arrive before the first, and since mutation state tracks only the latest call, the UI could briefly show stale errors.

**Fix:** Use `useQuery` with `enabled: false` and manual `refetch()`, or add request cancellation via AbortController:
```ts
const controllerRef = useRef<AbortController | null>(null);
// On each validation call, abort previous and create new controller
```

---

## 6. GO BACKEND ISSUES

### [P1] `ValidateActivationCompliance` Is Deprecated But Still In Use
**File:** `services/battery-api/internal/services/activation_compliance.go` line 43

```go
// Deprecated: Use BatchService.ValidateActivation when a registry is available.
// This standalone function remains for backward compatibility in tests...
func ValidateActivationCompliance(batch *models.Batch, tenant *models.Tenant) ActivationComplianceResult {
```

The deprecated function uses `defaultRegistry` which is lazily initialized with a `sync.Once`. If the canonical `BatchService.ValidateActivation` has received fixes or rule additions that weren't backported to the standalone function, there will be silent drift. A test passing with the deprecated function may not match production behavior.

**Fix:** Complete the migration. Find all callers of `ValidateActivationCompliance` and replace with `BatchService.ValidateActivation`. Delete the deprecated standalone function.

---

### [P2] No Rate Limiting on Public Passport Endpoint
**File:** Backend `/passports/{uuid}` endpoint (no specific file read, inferred from `rate_limiter.go` existing in middleware/)

The public passport page records a scan on every load: `api.post('/scans/record', { passport_id })`. There is no rate limiting or deduplication on this endpoint visible in the frontend. A bot or misconfigured tool could inflate scan counts for any passport by hitting the public URL repeatedly.

**Fix:** Add IP-based rate limiting on `POST /scans/record` (e.g. 10 scans per IP per passport per hour). Deduplicate scan records by IP + passport + time window in the database.

---

### [P2] No Idempotency Key on Bulk Transitions
**File:** `services/battery-api/internal/handlers/lifecycle_handlers.go`

Bulk lifecycle transitions (dispatch, bulk SHIP) have no idempotency key. If the network drops during a large dispatch (500+ passports across chunks), the client retries all chunks from the beginning. This means passports in the first chunk could be transitioned twice, creating duplicate lifecycle events that corrupt the audit chain.

**Fix:** Generate a client-side idempotency key for each bulk operation session. The backend should check this key and return the cached result for duplicate requests within a 1-hour window.

---

## 7. HARDCODED VALUES & CODE SMELLS

### [P2] `formatBlockerLabel()` Is a Hardcoded String Map That Will Drift
**File:** `lib/activation-blockers.ts` lines 178–216

```ts
const map: Record<string, string> = {
  model_name: "Model name",
  "specs.chemistry": "Battery chemistry",
  // ... 30+ entries
};
```

Every time a new activation blocker is added to the backend, a matching entry must be manually added to this map. If it's forgotten, the UI shows the raw key string (`specs.new_field`) instead of a human-readable label. This has already drifted — the map has entries for `tenant.epr_certificate`, `tenant.bis_certificate`, `tenant.pli_certificate` (cert upload blockers) but the `getActivationBlockers()` function in the same file does NOT push these keys. They would only appear from backend compliance gaps.

**Fix:** Move blocker label definitions to the API response. The backend should return `{ field: "specs.chemistry", label: "Battery chemistry", message: "..." }` so the frontend never needs a label map.

---

### [P2] Carbon Calculator Country List Is Hardcoded and Incomplete
**File:** `components/batches/carbon-calculator.tsx` lines 77–89

```ts
const COUNTRIES = [
  { value: "CN", label: "🇨🇳 China" },
  { value: "IN", label: "🇮🇳 India" },
  // ... 9 countries total
]
```

Only 11 countries are listed. India's key cell import sources include Vietnam, Malaysia, and Taiwan — not in the list. EU manufacturers include Czech Republic, Slovakia, Spain — not in the list. Users assembling in countries not on the list cannot accurately calculate carbon footprint for their specific supply chain, defeating the purpose of the calculator.

**Fix:** Use the full ISO 3166-1 country list, or at minimum expand to the top 30 battery manufacturing/import nations. Fetch from an API or keep a complete static list.

---

### [P3] `resolveDashboardActorRole()` Falls Through to `null` for Unknown Roles
**File:** `components/lifecycle/battery-lifecycle-page.tsx` lines 211–221

```ts
function resolveDashboardActorRole(role?: string): DashboardActorRole {
  switch ((role || "").toUpperCase()) {
    case "OWNER": case "ADMIN": return "ADMIN";
    case "MEMBER": return "INTERNAL_OPERATOR";
    default: return null; // ← hides new roles silently
  }
}
```

If a new role is added to the backend (e.g. `"VIEWER"`, `"AUDITOR"`), this function returns `null`, and `getAllowedLifecycleActions(status, null)` returns `[]`. The user sees no actions in the dropdown and gets no explanation. The function should warn and return a safe default.

---

## 8. TECHNICAL DEBT

### [P2] Type Sync Comment Is Outdated
**File:** `lib/types.ts` line (header comment)

```ts
// SYNC WITH: services/battery-api/internal/models/models.go
// Last updated: 2026-05-14
```

Manual type synchronization between the Go backend models and the TypeScript frontend types is a known anti-pattern. The comment is the only enforcement mechanism. Any backend field addition that isn't reflected in this file causes silent `undefined` access on the frontend.

**Fix:** Generate TypeScript types from Go structs using `tygo` or `oapi-codegen` (if API has OpenAPI spec). Add a CI check that fails if the generated types differ from the committed ones.

---

### [P3] `use-queries.ts`: `useCorrectiveActions` Ignores `status` Parameter in Query Key
**File:** `hooks/use-queries.ts` lines 246–255

```ts
export function useCorrectiveActions(status?: string) {
  return useQuery({
    queryKey: queryKeys.correctiveActions(), // ← status not in key!
    queryFn: async () => {
      const params = status ? `?status=${status}` : ''
      const response = await api.get(`/corrective-actions${params}`)
    },
  })
}
```

The query key is `['correctiveActions']` regardless of `status`. If a component calls `useCorrectiveActions("OPEN")` and another calls `useCorrectiveActions("CLOSED")`, they share the same cache entry. One will display the other's data. This is a classic TanStack Query key bug.

**Fix:**
```ts
queryKey: ['correctiveActions', status ?? 'all'],
```

---

### [P3] `useBatches` Sorts Client-Side Instead of Relying on Server
**File:** `hooks/use-queries.ts` lines 30–33

```ts
return batches.sort((a, b) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
)
```

Client-side sort on potentially thousands of records. With pagination (when added), this sort will only apply to the current page, not the full dataset. The API should return batches ordered by `created_at DESC`.

**Fix:** Pass `order_by=created_at&order_dir=desc` to the API and remove the client-side sort.

---

## QUICK WINS TABLE

| # | File | Fix | Effort |
|---|------|-----|--------|
| 1 | `mass-balance-page.tsx:208` | Change `value=" "` to `value=""` in SelectItem | 5 min |
| 2 | `analytics-page.tsx:144` | `totalScans: response.data.total ?? scans.length` | 5 min |
| 3 | `analytics-page.tsx:189` | Add `document.visibilityState` check to interval | 5 min |
| 4 | `app/p/[uuid]/page.tsx:219` | Replace `"ANVIORA"` with `process.env.NEXT_PUBLIC_BRAND_NAME` | 10 min |
| 5 | `hooks/use-queries.ts:247` | Add `status` to `useCorrectiveActions` query key | 5 min |
| 6 | `dva-calculator.tsx:75` | Fix dark-themed hardcoded colors to use CSS vars | 15 min |
| 7 | `settings-page.tsx:101` | Only count `VERIFIED` (not PENDING) as green in readiness bar | 30 min |
| 8 | `carbon-calculator.tsx:98` | Map Ah→kWh conversion voltage by chemistry | 30 min |
| 9 | `dispatch-page.tsx:235` | Check ACTIVATE result before calling SHIP | 45 min |
| 10 | `batch-completion.ts:37` | Add materialComposition, hazardousSubstances, battery_category to EU checks | 1 hr |

---

## PRIORITY ORDER (P1 items only)

1. **[SEC] Public URLs for compliance docs** — change Supabase bucket to private + signed URLs
2. **[DATA] Dispatch ignores ACTIVATE result** — could ship non-compliant batteries
3. **[DATA] Completion ring false positive (EU)** — users create batches they cannot activate
4. **[DATA] Analytics "Total Scans" always ≤ 50** — executives see wrong numbers
5. **[SEC] Deprecated activation validator drift** — compliance rules may not match backend
6. **[UX] Settings no unsaved changes warning** — compliance config silently lost

---

*This audit covered all components not reviewed in v1. v1 issues (auth refresh on every load, onboarding state machine gaps, batch list O(n) re-renders, missing AI error states, dashboard KPI staleness) remain valid and should be worked in parallel.*
