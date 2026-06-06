# Batch Creation Form — UX Audit & Improvement Plan

## Audit Date: 2026-06-06
## Scope: `apps/battery-web/components/batches/create-batch-wizard.tsx` + `batch-form-steps/`

---

## 1. Bugs Fixed Today

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Draft "Resume" button does nothing | `reset(draft.data)` failed silently when schema drifted (new fields added since draft saved). No error handling. | Merged draft with `defaultBatchFormValues` as fallback. Added try-catch + `clearDraft()` on resume. |
| AI "Describe in Words" returns "model don't exist" | Groq deprecated `llama-3.1-70b-versatile`. API returns 404. | Updated to `llama-3.3-70b-versatile` (current Groq model). |
| AI-populated fields not saved in draft | `applyPdfResult` / `applyNlResult` called `setValue()` without `{ shouldDirty: true }`. Draft auto-save only triggers when `isDirty === true`. | Added `{ shouldDirty: true }` to all AI `setValue` calls. |
| Cell source dropdown doesn't stick | Native `<select>` + `setValue` without `shouldValidate` in `mode: "onBlur"` form. Controlled component sync issues across step re-mounts. | Replaced with shadcn `Select` + `{ shouldValidate: true, shouldDirty: true }`. |
| CA certificate re-upload broken | File `<input>` never reset after upload. Selecting same file again = no `onChange` event. | Added `e.target.value = ""` reset in `handleFileChange`. |

---

## 2. Current Field Inventory (All 4 Steps)

### Step 1 — Identity (8 fields)
| Field | Required | Market | Notes |
|-------|----------|--------|-------|
| Batch Name | ✅ | All | |
| Model Name | ✅ | All | |
| Manufacturing Start | ✅ | All | Date |
| Manufacturing End | ✅ | All | Date |
| Market Region | ✅ | All | INDIA / EU / GLOBAL |
| Manufacturer | ✅ | All | |
| Manufacturer Address | ❌ | All | |
| Manufacturer Email | ❌ | All | Email validation |
| GTIN | ❌ | All | 14-digit, EU QR codes |

### Step 2 — Specifications (8 fields + material composition)
| Field | Required | Market | Notes |
|-------|----------|--------|-------|
| Chemistry | ✅ | All | Enum: LFP, NMC, NCA, etc. |
| Battery Category | ❌ | EU/GLOBAL | EV, LMT, INDUSTRIAL, PORTABLE, SLI |
| Capacity | ✅ | All | |
| Voltage | ✅ | All | |
| Weight | ❌ | All | |
| Recyclable | ❌ | All | Checkbox |
| Material Composition (6 base + 4 recycled) | ❌ | All | Percents |
| Carbon Footprint | ❌ | EU/GLOBAL | String e.g. "120 kg CO2e" |
| Certifications | ❌ | All | Array |

### Step 3 — Compliance (20+ fields, most confusing)
| Field | Required | Market | Notes |
|-------|----------|--------|-------|
| HSN Code | ✅ | INDIA | Must start with 8507 |
| BIS Number | ❌ | INDIA | R-Number |
| EPR Number | ❌ | INDIA | |
| Cell Source | ✅ | INDIA | IMPORTED / DOMESTIC |
| Bill of Entry No | ✅ | INDIA + IMPORTED | |
| Country of Origin | ✅ | INDIA + IMPORTED | 2-letter ISO |
| Customs Date | ✅ | INDIA + IMPORTED | Date |
| PLI Compliant | ❌ | INDIA + DOMESTIC | Checkbox |
| DVA Source | ❌ | INDIA + DOMESTIC | ESTIMATED / AUDITED |
| Sale Price | ❌ | INDIA + ESTIMATED | ₹ |
| Import Cost | ❌ | INDIA + ESTIMATED | ₹ |
| Audited DVA % | ✅ | INDIA + AUDITED | 0-100 |
| CA Certificate URL | ✅ | INDIA + AUDITED | PDF upload |
| BIS Cert Issue Date | ❌ | INDIA | Date |
| UN38.3 Test Date | ❌ | INDIA | Date |
| UN38.3 Lab Name | ❌ | INDIA | NEW — for registry verification |
| IEC 62133 Test Date | ❌ | INDIA | Date |
| MSDS Issue Date | ❌ | INDIA | Date |
| Carbon Performance Class | ❌ | EU | A-G |
| Expected Lifetime | ❌ | EU | Cycles |
| Warranty Months | ❌ | EU | |
| CE Marking | ❌ | EU | Checkbox |
| Removable & Replaceable | ❌ | EU | Checkbox |
| EU Representative | ❌ | EU | |
| EU Rep Email | ❌ | EU | |
| EU Rep Address | ❌ | EU | |
| Notified Body Number | ❌ | EU | 4-digit |
| DoC Upload | ❌ | EU | PDF |
| Hazardous Substances (3 checkboxes) | ❌ | All | Lead, Mercury, Cadmium |
| Hazardous Declaration | ❌ | EU | Text |
| Recycled Content per Material (4 fields) | ❌ | EU/GLOBAL | % |

### Step 4 — Review (2 fields)
| Field | Required | Notes |
|-------|----------|-------|
| Save as Template | ❌ | Checkbox |
| Template Name | ✅ | Only if saveAsTemplate=true |

**Total: ~45 fields.** For a simple India DOMESTIC batch, user still sees EU Carbon Performance Class, EU Representative, etc. because there's no progressive disclosure.

---

## 3. Critical UX Problems Found

### Problem A: No Progressive Disclosure
- User selects **INDIA** market but still sees EU Representative, Carbon Performance Class, Recycled Content fields.
- User selects **IMPORTED** cells but DVA calculator is still visible (just disabled-looking).
- **Fix:** Hide fields that don't apply to the selected market + cell source combination.

### Problem B: Validation Feedback is Delayed
- `mode: "onBlur"` means errors only show when user leaves a field.
- User can fill 20 fields wrong and only find out on Step 4 Review or when clicking Next.
- **Fix:** Change to `mode: "onChange"` for high-confidence fields (email, number ranges). Keep `onBlur` for complex fields.

### Problem C: No Inline Help / Tooltips
- Fields like "HSN Code", "BIS Number", "Notified Body Number" have no explanation.
- User doesn't know what "DVA" means without clicking around.
- **Fix:** Add info tooltips with examples to every compliance field.

### Problem D: DVA Calculator is Buried and Basic
- Only appears when DOMESTIC + ESTIMATED selected.
- Calculation: `(salePrice - importCost) / salePrice * 100`.
- No explanation of what 50% threshold means for PLI.
- **Fix:** Make it a visible card with real-time calculation, color-coded eligibility, and explanation.

### Problem E: Certificate Dates vs Registry Verification are Disconnected
- User enters BIS Certificate Issue Date, UN38.3 Test Date, etc. in Step 3.
- But the Registry Verification tab (post-creation) does the actual scraping.
- User doesn't know the dates they enter here will be checked against live registries.
- **Fix:** Add a "Pre-flight Check" in Step 4 that shows which registries will be auto-verified and what certificate numbers are needed.

### Problem F: AI Feature is Hidden
- "AI Assistant" is a small purple box at the top of Step 1.
- Most users probably don't notice it.
- **Fix:** Make it a prominent first-class option: "Start with AI" vs "Fill Manually".

### Problem G: Template System is Underused
- Templates are just a dropdown at the top of Step 1.
- No preview of what a template fills.
- **Fix:** Show template cards with preview of key specs.

### Problem H: No Real-Time Batch Readiness Score During Creation
- `BatchReadinessBar` only exists on the batch detail page AFTER creation.
- User creates a batch, then finds out it's missing fields.
- **Fix:** Add a mini readiness score in the wizard footer that updates as fields are filled.

---

## 4. Improvement Plan — Phased

### Phase 1: Progressive Disclosure (Quick Win — 1 day)
- [ ] In `StepIdentity`: Only show GTIN field when market is EU or GLOBAL.
- [ ] In `StepCompliance`: Split into 3 sub-sections that appear based on market:
  - **India Section**: HSN, BIS, EPR, Cell Source, Customs, DVA, Cert dates
  - **EU Section**: Carbon class, EU rep, Notified body, DoC, Hazardous
  - **Global Section**: Both India + EU fields
- [ ] In `StepCompliance`: DVA section only appears when `cellSource === "DOMESTIC"`.
- [ ] In `StepCompliance`: Customs section only appears when `cellSource === "IMPORTED"`.

### Phase 2: Smart Defaults & Pre-fill (1 day)
- [ ] Auto-fill manufacturer from user's company profile (already partially done for EU rep).
- [ ] Auto-fill country of origin from tenant's registered address.
- [ ] When market = INDIA, auto-set certifications to `["AIS-156", "AIS-038"]` (already done).
- [ ] When market = EU, auto-set certifications to `["CE"]` (already done).
- [ ] Pre-fill BIS Number from tenant's `bis_r_number` if available.

### Phase 3: Inline Validation & Help (1-2 days)
- [ ] Change `mode: "onBlur"` to `mode: "onChange"` for fields with simple validation (email, numbers, dates).
- [ ] Add `shouldValidate: true` to all `setValue` calls that change conditional logic (market region, cell source).
- [ ] Add info tooltips to every compliance field:
  - HSN Code: "8507.60 for Li-ion accumulators"
  - BIS Number: "R-Number format: R-XXXXXXXX"
  - Notified Body: "4-digit EU NANDO number, e.g. 0884"
  - DVA: "Domestic Value Add = (Sale Price − Import Cost) / Sale Price × 100"

### Phase 4: Real-Time DVA Calculator Enhancement (1 day)
- [ ] Move DVA calculator to a sticky card on the right side (desktop) or top (mobile).
- [ ] Show real-time calculation as user types.
- [ ] Color-code: <50% = red "Ineligible for PLI", ≥50% = green "PLI Eligible".
- [ ] Add tooltip: "PLI requires ≥50% DVA for battery manufacturing under scheme."

### Phase 5: Wizard Footer Readiness Score (1 day)
- [ ] Add a mini `BatchReadinessBar` in the wizard footer.
- [ ] Calculate readiness from current form values (not just dates).
- [ ] Show "X of Y required fields filled" counter.
- [ ] If readiness < 100%, show which required fields are missing.

### Phase 6: AI-First Entry Point (1-2 days)
- [ ] Redesign Step 0 (before Step 1) as a choice:
  - **"Describe your batch in words"** → NL create (fastest)
  - **"Upload a datasheet PDF"** → PDF parse
  - **"Start from a template"** → Template gallery (cards with preview)
  - **"Fill manually"** → Current wizard
- [ ] If AI/Template is used, pre-fill all 4 steps and land user on Step 4 Review.

### Phase 7: Registry Pre-Flight in Step 4 (1 day)
- [ ] In Step 4 Review, add a "Registry Verification Preview" card.
- [ ] Show which registries will be checked based on batch specs:
  - BIS: ✅ if `bis_number` provided → will verify against BIS portal
  - CPCB: ✅ if `epr_number` provided → will cross-reference ledger
  - UN38.3: ⚠️ if `un38_3_test_date` provided but no `un38_3_lab_name` → "Add lab name for full validation"
  - EU NANDO: ✅ if `ce_notified_body_number` provided
- [ ] Let user fix missing fields right from Step 4 without going back.

---

## 5. Data Flow Verification Checklist

| Data Path | Status | Verification |
|-----------|--------|--------------|
| Form → React Hook Form | ✅ | All fields registered or controlled via `setValue` |
| RHF → Draft localStorage | ✅ | `scheduleDraftSave` debounced at 5s, triggers on `isDirty` |
| Draft → Resume | ✅ | Fixed today — merges with defaults + clears on resume |
| AI NL → Form | ✅ | `createBatchFromNL` API → `applyNlResult` → `setValue` with `shouldDirty` |
| AI PDF → Form | ✅ | `parseDatasheet` API → `applyPdfResult` → `setValue` with `shouldDirty` |
| Template → Form | ✅ | `handleTemplateSelect` → `reset({ ...watch(), ...updates })` |
| Form → API Payload | ✅ | `onSubmit` builds payload from `data` object |
| DVA Calculation | ✅ | `(salePrice - importCost) / salePrice * 100` in UI |
| Certificate Upload → Supabase | ✅ | `compliance-docs` bucket, path: `certificates/{tenant_id}/{batchName}_{timestamp}.pdf` |
| Upload → Form URL | ✅ | `setValue("uploadedFileUrl", publicUrl)` |
| Upload → API Payload | ✅ | `payload.pli_certificate_url = data.uploadedFileUrl` |
| Registry dates → Batch specs | ✅ | `bis_certificate_issue_date`, `un38_3_test_date`, etc. go into `specs` JSONB |
| Registry numbers → Verification | ✅ | `bis_number`, `epr_number`, `ce_notified_body_number` in `specs` |

---

## 6. Quick Fixes You Can Apply Now

### 6.1 Hide EU fields when market = INDIA
In `step-compliance.tsx`, wrap EU-specific fields with `{isEU && (...)}` or `{!isIndia && (...)}`.

### 6.2 Hide DVA when cell source = IMPORTED
Already partially done with `{cellSource !== "IMPORTED" && (...)}`. But the DVA mode buttons should also be hidden.

### 6.3 Add field-level help text
Replace bare Labels with Labels that have info icons + tooltips.

### 6.4 Show required field counter in footer
```tsx
const requiredFields = ["batchName", "modelName", "manufacturingStartDate", ...];
const filledCount = requiredFields.filter(f => !!watch(f)).length;
```

---

## 7. Acceptance Criteria

- [ ] User creating an INDIA + DOMESTIC batch sees only India-relevant fields (~15 fields instead of 45).
- [ ] User creating an EU batch sees only EU-relevant fields.
- [ ] DVA calculator updates in real-time and shows PLI eligibility.
- [ ] Draft auto-save captures AI-populated fields.
- [ ] Draft resume works even after schema changes.
- [ ] AI NL feature returns results (Groq model updated).
- [ ] Step 4 Review shows registry verification preview.
- [ ] Wizard footer shows "X of Y required fields" + readiness %.
- [ ] All required fields have red asterisk and inline validation.
- [ ] Optional fields have gray "Optional" label.
