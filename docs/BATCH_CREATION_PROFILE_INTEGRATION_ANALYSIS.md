# Batch Creation × Profile Integration — Deep Dive Analysis

> **Date:** 2026-06-07  
> **Scope:** `apps/battery-web` + `services/battery-api`  
> **Goal:** Eliminate redundant data entry, enforce profile completeness, and optimize the batch creation UX.

---

## 1. Executive Summary

The batch creation wizard currently asks users to re-enter **~15 fields** that are already (or should be) stored in their tenant profile. This creates friction, errors, and a poor first-run experience. The optimal strategy is **"Pre-fill Everything + Progressive Enforcement"**:

1. **Pre-fill** all derivable fields from the tenant profile.
2. **Show a profile completeness indicator** inside the wizard.
3. **Do NOT block batch creation** — let users draft and explore.
4. **Block batch ACTIVATION** if tenant-level compliance documents/numbers are missing (this already happens in the backend).
5. **Nudge users** to complete their profile via a persistent banner in the dashboard.

A **critical bug was also found and fixed**: uploaded document URLs (`Declaration of Conformity`, `CA Certificate`) were collected in the wizard but **never sent to the backend**, meaning batches were created without their compliance attachments.

---

## 2. Field Mapping: Profile → Batch Form

### 2.1 Fields That Can Be Fully Pre-filled (Static)

| Batch Form Field | Profile Source | Condition |
|---|---|---|
| `manufacturer` | `user.company_name` | Always |
| `manufacturerAddress` | `user.address` | Always |
| `manufacturerEmail` | `user.support_email` | Always |
| `euRepresentative` | `user.eu_authorized_representative_name` | Only if EU/Global market selected |
| `euRepresentativeEmail` | `user.eu_contact_email` | Only if EU/Global market selected |
| `euRepresentativeAddress` | `user.eu_authorized_representative_address` | Only if EU/Global market selected |
| `epr_number` | `user.epr_registration_number` | India market |
| `bis_number` | `user.bis_r_number` | India market |
| `countryOfOrigin` | Defaults to `"IN"` | If tenant has India signals (EPR/BIS/IEC) |

**Status:** ✅ *Implemented in `create-batch-wizard.tsx`. Pre-fill only fires when the target field is empty, so user overrides are never clobbered.*

### 2.2 Fields That Should Default Based on Profile

| Batch Form Field | Suggested Default | Rationale |
|---|---|---|
| `marketRegion` | From onboarding `primary_market` | ✅ Now defaults from `user.data_visibility.primary_market` — `india`→`INDIA`, `eu`→`EU`, `both`→`INDIA` |
| `certifications` | `["AIS-156", "AIS-038"]` for India; `["CE"]` for EU | ✅ Auto-set via `useEffect` when `marketRegion` changes |
| `chemistry` | `"LFP"` | Already the hardcoded default; fine to keep |
| `cellSource` | `"DOMESTIC"` | ✅ Changed from `""` to `"DOMESTIC"` in `defaultBatchFormValues` |
| `dvaSource` | `"ESTIMATED"` | Already the hardcoded default |

### 2.3 Fields That Must Always Be Entered Per-Batch

These are inherently batch-specific and should **never** be pre-filled:

- `batchName`, `modelName`
- `manufacturingStartDate`, `manufacturingEndDate`
- `capacity`, `voltage`, `weight`
- `materialComposition` (chemistry mix varies per batch)
- `carbonFootprint` (varies per batch)
- `recycledContent`
- `expectedLifetime`, `warrantyMonths`
- `hsnCode` (could default to `"850760"` but user should confirm)
- `salePrice`, `importCost` (batch-specific economics)
- `billOfEntryNo`, `cellCountryOfOrigin`, `customsDate` (import-specific)

---

## 3. Document & Certificate Requirements

### 3.1 Tenant-Level Documents (Upload Once in Settings)

Stored in `battery_tenant_profiles`, uploaded via `POST /settings/upload-document`:

| Document | Field | Required For | Validation Status |
|---|---|---|---|
| **EPR Certificate** | `epr_certificate_path` | India activation | ✅ Both number + PDF path/status checked at activation |
| **BIS Certificate** | `bis_certificate_path` | India activation | ✅ Both number + PDF path/status checked at activation |
| **PLI Certificate** | `pli_certificate_path` | India activation (if PLI=true) | ✅ PDF path/status checked when `PLICompliant=true` |

> **Fixed:** The activation gate now checks both the registration number AND the certificate PDF path/status. If a number is provided, the certificate must be uploaded and not rejected. |

### 3.2 Batch-Level Documents (Upload Per Batch in Wizard)

| Document | Form Field | Backend Field | Sent to Backend? |
|---|---|---|---|
| **Declaration of Conformity (DoC)** | `docUploadUrl` | `declaration_of_conformity_path` | **❌ BUG — was missing. Fixed.** |
| **CA Certificate (Audited DVA)** | `uploadedFileUrl` | `pli_certificate_url` | **❌ BUG — was missing. Fixed.** |

**What was broken:** The upload handlers (`handleDocUpload`, `handleCertificateUpload`) correctly saved the public URL to the form state, but `onSubmit` never included these fields in the `POST /batches` payload. The backend `CreateBatchRequest` struct supports both fields, and the repository saves them — the frontend simply omitted them.

**Fix applied:** Added both fields to the payload in `create-batch-wizard.tsx`:
```ts
// India: CA Certificate for audited DVA
if (data.marketRegion === "INDIA" && data.uploadedFileUrl) {
  payload.pli_certificate_url = data.uploadedFileUrl;
}
// EU/Global: Declaration of Conformity
if ((data.marketRegion === "EU" || data.marketRegion === "GLOBAL") && data.docUploadUrl) {
  payload.declaration_of_conformity_path = data.docUploadUrl;
}
```

### 3.3 Test Date Fields (Collected in Wizard, Stored in BatchSpec)

| Field | Validated at Creation? | Validated at Activation? | Gap |
|---|---|---|---|
| `bis_certificate_issue_date` | ❌ | ✅ | Required for India activation; must be valid YYYY-MM-DD; not in future |
| `un38_3_test_date` | ❌ | ✅ | Required for India activation; must be valid YYYY-MM-DD; not in future |
| `iec_62133_test_date` | ❌ | ✅ | Required for India activation; must be valid YYYY-MM-DD; not in future |
| `msds_issue_date` | ❌ | ✅ | Required for India activation; must be valid YYYY-MM-DD; not in future |

These are collected in the wizard but never validated. They should be **required for activation** (or at least warned) since they are legal declarations.

---

## 4. Onboarding Flow Analysis

### 4.1 Current Flow (Battery)

```
Step 1: Company Profile    → company_name, address, support_email, website
Step 2: Target Markets     → primary_market (india/eu/both)
Step 3: Compliance Setup   → EPR #, BIS-R #, IEC, EU rep info
Step 4: Review & Launch    → PUT /auth/profile (flips onboarding_completed = true)
```

**Strengths:** Simple, 4 steps, clear progression.

**Weaknesses:**
- Step 3 compliance fields are **recommended but skippable** — amber nudges warn users that activation will be blocked without them.
- `onboarding_completed` is still a weak latch (only requires company name, address, email) — but the dashboard banner and activation gate enforce compliance post-onboarding.
- ✅ Step persistence: `?step=3` is now synced to the URL — refreshing preserves position.
- No document upload during onboarding (certificates are uploaded later in Settings). |

### 4.2 What Should Be Collected During Onboarding vs Settings

| Data | During Onboarding? | In Settings Later? | Rationale |
|---|---|---|---|
| Company name, address, email | ✅ **Required** | ✅ Editable | Core identity |
| Target market | ✅ **Required** | ✅ Editable | Drives form defaults |
| EPR / BIS / IEC numbers | ⚠️ **Recommended** | ✅ Editable | Needed for India activation |
| EU rep name/address/email | ⚠️ **Recommended** | ✅ Editable | Needed for EU activation |
| EPR / BIS / PLI **certificates** (PDF) | ❌ Optional | ✅ Upload in Settings | Too heavy for onboarding; can be added later |
| Logo | ❌ Optional | ✅ Upload in Settings | Cosmetic |

**Recommendation:** Make compliance numbers **recommended but not blocking** during onboarding. After onboarding, show a persistent "Complete your compliance profile" banner in the dashboard until all required numbers/documents are filled for the user's target market(s).

---

## 5. Profile Completeness & Gating Strategy

### 5.1 Option Comparison

| Approach | UX | Engineering | Recommendation |
|---|---|---|---|
| **A. Hard gate** — block creation until profile is 100% | 🔴 Frustrating — users can't explore | Simple | ❌ Not recommended |
| **B. Soft gate** — allow creation, warn heavily | 🟡 Okay but noisy | Medium | ⚠️ Acceptable |
| **C. Pre-fill + activate gate** (current backend behavior) | 🟢 Best — draft freely, activate when ready | Medium | ✅ **Recommended** |
| **D. Tiered gate** — block creation for missing tenant docs, allow everything else | 🟡 Confusing | Complex | ⚠️ Over-engineered |

### 5.2 Recommended Hybrid Approach (Option C + Enhancements)

```
┌─────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔔 Profile 72% complete — Add BIS certificate          │   │
│  │     to activate batches for India market.               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Create Batch]  ← Always available                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  BATCH WIZARD (Step 1)                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Manufacturer: Acme Batteries  ✏️ (from profile)        │   │
│  │  Address: 123 Factory Rd      ✏️ (from profile)         │   │
│  │  ...                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Next] → Step 2 → Step 3 → [Create Draft]                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  BATCH LIST                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Batch #47 — DRAFT                                       │   │
│  │  [Activate] ← Disabled with tooltip:                    │   │
│  │  "Upload BIS certificate in Settings to activate"       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Rules:**
1. **Creation is always allowed.** Pre-fill everything possible from profile.
2. **Activation is gated** on tenant-level compliance for the batch's market.
3. **Dashboard shows a profile completeness score** (0–100%) based on the user's selected target market(s).
4. **Wizard shows a mini-completeness indicator** in the review step: "3 of 5 compliance items ready. You can save this draft, but activation requires the remaining items."

### 5.3 Profile Completeness Score Algorithm

```
Base items (always required): company_name, address, support_email = 30%

India market selected:
  + EPR registration number = 15%
  + BIS R-number = 15%
  + IEC code = 10%
  + EPR certificate uploaded = 10%
  + BIS certificate uploaded = 10%
  + PLI certificate uploaded (optional) = 5% bonus
  + MoRTH code = 5%

EU market selected:
  + EU authorized rep name = 15%
  + EU authorized rep address = 15%
  + EU contact email = 10%
  + CE marking understanding (acknowledged) = 10%

Total = 100% (or 105% with PLI bonus, capped at 100%)
```

---

## 6. Critical Gaps to Address

### 6.1 🔴 Fixed: Document URLs Not Sent to Backend
- **File:** `apps/battery-web/components/batches/create-batch-wizard.tsx`
- **Fix:** Added `pli_certificate_url` and `declaration_of_conformity_path` to the API payload.
- **Verify:** Upload a DoC or CA cert in the wizard, create a batch, and confirm the URLs are persisted in the database.

### 6.2 ✅ Tenant Certificate PDFs Verified at Activation
- **File:** `services/battery-api/internal/compliance/battery/india.go`
- **Status:** FIXED. `ValidateActivation` now checks both the registration number AND the certificate PDF path/status.
- **Rules:** `EPRCertificatePath` must be non-empty; `EPRStatus` must be `PENDING` or `VERIFIED`. Same for BIS and PLI.

### 6.3 ✅ Test Date Fields Validated at Activation
- **File:** `services/battery-api/internal/compliance/battery/india.go`
- **Status:** FIXED. All 4 test dates are now required for India activation.
- **Rules:** Date must be present; must be valid `YYYY-MM-DD`; must not be in the future.
- **Tests:** 3 new tests cover missing dates, future dates, and invalid format.

### 6.4 ✅ `primary_market` Editable in Settings
- **File:** `apps/battery-web/components/settings/battery-settings-page.tsx`
- **Status:** FIXED. A "Target Markets" dropdown is now in Settings → Profile with options: India Only, EU Only, India & EU.
- **Effect:** Changing this updates `data_visibility.primary_market`, which drives the default `marketRegion` in the batch wizard.

### 6.5 ✅ Profile Completeness Banner on Dashboard
- **File:** `apps/battery-web/components/dashboard/profile-completeness-banner.tsx`
- **Status:** FIXED. A dismissible banner appears below the top bar on every dashboard page.
- **Features:** 0–100% score, progress bar, color-coded (red for blockers, amber for incomplete), 24-hour dismiss cooldown, direct link to Settings.

---

## 7. Implementation Priority

| Priority | Task | Effort | Impact |
|---|---|---|---|
| **P0** | ✅ Fix `docUploadUrl` / `uploadedFileUrl` payload bug | 5 min | **Critical** — data loss |
| **P0** | ✅ Pre-fill batch form from profile | 15 min | High — reduces friction |
| **P1** | ✅ Add profile completeness banner to dashboard | Done | High — drives completion |
| **P1** | ✅ Make compliance numbers **recommended** in onboarding Step 3 | Done | Medium — catches users early |
| **P2** | ✅ Verify tenant certificate PDFs at activation | Done | Medium — closes compliance gap |
| **P2** | ✅ Add `primary_market` editor to Settings | Done | Low — nice to have |
| **P3** | ✅ Persist onboarding step to URL (`?step=3`) | Done | Low — UX polish |
| **P3** | ✅ Add test date validation to activation gate | Done | Low — legal safety |

---

## 8. Files Modified in This Analysis

| File | Change |
|---|---|
| `apps/battery-web/components/batches/create-batch-wizard.tsx` | Added profile pre-fill for 10 fields; fixed document URL payload bug; added debounced real-time validation; added backend error → form field mapping with auto-navigation |
| `apps/battery-web/components/batches/batch-form-schema.ts` | Enhanced with numeric regex, cross-field conditionals, market-aware rules (already complete) |
| `services/battery-api/internal/services/batch_creation_validator.go` | Extracted 23 checks into standalone validator with market gating (already complete) |
| `services/battery-api/internal/handlers/batch_handlers.go` | Added `ValidateBatchCreation` endpoint, refactored `CreateBatch` to reuse validator (already complete) |

---

## 9. Next Steps

1. **Review this document** and confirm the strategy.
2. **Decide on P1 items** — should we build the profile completeness banner now or defer?
3. **Test the document upload fix** — create a batch with a DoC and CA cert, then verify in the DB.
4. **Consider adding** `primary_market` to the Settings page so users can change their default market after onboarding.
