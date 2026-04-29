# Manual Test Plan: Batch Creation → Activation → Lifecycle Events

> **Testing mode: Web Browser UI**  
> All tests performed at `http://localhost:3000` (or your staging URL).  
> No API client needed.

---

## SETUP — Do This First

### Step 1: Log in

1. Go to `http://localhost:3000/login`
2. Enter credentials: `admin@testbattery.in` / `TestPassword123!`
3. Click **Sign In**
4. You land on the Dashboard

---

### Step 2: Verify Tenant Compliance Settings

> India batch activation requires these fields on your tenant. Check once before all tests.

1. Click **Settings** in the left nav → **Organization**
2. Confirm (or fill in) these fields:

| Field label in UI | Value to enter |
|-------------------|----------------|
| EPR Registration Number | `EPR/WP/2024/00001` |
| BIS R-Number | `R-12345678` |
| IEC Code | `IEC0123456` |
| MoRTH Manufacturer Code | `MORTH-001` |

3. Click **Save** if you made changes

---

### Step 3: Verify Quota Balance

1. Click **Billing** in the left nav
2. Confirm **Quota Balance ≥ 1**
3. If balance is 0: top up before running activation tests (MT-ACT-01)

---

### Tools Needed

- Web browser (Chrome/Firefox recommended)
- The `qa_passports.csv` file (contents in SAMPLE DATA FILES section below)
- A notepad to record batch IDs and passport IDs as you go

---

## FIELD REFERENCE — Create Batch Form

> The "New Batch" slide-out panel has these fields. Bold = required.

### Core (all markets)

| Form label | Field name | Values | Notes |
|-----------|-----------|--------|-------|
| **Batch Name** | `batch_name` | Any text | e.g. `QA-India-Domestic-001` |
| Model Name | `model_name` | Any text | e.g. `ER-200` |
| **Market Region** | `market_region` | India / EU / Global | Dropdown |
| Mfg Start Date | `manufacturing_start_date` | Date picker | e.g. 2026-01-01 |
| Mfg End Date | `manufacturing_end_date` | Date picker | Must be ≥ start |
| Chemistry | `specs.chemistry` | LFP, NMC, LCO, NCA, LTO | |
| Capacity | `specs.capacity` | e.g. `100Ah` | |
| Voltage | `specs.voltage` | e.g. `3.2V` | |
| Manufacturer | `specs.manufacturer` | e.g. `Tata Chemicals` | |
| Weight | `specs.weight` | e.g. `2.5kg` | |

### India-only section (shown when Market = India)

| Form label | Field name | Values | Notes |
|-----------|-----------|--------|-------|
| **Cell Source** | `cell_source` | Domestic / Imported | Required for activation |
| **HSN Code** | `hsn_code` | 8 digits starting `8507` | e.g. `85076000` |
| Sale Price (₹) | `specs.sale_price_inr` | Number | Used to compute DVA |
| Import Cost (₹) | `specs.import_cost_inr` | Number | Used to compute DVA |
| PLI Compliant | `pli_compliant` | Checkbox | Auto-disabled if Imported |
| DVA Source | `dva_source` | Estimated / Audited | |
| Bill of Entry No. | `bill_of_entry_no` | e.g. `BOE-2026-MUM-99001` | Required if Imported |
| Country of Origin | `country_of_origin` | ISO code e.g. `CN` | Required if Imported |
| Customs Date | `customs_date` | Date picker | When cells cleared customs |
| Certifications | `specs.certifications` | AIS-156, AIS-038, BIS, CE, … | Multi-select / chips |

### EU-only section (shown when Market = EU)

| Form label | Field name | Values | Notes |
|-----------|-----------|--------|-------|
| **Carbon Footprint** | `specs.carbon_footprint` | e.g. `45 kg CO2eq/kWh` | Required for EU |
| EU Representative | `specs.eu_representative` | Name | |
| EU Rep Email | `specs.eu_representative_email` | Email | |

---

## SAMPLE DATA FILES

### File 1: `qa_passports.csv` — Upload passports in bulk

Save this as `qa_passports.csv` on your desktop:

```csv
serial_number,manufacture_date
IN-QA-LFP-2026-00001,2026-01-15
IN-QA-LFP-2026-00002,2026-01-15
IN-QA-LFP-2026-00003,2026-01-15
IN-QA-LFP-2026-00004,2026-01-16
IN-QA-LFP-2026-00005,2026-01-16
```

---

### File 2: `qa_global_passports.csv` — For GLOBAL batch

```csv
serial_number,manufacture_date
GLOBAL-QA-2026-001,2026-02-01
GLOBAL-QA-2026-002,2026-02-01
GLOBAL-QA-2026-003,2026-02-02
```

---

## PHASE 1 — Batch Creation

> **Navigation:** Go to **Batches** in the left nav → click **"New Batch"** button (top right).  
> A slide-out panel opens. Fill in the fields as described per test. Click **Create Batch** to submit.

---

### MT-BC-01 ✅ PASS — Create valid India batch (domestic cells)

**What this tests:** A correctly formed India-market batch with domestic cells, AIS certs, and PLI eligibility.

**Why it passes:** All required fields present. Cell Source = Domestic. DVA = `(50000-12000)/50000 × 100 = 76%` ≥ 50% → PLI eligible. AIS-156 + AIS-038 included for later activation.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `QA-India-Domestic-001`
   - **Model Name:** `ER-200`
   - **Market Region:** `India`
   - **Cell Source:** `Domestic`
   - **HSN Code:** `85076000`
   - **Mfg Start Date:** `2026-01-01`
   - **Mfg End Date:** `2026-02-28`
   - **Chemistry:** `LFP`
   - **Capacity:** `100Ah`
   - **Voltage:** `3.2V`
   - **Manufacturer:** `Tata Chemicals`
   - **Weight:** `2.5kg`
   - **Sale Price (₹):** `50000`
   - **Import Cost (₹):** `12000`
   - **PLI Compliant:** ✅ checked
   - **DVA Source:** `Estimated`
   - **Certifications:** add `AIS-156`, `AIS-038`, `BIS`
3. Click **Create Batch**

**Expected:** Toast: **"Batch created successfully"**. New row appears in batch list with status **Draft**, market **India**, DVA shows **76.0%**, PLI shows **PLI Eligible**.

**Save the batch ID** (click the copy icon next to the truncated ID) — use it for MT-ACT-01 through MT-ACT-06.

---

### MT-BC-02 ✅ PASS — Create valid EU batch

**What this tests:** EU market batch. Carbon footprint is mandatory for EU compliance.

**Why it passes:** Carbon footprint filled in. CE cert added.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `QA-EU-Export-001`
   - **Model Name:** `ER-EU-100`
   - **Market Region:** `EU`
   - **Mfg Start Date:** `2026-01-01`
   - **Mfg End Date:** `2026-03-31`
   - **Chemistry:** `NMC`
   - **Capacity:** `80Ah`
   - **Voltage:** `3.7V`
   - **Carbon Footprint:** `45 kg CO2eq/kWh`
   - **EU Representative:** `EU Rep GmbH`
   - **EU Rep Email:** `compliance@eurep.de`
   - **Certifications:** add `CE`, `UN38.3`
3. Click **Create Batch**

**Expected:** Toast: **"Batch created successfully"**. New row with status **Draft**, market badge **EU**.

---

### MT-BC-03 ✅ PASS — Create valid India batch (imported cells)

**What this tests:** India batch with cells imported from China. Customs fields required. PLI auto-disabled by system.

**Why it passes:** Bill of Entry + Country of Origin both filled. System forces PLI=false, DVA=0.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `QA-India-Imported-001`
   - **Model Name:** `ER-IMP-50`
   - **Market Region:** `India`
   - **Cell Source:** `Imported`
   - **HSN Code:** `85076000`
   - **Bill of Entry No.:** `BOE-2026-MUM-99001`
   - **Country of Origin:** `CN`
   - **Customs Date:** `2025-12-15`
   - **Chemistry:** `NMC`
   - **Capacity:** `50Ah`
   - **Certifications:** add `AIS-156`, `AIS-038`, `BIS`
3. Notice: **PLI Compliant checkbox is auto-disabled** (greyed out) as soon as you select Imported
4. Click **Create Batch**

**Expected:** Toast success. Row shows DVA: **0.0%**, NO "PLI Eligible" label.

> **Verify security override:** Even if you could tick PLI=true (e.g. via DevTools), the server resets it to false. The UI prevents this at the form level too.

---

### MT-BC-04 ❌ FAIL — Submit with blank Batch Name

**Why it fails:** Batch name is required.

**Steps:**

1. Click **New Batch**
2. Leave **Batch Name** empty
3. Set **Market Region:** `India`
4. Click **Create Batch**

**Expected:** Inline validation error appears under the Batch Name field: **"Batch name is required"**. Form does not submit. No toast.

---

### MT-BC-05 ❌ FAIL — Whitespace-only Batch Name

**Why it fails:** Blank/whitespace name is rejected server-side even if client-side validation passes.

**Steps:**

1. Click **New Batch**
2. **Batch Name:** `   ` (spaces only)
3. **Market Region:** `India`
4. Click **Create Batch**

**Expected:** Error toast or inline error: **"batch_name is required"** or **"Batch name cannot be blank"**.

---

### MT-BC-06 ❌ FAIL — EU batch without Carbon Footprint

**Why it fails:** `carbon_footprint` is required for EU Battery Regulation.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `EU No Carbon Test`
   - **Market Region:** `EU`
   - **Chemistry:** `LFP`
3. Leave **Carbon Footprint** empty
4. Click **Create Batch**

**Expected:** Error toast or inline error: **"EU compliance requires carbon_footprint in specs"** or similar. Batch is NOT created.

---

### MT-BC-07 ❌ FAIL — India DOMESTIC batch with Sale Price = 0

**Why it fails:** DVA = `(0 - 0) / 0 = 0%`. Domestic batches must have DVA > 0.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `Zero DVA Test`
   - **Market Region:** `India`
   - **Cell Source:** `Domestic`
   - **HSN Code:** `85076000`
   - **Sale Price (₹):** `0`
   - **Import Cost (₹):** `0`
3. Click **Create Batch**

**Expected:** Error: **"Domestic batches must have Domestic Value Add > 0%"** or similar. Batch NOT created.

---

### MT-BC-08 ❌ FAIL — India batch with invalid Cell Source value

**Why it fails:** Cell Source must be Domestic or Imported. The UI dropdown prevents other values, but if you test via API or browser DevTools this fails.

**Steps (browser DevTools method):**

1. Open DevTools → Network tab
2. Start filling a New Batch form normally (India, any valid fields)
3. Before submitting, intercept the request and change `cell_source` to `"MIXED"` in the payload
4. Send the modified request

**Expected:** Server returns `400 Bad Request`: **"cell_source must be IMPORTED or DOMESTIC"**.

> ℹ️ The UI itself prevents this via a controlled dropdown, so this test verifies the backend validation layer.

---

### MT-BC-09 ❌ FAIL — India IMPORTED missing Bill of Entry

**Why it fails:** Indian customs law requires Bill of Entry for all imported cells.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `Missing BOE Test`
   - **Market Region:** `India`
   - **Cell Source:** `Imported`
   - **HSN Code:** `85076000`
   - **Country of Origin:** `CN`
   - Leave **Bill of Entry No.** empty
3. Click **Create Batch**

**Expected:** Error: **"Imported batches must include Bill of Entry"** or inline validation on the Bill of Entry field. Batch NOT created.

---

### MT-BC-10 ❌ FAIL — India batch with bad HSN code

**Why it fails:** India HSN code for batteries must be 8 digits starting with `8507`.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `Bad HSN Test`
   - **Market Region:** `India`
   - **Cell Source:** `Domestic`
   - **HSN Code:** `12340000`
   - **Sale Price (₹):** `50000`
   - **Import Cost (₹):** `10000`
3. Click **Create Batch**

**Expected:** Error: **"HSN Code must start with 8507 for battery products"**. Batch NOT created.

---

### MT-BC-11 ❌ FAIL — Manufacturing end date before start date

**Why it fails:** End date must be on or after start date.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `Bad Dates Test`
   - **Market Region:** `Global`
   - **Mfg Start Date:** `2026-03-01`
   - **Mfg End Date:** `2026-01-01` ← earlier than start
3. Click **Create Batch**

**Expected:** Error: **"Manufacturing end date must be on or after start date"** or similar. Batch NOT created.

---

### MT-BC-12 ❌ FAIL — PLI claimed with DVA below 50%

**Why it fails:** PLI scheme requires ≥ 50% DVA. `(30000-20000)/30000 = 33.3%` < 50%.

**Steps:**

1. Click **New Batch**
2. Fill in:
   - **Batch Name:** `PLI Low DVA Test`
   - **Market Region:** `India`
   - **Cell Source:** `Domestic`
   - **HSN Code:** `85076000`
   - **Sale Price (₹):** `30000`
   - **Import Cost (₹):** `20000`
   - **PLI Compliant:** ✅ checked
3. Click **Create Batch**

**Expected:** Error: **"PLI Scheme requires minimum 50% Domestic Value Add. Calculated DVA: 33.33%."** Batch NOT created.

---

### MT-BC-13 ⚠️ EDGE — GLOBAL batch with no specs (minimal draft)

**Why it passes:** No spec fields are mandatory at creation time for GLOBAL market. Compliance is checked at activation.

**Steps:**

1. Click **New Batch**
2. Fill in ONLY:
   - **Batch Name:** `Minimal Global Draft`
   - **Market Region:** `Global`
3. Leave everything else empty
4. Click **Create Batch**

**Expected:** Toast success. Row appears in batch list as **Draft**, market **Global**. No specs shown.

---

### MT-BC-14 ⚠️ EDGE — IMPORTED cells with PLI=true attempted (security override)

**What this tests:** The form auto-disables PLI for imported cells. Even if bypassed, server overrides it.

**Steps — UI check:**

1. Click **New Batch**
2. Set **Cell Source:** `Imported`
3. **Observe:** PLI Compliant checkbox becomes greyed out and unchecked automatically

**Expected:** PLI checkbox is disabled. You cannot check it.

**Steps — Server override verification:**

1. Start a New Batch form with valid imported batch data
2. Open DevTools → Network → intercept the submit request
3. In the request payload, manually add `"pli_compliant": true, "domestic_value_add": 80.0`
4. Send the modified request

**Expected:** Batch created (201) but response shows `pli_compliant: false` and `domestic_value_add: 0`.

---

### MT-BC-15 ⚠️ EDGE — DVA Calculator preview (ESTIMATED mode)

**What this tests:** The DVA calculator widget shows live DVA % as you type prices. Confirms ESTIMATED mode ignores manually typed DVA field.

**Steps:**

1. Click **New Batch**
2. Set **Market Region:** `India`, **Cell Source:** `Domestic`
3. Set **Sale Price (₹):** `50000`
4. Set **Import Cost (₹):** `12000`
5. **Observe** the DVA calculator widget (if visible) showing `76.0%`
6. If there is a DVA % field you can type into, type `5.0` (low value)
7. Submit with **Batch Name:** `DVA Estimator Test`, **HSN Code:** `85076000`

**Expected:** After creation, the batch row shows **DVA: 76.0%** (server-calculated), NOT `5.0%` from your manual entry. Server always recalculates in ESTIMATED mode.

---

## PHASE 2 — Batch Activation

> **Prerequisite:** You have the batch from MT-BC-01 (India, DRAFT, has AIS-156+AIS-038). Note its ID.  
> **Navigation:** Go to **Batches** page. Find the batch in the table.

---

### MT-ACT-01 ✅ PASS — Activate valid India batch

**What this tests:** Full happy path. Batch meets all India compliance checks, quota available.

**Why it passes:** Tenant has EPR + BIS + IEC + MoRTH. Batch has AIS-156 + AIS-038. Quota ≥ 1.

**Step 1:** Check quota first — go to **Billing** in the left nav. Note the **Quota Balance** (e.g. 5).

**Step 2:** Go to **Batches** → find `QA-India-Domestic-001` → click the **⋮ menu** on the right → click **Activate**

**Step 3:** Confirm in the popup if one appears.

**Expected:**
- Toast: **"Batch activated!"**
- Row status badge changes from grey **Draft** → green **Active**
- Go to Billing — quota balance is now **previous - 1**

**Step 4:** Click on the batch row to open the detail page. Verify status shows **Active**.

---

### MT-ACT-02 ❌ FAIL — Activate already-active batch

**Why it fails:** You cannot activate a batch that is already Active.

**Step 1:** On the Batches page, find `QA-India-Domestic-001` (now Active).  
**Observe:** The **Activate** option no longer appears in the ⋮ menu for Active batches — the UI hides it.

**Step 2 (server-side verification):** Open DevTools → Network tab.  
Manually trigger `POST /api/v1/billing/activate/<BATCH_ID>` via the console or fetch:
```js
fetch('/api/v1/billing/activate/<BATCH_ID>', {
  method: 'POST',
  headers: { Authorization: 'Bearer <token>' }
})
```

**Expected:** `400 Bad Request` with `{ "error": "Batch is already active" }`.  
The UI prevents this visually, but the backend also enforces it.

---

### MT-ACT-03 ❌ FAIL — Activate with zero quota

**Why it fails:** Quota system prevents activation without credits.

**Step 1:** Go to **Billing** → verify quota is 0 (or ask admin to zero it out for this test).

**Step 2:** Create a new Draft batch using the same steps as MT-BC-01 (or duplicate an existing batch). Note its ID.

**Step 3:** On Batches page → ⋮ menu → **Activate**

**Expected:** 
- Toast: **"Insufficient quota. Please top up your credits."** (or similar error toast)
- Batch status stays **Draft**

> **Restore** your quota after this test.

---

### MT-ACT-04 ❌ FAIL — Activate batch from a different tenant

**Why it fails:** Tenant isolation — you cannot activate another company's batch.

**Step 1:** Get a batch ID from a different tenant (coordinate with another tester or create a second test account).

**Step 2:** In DevTools console:
```js
fetch('/api/v1/billing/activate/<OTHER_TENANTS_BATCH_ID>', {
  method: 'POST',
  headers: { Authorization: 'Bearer <your_token>' }
})
```

**Expected:** `403 Forbidden`. The batch does not appear in your Batches page at all (tenant isolation).

---

### MT-ACT-05 ❌ FAIL — Activate non-existent batch

**Why it fails:** Batch UUID does not exist in the database.

**Step 1:** In DevTools console:
```js
fetch('/api/v1/billing/activate/00000000-0000-0000-0000-000000000000', {
  method: 'POST',
  headers: { Authorization: 'Bearer <your_token>' }
})
```

**Expected:** `404 Not Found`.

---

### MT-ACT-06 ❌ FAIL — Activate batch missing AIS certifications

**Why it fails:** India compliance requires both `AIS-156` AND `AIS-038` in specs.certifications.

**Step 1:** Click **New Batch** → create a batch with these values:
- **Batch Name:** `QA-No-AIS-Test`
- **Market Region:** `India`
- **Cell Source:** `Domestic`
- **HSN Code:** `85076000`
- **Sale Price (₹):** `50000`, **Import Cost (₹):** `12000`
- **Certifications:** add only `BIS` (do NOT add AIS-156 or AIS-038)
- Click **Create Batch**

**Step 2:** On Batches page → find `QA-No-AIS-Test` → ⋮ menu → **Activate**

**Expected:** Error toast: **"Batch does not meet India compliance requirements"** mentioning missing AIS-156 / AIS-038. Batch status stays **Draft**.

---

### MT-ACT-07 ❌ FAIL — Activate with missing tenant EPR number

**Why it fails:** EPR registration is mandatory for India battery compliance.

**Step 1:** Go to **Settings** → **Organization** → clear the **EPR Registration Number** field → click Save.

**Step 2:** On Batches page → find `QA-India-Domestic-001` (or any Draft India batch) → ⋮ menu → **Activate**

**Expected:** Error toast mentioning missing **EPR Registration Number**. Batch stays Draft.

**Step 3:** Go back to Settings → restore `EPR/WP/2024/00001` → Save.

---

### MT-ACT-08 ❌ FAIL — No authentication (session expired)

**Why it fails:** All API calls require a valid auth token.

**Step 1:** Log out (click your avatar → Sign Out).

**Step 2:** Try to navigate directly to `/batches` — you should be redirected to `/login`.

**Step 3 (API-level):** In an incognito window, in DevTools console:
```js
fetch('/api/v1/billing/activate/<BATCH_ID>', { method: 'POST' })
```
(No Authorization header)

**Expected:** `401 Unauthorized`.

---

### MT-ACT-09 ❌ FAIL — Invalid UUID in path

**Why it fails:** Path parameter must be a valid UUID format.

**Step 1:** In DevTools console:
```js
fetch('/api/v1/billing/activate/not-a-valid-uuid', {
  method: 'POST',
  headers: { Authorization: 'Bearer <your_token>' }
})
```

**Expected:** `400 Bad Request`.

---

---

## PHASE 3 — Upload Passports to Batch

> Prerequisite: You have an **Active** batch from MT-ACT-01.  
> **Navigation:** Go to **Batches** → click on `QA-India-Domestic-001` to open detail page → click **Upload** tab.

---

### MT-UP-01 ✅ PASS — Upload CSV passports

**Step 1:** Save the `qa_passports.csv` file from the SAMPLE DATA section to your desktop.

**Step 2:** On the batch detail page → click the **Upload** tab.

**Step 3:** Drag and drop `qa_passports.csv` onto the upload area (or click to browse and select the file).

**Step 4:** Click **Upload** (if a separate submit button appears).

**Expected:**
- Progress indicator shows upload processing
- Toast: **"Passports uploaded successfully"** (or similar)
- Switch to the **Passports** tab — 5 passport rows appear:
  - `IN-QA-LFP-2026-00001` through `IN-QA-LFP-2026-00005`
  - All show status **Created**

**Step 5:** Note one of the passport UUIDs (visible in the row or by clicking the passport). Save it as `<PASSPORT_ID>` for Phase 4 tests.

---

---

## PHASE 4 — Passport Lifecycle Transitions

> **Navigation:** Go to **Lifecycle** in the left nav.  
> You'll see the status funnel at the top and a list of all passports.  
> For PARTNER actions (Technician, Recycler, Logistics): these are done via the **magic link action page** at `/p/<uuid>/action?token=<magic_token>`.

---

### MT-LC-01 ✅ PASS — ACTIVATE passport (CREATED → ACTIVE)

**Why it passes:** System-level ACTIVATE. No evidence needed.

**Method: Lifecycle page bulk action**

1. Go to **Lifecycle**
2. Find passport `IN-QA-LFP-2026-00001` (status: **Created**)
3. Check the checkbox on its row
4. The bulk action bar appears at the top — select **Activate** from the dropdown
5. Click **Apply**

**Expected:**
- Toast: **"1 passport(s) transitioned to ACTIVATE"** (or similar)
- Passport status changes to **Active** (blue badge)
- Click **Created** filter tile to see 0 remaining from your upload
- Click **Active** filter tile — your passport appears

---

### MT-LC-02 ✅ PASS — SHIP passport (ACTIVE → SHIPPED)

**Why it passes:** Internal operator role. Both evidence fields provided.

**Method: Lifecycle page bulk action**

> Note: Bulk SHIP may prompt for evidence. If it doesn't, the action may use system-level defaults. Check the UI behavior.

1. Go to **Lifecycle** → find `IN-QA-LFP-2026-00001` (status: **Active**)
2. Check its checkbox → select **Ship** from bulk action dropdown → click **Apply**
3. If a form appears asking for shipment details, fill:
   - **Shipment Reference:** `SHIP-QA-2026-0001`
   - **Shipment Date:** `2026-03-01`
4. Confirm / Submit

**Expected:**
- Toast: **"1 passport(s) transitioned to SHIP"**
- Passport status → **Shipped** (amber badge)
- **Shipped** counter in funnel increments by 1

---

### MT-LC-03 ✅ PASS — INSTALL passport (SHIPPED → IN_SERVICE) via Magic Link

**Why it passes:** Technician partner via magic link. Both installation evidence fields present.

**Step 1:** Generate a magic link for the passport:
1. Click on passport `IN-QA-LFP-2026-00001` to open its detail page (or `/p/<uuid>`)
2. Look for a **"Request Magic Link"** or **"Generate Partner Link"** button → click it
3. Copy the generated URL (format: `/p/<uuid>/action?token=<magic_token>`)

**Step 2:** Open the magic link URL in the browser (can be incognito).

**Step 3:** You see the action page with battery info and allowed actions. Select **"Mark as In Service"**.

**Step 4:** Fill in the evidence form:
   - **Installation Date:** `2026-04-15`
   - **Installer ID:** `installer-abc`

**Step 5:** Click **Submit / Confirm**

**Expected:**
- Success screen: **"Passport updated to IN_SERVICE"** (or similar confirmation)
- Go back to Lifecycle page → passport now shows **In Service** (green badge)

---

### MT-LC-04 ✅ PASS — RECALL passport (IN_SERVICE → RECALLED)

**Why it passes:** Admin role. Both recall evidence fields present.

**Method: Lifecycle page bulk action (Admin only)**

1. Go to **Lifecycle** → find `IN-QA-LFP-2026-00001` (status: **In Service**)
2. Check its checkbox → select **Recall** from bulk action dropdown → click **Apply**
3. If evidence form appears, fill:
   - **Recall Reason:** `Cell group 3 thermal runaway risk identified in QA testing`
   - **Recall Reference:** `RECALL-QA-2026-001`
4. Confirm

**Expected:**
- Toast: **"1 passport(s) transitioned to RECALL"**
- Passport status → **Recalled** (red badge)

---

### MT-LC-05 ✅ PASS — RECYCLE recalled passport (RECALLED → RECYCLED) via Magic Link

**Why it passes:** Recycler partner via magic link. All three recycling evidence fields provided.

**Step 1:** Generate a magic link for the recalled passport (same method as MT-LC-03, Step 1).

**Step 2:** Open the magic link URL.

**Step 3:** Select **"Mark as Recycled"**.

**Step 4:** Fill in:
   - **Recycler EPR ID:** `EPR/REC/2024/001`
   - **Recycling Date:** `2026-07-01`
   - **Certificate Reference:** `CERT-REC-QA-2026-001`

**Step 5:** Click **Submit**

**Expected:**
- Success confirmation on the action page
- Lifecycle page: passport shows **Recycled** (purple badge)

---

### MT-LC-06 ✅ PASS — CLOSE passport (RECYCLED → END_OF_LIFE) via Magic Link

**Why it passes:** Recycler can close. Certificate reference evidence required.

**Step 1:** Generate a magic link for the recycled passport.

**Step 2:** Open magic link URL → select **"Close as End of Life"**.

**Step 3:** Fill in:
   - **Certificate Reference:** `CERT-EOL-QA-2026-001`

**Step 4:** Click **Submit**

**Expected:**
- Success on action page
- Lifecycle page: passport shows **End of Life** (grey badge)
- The passport no longer appears in any active filter

---

### MT-LC-07 ❌ FAIL — SHIP with missing shipment_date

**Why it fails:** SHIP requires both `shipment_reference` AND `shipment_date`. Missing either is rejected.

**Setup:** Use a fresh ACTIVE passport (activate `IN-QA-LFP-2026-00002` using MT-LC-01 steps).

**Steps:**

1. Go to Lifecycle → select `IN-QA-LFP-2026-00002` (Active)
2. Select **Ship** bulk action → Apply
3. If evidence form appears, fill **Shipment Reference** but leave **Shipment Date** empty
4. Submit

**Expected:** Inline validation error: **"Shipment date is required"** or form prevents submission. If no form (bulk action skips evidence), test via DevTools:
```js
fetch('/api/v1/passports/<ID>/transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({
    action: 'SHIP',
    actor_context: { actor_type: 'USER', actor_id: 'op@test.in', actor_role: 'INTERNAL_OPERATOR', source: 'INTERNAL' },
    evidence: { shipment_reference: 'SHIP-MISSING-DATE' }
  })
})
```

**Expected:** `400` — `{ "error": "invalid evidence: shipment_date is required" }`

---

### MT-LC-08 ❌ FAIL — SHIP from CREATED (wrong state, must ACTIVATE first)

**Why it fails:** SHIP is only allowed from `ACTIVE`. You cannot skip ACTIVATE.

**Setup:** Use `IN-QA-LFP-2026-00003` which is still in **Created** state (not yet activated).

**Steps (DevTools):**
```js
fetch('/api/v1/passports/<CREATED_PASSPORT_ID>/transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({
    action: 'SHIP',
    actor_context: { actor_type: 'USER', actor_id: 'op@test.in', actor_role: 'INTERNAL_OPERATOR', source: 'INTERNAL' },
    evidence: { shipment_reference: 'SHIP-WRONG-STATE', shipment_date: '2026-03-01' }
  })
})
```

**Expected:** `409`/`400` — error: **"Action SHIP not allowed from CREATED"**

> ℹ️ The Lifecycle UI bulk action dropdown won't show SHIP as an option when a Created passport is selected — the backend still enforces this if bypassed.

---

### MT-LC-09 ❌ FAIL — Any action from END_OF_LIFE (terminal state)

**Why it fails:** `END_OF_LIFE` is terminal — no further transitions allowed.

**Setup:** Use the passport from MT-LC-06 (now End of Life).

**Steps (DevTools):**
```js
fetch('/api/v1/passports/<EOL_PASSPORT_ID>/transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({
    action: 'SHIP',
    actor_context: { actor_type: 'USER', actor_id: 'op@test.in', actor_role: 'INTERNAL_OPERATOR', source: 'INTERNAL' },
    evidence: { shipment_reference: 'SHIP-EOL', shipment_date: '2026-03-01' }
  })
})
```

**Expected:** `409`/`400` — **"Action SHIP not allowed from END_OF_LIFE"**

---

### MT-LC-10 ❌ FAIL — SHIP by wrong role (Recycler trying to ship)

**Why it fails:** Only `INTERNAL_OPERATOR` or `LOGISTICS` can SHIP. RECYCLER is not allowed.

**Steps (DevTools):**
```js
fetch('/api/v1/passports/<ACTIVE_PASSPORT_ID>/transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({
    action: 'SHIP',
    actor_context: { actor_type: 'PARTNER', actor_id: 'recycler-001', actor_role: 'RECYCLER', source: 'MAGIC_LINK' },
    evidence: { shipment_reference: 'SHIP-WRONG-ROLE', shipment_date: '2026-03-01' }
  })
})
```

**Expected:** `403 Forbidden` — **"Role RECYCLER is not permitted to perform SHIP"**

---

### MT-LC-11 ❌ FAIL — PARTNER actor using INTERNAL source

**Why it fails:** PARTNER actors must use `MAGIC_LINK` source. `INTERNAL` source is only valid for USER and SYSTEM actors.

**Steps (DevTools):**
```js
fetch('/api/v1/passports/<ACTIVE_PASSPORT_ID>/transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({
    action: 'SHIP',
    actor_context: { actor_type: 'PARTNER', actor_id: 'logistics-001', actor_role: 'LOGISTICS', source: 'INTERNAL' },
    evidence: { shipment_reference: 'SHIP-TYPE-MISMATCH', shipment_date: '2026-03-01' }
  })
})
```

**Expected:** `400 Bad Request` — **"Invalid actor context"**

---

### MT-LC-12 ❌ FAIL — Unknown action

**Why it fails:** Only `ACTIVATE`, `SHIP`, `INSTALL`, `RECALL`, `RECYCLE`, `CLOSE` are valid.

**Steps (DevTools):**
```js
fetch('/api/v1/passports/<PASSPORT_ID>/transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({
    action: 'EXPLODE',
    actor_context: { actor_type: 'USER', actor_id: 'admin@test.in', actor_role: 'ADMIN', source: 'INTERNAL' }
  })
})
```

**Expected:** `400 Bad Request` — **"Unknown action: EXPLODE"**

---

### MT-LC-13 ❌ FAIL — Extra unexpected evidence field

**Why it fails:** Evidence is strictly validated. Any field not in the required set for that action is rejected.

**Steps (DevTools):**
```js
fetch('/api/v1/passports/<ACTIVE_PASSPORT_ID>/transition', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({
    action: 'SHIP',
    actor_context: { actor_type: 'USER', actor_id: 'op@test.in', actor_role: 'INTERNAL_OPERATOR', source: 'INTERNAL' },
    evidence: {
      shipment_reference: 'SHIP-EXTRA-001',
      shipment_date: '2026-03-01',
      surprise_field: 'this should be rejected'
    }
  })
})
```

**Expected:** `400 Bad Request` — **"invalid evidence: unexpected evidence field surprise_field"**

---

---

## PHASE 5 — Audit Chain Integrity

> The audit chain verifies no event has been tampered with. Access it from the passport detail page.

---

### MT-AC-01 ✅ PASS — Verify chain after full lifecycle

**What this tests:** After ACTIVATE → SHIP → INSTALL (MT-LC-01 through MT-LC-03), the audit chain is valid.

**Step 1:** Go to **Lifecycle** → click on the passport you transitioned through all 3 states.

**Step 2:** On the passport detail page, look for an **Audit Trail** or **Event History** section.

**Step 3:** Verify:
- All events are listed in order (ACTIVATE, SHIP, INSTALL)
- Each event shows a hash value
- A **"Chain Valid"** indicator (green checkmark or similar) is visible

**Alternative (API):** In DevTools:
```js
fetch('/api/v1/passports/<PASSPORT_ID>/audit-chain', {
  headers: { Authorization: 'Bearer <token>' }
}).then(r => r.json()).then(console.log)
```

**Expected:**
```json
{ "valid": true, "failed_at_index": -1, "event_count": 3 }
```

---

### MT-AC-02 ✅ PASS — Verify chain on fresh passport (0 events)

**Step 1:** Upload a new passport to your batch (or use `IN-QA-LFP-2026-00005` that was never transitioned).

**Step 2:** Open that passport's detail page → check the Audit Trail section.

**Expected:**
- Empty event list (or "No events yet")
- Chain is valid (nothing to be invalid)

**Alternative (API):**
```js
fetch('/api/v1/passports/<FRESH_PASSPORT_ID>/audit-chain', {
  headers: { Authorization: 'Bearer <token>' }
}).then(r => r.json()).then(console.log)
```

**Expected:** `{ "valid": true, "failed_at_index": -1, "event_count": 0 }`

---

### MT-AC-03 ❌ FAIL — Tampered event detection

> ⚠️ **Staging DB access required.** Only perform on a dedicated QA instance. Do NOT run on production.

**Step 1:** Get a passport with at least 2 events. Note its `<PASSPORT_ID>`.

**Step 2:** Connect to the staging PostgreSQL database and run:
```sql
UPDATE passport_events
SET hash = 'tampered-hash-000000000000000000000000000000000000000000000000'
WHERE passport_id = '<PASSPORT_ID>'
ORDER BY created_at ASC
LIMIT 1;
```

**Step 3:** Reload the passport detail page → check the Audit Trail.

**Expected:** Chain shows as **invalid** — a red indicator or error on the first event. The hash mismatch is visible.

**Alternative (API):**
```js
fetch('/api/v1/passports/<PASSPORT_ID>/audit-chain', {
  headers: { Authorization: 'Bearer <token>' }
}).then(r => r.json()).then(console.log)
```

**Expected:** `{ "valid": false, "failed_at_index": 0 }`

---

## TEST EXECUTION CHECKLIST

Mark each test ✅ Pass / ❌ Fail / ⏭ Skip as you run them.

> **UI tests** = done in the browser. **DevTools** = done via browser console fetch().

### Phase 1 — Batch Creation (UI)

| ID | Title | How | Result | Notes |
|----|-------|-----|--------|-------|
| MT-BC-01 | Create valid India batch (domestic) | UI | | Save batch ID |
| MT-BC-02 | Create valid EU batch | UI | | |
| MT-BC-03 | Create valid India batch (imported) | UI | | PLI auto-disabled |
| MT-BC-04 | Blank Batch Name | UI | | Expect inline error |
| MT-BC-05 | Whitespace-only Batch Name | UI | | Expect error |
| MT-BC-06 | EU batch without carbon_footprint | UI | | Expect error |
| MT-BC-07 | India DOMESTIC, Sale Price = 0 | UI | | Expect DVA error |
| MT-BC-08 | Invalid cell_source via DevTools | DevTools | | Expect 400 |
| MT-BC-09 | IMPORTED missing Bill of Entry | UI | | Expect error |
| MT-BC-10 | Bad HSN code | UI | | Expect error |
| MT-BC-11 | End date before start date | UI | | Expect error |
| MT-BC-12 | PLI with DVA < 50% | UI | | Expect error |
| MT-BC-13 | Minimal GLOBAL draft | UI | | Expect 201/success |
| MT-BC-14 | IMPORTED + PLI=true UI check | UI | | PLI disabled by form |
| MT-BC-15 | DVA estimator shows server calc | UI | | Verify server overrides |

### Phase 2 — Batch Activation (UI + DevTools)

| ID | Title | How | Result | Notes |
|----|-------|-----|--------|-------|
| MT-ACT-01 | Activate valid India batch | UI ⋮ menu | | Check quota -1 |
| MT-ACT-02 | Activate already-active (no menu item) | UI + DevTools | | Expect 400 |
| MT-ACT-03 | Activate with zero quota | UI | | Expect error toast |
| MT-ACT-04 | Wrong tenant batch | DevTools | | Expect 403 |
| MT-ACT-05 | Non-existent batch UUID | DevTools | | Expect 404 |
| MT-ACT-06 | Missing AIS certifications | UI ⋮ menu | | Expect error toast |
| MT-ACT-07 | Missing tenant EPR number | UI ⋮ menu | | Restore EPR after |
| MT-ACT-08 | No auth / logged out | DevTools | | Expect 401 |
| MT-ACT-09 | Invalid UUID in path | DevTools | | Expect 400 |

### Phase 3 — Passport Upload (UI)

| ID | Title | How | Result | Notes |
|----|-------|-----|--------|-------|
| MT-UP-01 | Upload CSV passports | UI Upload tab | | Save passport IDs |

### Phase 4 — Lifecycle Transitions (UI + DevTools)

| ID | Title | How | Result | Notes |
|----|-------|-----|--------|-------|
| MT-LC-01 | ACTIVATE (CREATED → ACTIVE) | UI bulk action | | |
| MT-LC-02 | SHIP (ACTIVE → SHIPPED) | UI bulk action | | Check shipped_at |
| MT-LC-03 | INSTALL (SHIPPED → IN_SERVICE) | Magic link page | | |
| MT-LC-04 | RECALL (IN_SERVICE → RECALLED) | UI bulk action | | |
| MT-LC-05 | RECYCLE recalled | Magic link page | | Check recycler_epr_id |
| MT-LC-06 | CLOSE (RECYCLED → END_OF_LIFE) | Magic link page | | |
| MT-LC-07 | SHIP missing shipment_date | DevTools | | Expect 400/422 |
| MT-LC-08 | SHIP from CREATED | DevTools | | Expect 409/400 |
| MT-LC-09 | Any action from END_OF_LIFE | DevTools | | Expect 409/400 |
| MT-LC-10 | SHIP by RECYCLER role | DevTools | | Expect 403 |
| MT-LC-11 | PARTNER + INTERNAL source | DevTools | | Expect 400 |
| MT-LC-12 | Unknown action EXPLODE | DevTools | | Expect 400 |
| MT-LC-13 | Extra evidence field | DevTools | | Expect 400 |

### Phase 5 — Audit Chain (UI + DevTools)

| ID | Title | How | Result | Notes |
|----|-------|-----|--------|-------|
| MT-AC-01 | Verify chain after 3 transitions | UI detail page | | Expect valid |
| MT-AC-02 | Verify chain on 0 events | UI detail page | | Expect valid |
| MT-AC-03 | Tampered hash detection | DB + DevTools | | Staging only |
