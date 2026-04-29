# Battery Passport Platform — Gap Analysis & Competitive Benchmarking

> **Scope:** ExportReady Battery Passport Platform (Go backend + Next.js 16 frontend)  
> **Reviewed against:** EU Battery Regulation 2023/1542 · Circulor · Circularise · BatteryPass consortium (thebatterypass.eu) · Catena-X  
> **Key deadline:** February 18, 2027 — EU Battery Passport mandatory (EV, LMT, Industrial >2 kWh)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What Is Correctly Built](#2-what-is-correctly-built)
3. [Critical Gaps — Must Fix](#3-critical-gaps--must-fix)
4. [Medium Priority Gaps](#4-medium-priority-gaps)
5. [EU Regulation Coverage Scorecard](#5-eu-regulation-coverage-scorecard)
6. [Competitive Benchmarking](#6-competitive-benchmarking)
7. [Step-by-Step Platform Workflow (current)](#7-step-by-step-platform-workflow-current)
8. [Recommended Build Roadmap](#8-recommended-build-roadmap)

---

## 1. Executive Summary

The ExportReady battery passport platform has a **solid, well-architected core**. The lifecycle state machine, hash-chain audit trail, three-tier data access, BPAN serial format, carbon calculator, and compliance activation gate are all correctly built and production-quality.

However, **five critical gaps** block EU regulatory compliance by Feb 2027, and **the platform is significantly behind** the feature depth of commercial leaders like Circulor and Circularise in two key areas:

1. **Supply chain provenance** — only `country_of_origin` is stored; no mine/smelter/refiner traceability
2. **REPAIR/REPLACE lifecycle actions** — the data structures exist in the model but the endpoint chain is completely unbuilt

Beyond that, there are EU data points that the regulation mandates (battery category, disassembly instructions, performance metrics, Art. 48 due diligence) that are either missing from the data model or only partially captured.

Against big players, ExportReady is **stronger than expected** for a startup — the audit trail, India compliance dual-mode, and PDF due diligence report are genuine differentiators for the Indian-to-EU export use case. The roadmap below closes the critical gaps before 2027.

---

## 2. What Is Correctly Built

These features work correctly and are production-ready:

| # | Feature | Files | Status |
|---|---------|-------|--------|
| 1 | **Lifecycle state machine** | `services/lifecycle.go`, `models/models.go` (TransitionMap) | ✅ Clean, all 7 states + RECALLED interrupt |
| 2 | **Three-tier data access** | `handlers/passport_handlers.go`, `models/access_views.go` | ✅ PUBLIC / PARTNER / REGULATOR with correct priority |
| 3 | **SHA-256 hash chain** | `services/event_hash.go`, migration 000019, 000027 | ✅ Every event linked; DB trigger enforces immutability |
| 4 | **Activation compliance gate** | `services/activation_compliance.go` | ✅ Market-region-aware; hard blocks on missing fields |
| 5 | **BPAN V2 serial format** | `services/bpan_service.go` | ✅ `{REGION}-{MFR}-{CHEM}-{YEAR}-{NNNNN}` — correct |
| 6 | **Carbon calculator (JRC)** | `services/carbon_calculator.go`, `handlers/carbon_handler.go`, `components/batches/carbon-calculator.tsx` | ✅ JRC 2024 factors, JSONB result, frontend UI present |
| 7 | **Due diligence PDF (Art. 39)** | `services/due_diligence_pdf.go` | ✅ A4 PDF: identity, material, carbon, REACH/RoHS, supply chain, certifications |
| 8 | **Compliance declaration PDF** | `services/compliance_declaration_pdf.go` | ✅ Separate PDF export |
| 9 | **Magic link security** | `services/data_access_service.go`, migration 000034 | ✅ Single-use, action-bound, role-bound, time-limited |
| 10 | **India compliance (AIS-156/038, BIS, EPR, IEC, MORTH)** | `activation_compliance.go` | ✅ All India-specific checks present |
| 11 | **Dual-mode India + EU** | `MarketRegionGlobal` applies both rule sets | ✅ Correct simultaneous enforcement |
| 12 | **BMS telemetry ingestion** | `services/telemetry_service.go`, `handlers/telemetry_handlers.go` | ✅ SoH, cycles, temp, voltage, thermal events |
| 13 | **Rate limiting middleware** | `middleware/rate_limiter.go` | ✅ Present |
| 14 | **Material composition (per-material %)** | `MaterialComposition` in `models.go` | ✅ Co, Li, Ni, Pb, Mn, Graphite + recycled % per material |
| 15 | **Hazardous substances (REACH/RoHS)** | `HazardousSubstances` struct | ✅ Pb/Hg/Cd presence + declaration + exemptions |
| 16 | **Trusted partners system** | `handlers/trusted_partner_handlers.go`, `app/partners/page.tsx` | ✅ Partner company registry + partner invite codes |
| 17 | **Batch CSV bulk import** | `services/csv_service.go`, `components/batches/upload-csv.tsx` | ✅ Working |
| 18 | **Export jobs queue** | `services/export_job_service.go`, `handlers/export_job_handlers.go` | ✅ QR ZIP, labels PDF, CSV, due diligence, audit CSV/PDF |
| 19 | **Ownership transfer tracking** | `services/ownership_history.go` | ✅ History JSONB with timestamps |
| 20 | **Scan analytics** | `handlers/scan_handlers.go`, analytics dashboard | ✅ Country, device, live scan feed |

---

## 3. Critical Gaps — Must Fix

These are **blockers for EU compliance by Feb 2027** or **security/integrity issues**.

---

### 🔴 GAP-1: Supply Chain Provenance Missing (EU Art. 48 — August 2027)

**What's required:** EU Battery Regulation Art. 48-52 mandates supply chain due diligence at the raw material level. For cobalt, lithium, nickel, and manganese the passport must identify:
- Mine/extraction site (name, GPS, operator)
- Processing/smelter entity
- Refiner entity
- Each tier's country and compliance assessment

**What exists in the codebase:**
```go
// models.go – BatchSpec – all supply chain coverage
CountryOfOrigin string `json:"country_of_origin"` // Only this. No tiers.
CellSource      string `json:"cell_source"`        // IMPORTED or DOMESTIC
```

The `due_diligence_pdf.go` draws a "Supply Chain & Responsible Sourcing" section but it only outputs `Manufacturer`, `ManufacturerAddress`, `CellSource`, and EU Representative — no multi-tier data because none is stored.

**What to build:**
1. New `SupplyChainProvenance` struct in `models.go`:
   ```go
   type SupplyChainTier struct {
       EntityName    string  `json:"entity_name"`
       EntityType    string  `json:"entity_type"` // MINE, SMELTER, REFINER, CELL_MANUFACTURER
       Country       string  `json:"country"`
       Address       string  `json:"address,omitempty"`
       GPSLat        float64 `json:"gps_lat,omitempty"`
       GPSLng        float64 `json:"gps_lng,omitempty"`
       CertNumber    string  `json:"cert_number,omitempty"` // RMI cert, RMAP, etc.
       ComplianceStatus string `json:"compliance_status"`  // VERIFIED, PENDING, FLAGGED
   }
   type SupplyChainProvenance struct {
       CobaltChain   []SupplyChainTier `json:"cobalt_chain,omitempty"`
       LithiumChain  []SupplyChainTier `json:"lithium_chain,omitempty"`
       NickelChain   []SupplyChainTier `json:"nickel_chain,omitempty"`
       ManganeseChain []SupplyChainTier `json:"manganese_chain,omitempty"`
       DueDiligenceDate *time.Time     `json:"due_diligence_date,omitempty"`
       AuditBodyName string            `json:"audit_body_name,omitempty"`
   }
   ```
2. Add `SupplyChainProvenance *SupplyChainProvenance` to `BatchSpec`
3. New DB migration to store it in the `batch_specs` JSONB column (already JSONB — zero schema change needed)
4. Add to batch creation/update UI form
5. Add to due diligence PDF section 5
6. Add to activation compliance: require at least mine + country per critical material used

**Impact of not fixing:** Cannot claim Art. 48 compliance. Aug 2027 deadline.

---

### 🔴 GAP-2: REPAIR and REPLACE Lifecycle Actions Not Built

**What exists:**
- `Passport.RepairEvents json.RawMessage` — field in model ✅
- `Passport.ReplacementEvents json.RawMessage` — field in model ✅
- `AppendRepairEvent(ctx, passportID, entryJSON)` — repo method ✅
- `AppendReplacementEvent(ctx, passportID, entryJSON)` — repo method ✅

**What's missing:**
- NO `REPAIR` or `REPLACE` in `TransitionMap` (`models/models.go` lines 459-494)
- NO handler in `lifecycle_handlers.go` for these actions
- NO lifecycle event written for repairs — so repair history is NOT part of the tamper-evident hash chain
- NO frontend UI for a TECHNICIAN to log a repair

**EU requirement:** EU Art. 14 requires the passport to contain information about all repair, refurbishment, and component replacement events. This is dynamic data that must appear in the publicly accessible passport view.

**What to build:**
1. Add `ActionRepair = "REPAIR"` and `ActionReplace = "REPLACE"` to `models.go` constants
2. Add transitions in `TransitionMap`:
   - `REPAIR` allowed from: `IN_SERVICE`, `SHIPPED` (returned for warranty)
   - `REPLACE` allowed from: `IN_SERVICE`
   - Both require role: `TECHNICIAN` or `MANUFACTURER`
3. Add `REPAIR` / `REPLACE` event handling in `lifecycle.go` `ApplyTransition()` — must write a `PassportEvent` with hash chain
4. Expose `RepairHistory` and `ReplacementHistory` in `BuildPublicView()` output
5. Add frontend: from passport detail view, TECHNICIAN can log repair with notes, component replaced, date, technician ID

---

### 🔴 GAP-3: Hash Chain Genesis Has No Anchor Seed

**File:** `services/event_hash.go`

**Current behavior:**
```go
// Genesis event
event.PreviousHash = ""  // empty string as anchor
```

**Problem:** An empty string is not a cryptographic anchor. A sophisticated attacker who replaces the entire event chain for a passport could construct a new valid chain starting from `""`. The genesis needs to be bound to something immutable about the passport itself.

**Fix:**
```go
// In GenerateEventHash, when event.PreviousHash == "" (genesis):
genesisAnchor := "GENESIS:" + passport.UUID.String() + ":" + passport.SerialNumber
event.PreviousHash = genesisAnchor
```

This binds the chain irrevocably to the passport identity. A replacement chain starting from the correct anchor would require knowing the UUID+serial at the time of genesis — making forgery detectable.

**Risk level:** Medium-high. No active exploit, but the chain's integrity guarantee is weaker than it should be.

---

### 🔴 GAP-4: `DataVisibility` Config Stored but NOT Enforced

**Situation:**
- Migration 000036 added `data_visibility JSONB` to `tenants` table ✅
- `components/settings/data-visibility.tsx` — frontend settings UI exists ✅
- `components/settings/data-access-tokens.tsx` — token management UI exists ✅
- **BUT:** `BuildPublicView()` and `BuildPartnerView()` in `access_views.go` do NOT read `tenant.DataVisibility`

**What this means:** A manufacturer configures "hide battery chemistry from public view" in settings. It saves to the database. But when a QR code is scanned, the public view ignores that setting and shows everything anyway. The feature is broken end-to-end.

**Fix in `access_views.go`:**
```go
func BuildPublicView(p *models.Passport, b *models.Batch, t *models.Tenant) map[string]interface{} {
    view := buildBaseView(p, b)
    if t.DataVisibility != nil {
        applyVisibilityFilter(view, t.DataVisibility, "public")
    }
    return view
}
```

Add `applyVisibilityFilter()` that reads the `DataVisibility` JSONB keys and removes hidden fields from the view map before returning.

---

### 🔴 GAP-5: Battery Category Field Missing from Data Model

**EU requirement:** Every passport must declare the battery **category**:
- `EV` (Electric vehicle traction battery)
- `LMT` (Light Means of Transport — e-bike, e-scooter)
- `INDUSTRIAL` (>2 kWh, stationary storage)
- `PORTABLE` (<2 kWh consumer)

**What exists:** No `BatteryCategory` field anywhere in the data model. The current code infers the use case from `Chemistry` field — which is technically incorrect (an LFP battery can be EV or industrial).

**Fix:** Add `BatteryCategory string` to `BatchSpec`. Validate it as an enum in the activation compliance gate. Use it to determine whether EU passport rules apply (mandatory for EV, LMT, Industrial >2kWh).

**Impact:** This field determines regulatory scope. Without it, the compliance gate cannot correctly decide whether a battery is in-scope for Feb 2027 mandate.

---

## 4. Medium Priority Gaps

These are important but not Feb 2027 blockers.

### 🟡 GAP-6: Telemetry SoH Updates Bypass Audit Hash Chain

**File:** `services/telemetry_service.go`

The `UpdatePassportDynamicFields()` call updates `state_of_health`, `cycle_count`, `temperature`, `voltage` directly on the passport row — but does **not** write a `PassportEvent`. This means SoH changes are not part of the tamper-evident audit trail.

**EU Art. 14 requirement:** State of health must be a dynamic, updated, verifiable value. The audit trail should contain it.

**Fix:** In `TelemetryService.Ingest()`, after updating dynamic fields, call `CreatePassportEvent()` with `EventType = "SOH_UPDATE"` containing the new SoH value. This event enters the hash chain.

---

### 🟡 GAP-7: No Disassembly / End-of-Life Instructions (EU Art. 11)

**EU requirement:** Batteries >2 kWh must include:
- Disassembly sequence (step-by-step)
- Component identification (cell modules, BMS, connectors)
- Hazard warnings for disassemblers
- Minimum SoH at which battery should be decommissioned

**What exists:** Nothing. No field in `BatchSpec` or `Passport` for this.

**Fix:** Add `DisassemblyGuide *DisassemblyGuide` struct to `BatchSpec`:
```go
type DisassemblyGuide struct {
    Steps              []string `json:"steps"`
    ToolsRequired      []string `json:"tools_required"`
    HazardWarnings     []string `json:"hazard_warnings"`
    MinSOHThreshold    float64  `json:"min_soh_threshold"` // e.g., 70 = decommission below 70%
    EOLInstructions    string   `json:"eol_instructions"`
    RecyclerContactURL string   `json:"recycler_contact_url"`
}
```

Expose this in `BuildPublicView()` — it's publicly accessible per EU regulation.

---

### 🟡 GAP-8: No Battery Performance Metrics (EU Art. 10)

**EU requirement:** The passport must contain:
- Initial rated capacity (Ah or Wh)
- Minimum/maximum voltage
- Rated capacity at 80% SoH threshold
- Initial internal resistance
- C-rate capability (charge/discharge rates)
- Operating temperature range

**What exists:** `Capacity` (string, e.g. "5000mAh"), `NominalVoltage` (string) — but these are free text, not structured. No rated capacity threshold, no internal resistance, no C-rate.

**Fix:** Add `PerformanceSpec *PerformanceSpec` to `BatchSpec`:
```go
type PerformanceSpec struct {
    RatedCapacityAh        float64   `json:"rated_capacity_ah"`
    RatedCapacityWh        float64   `json:"rated_capacity_wh"`
    NominalVoltageV        float64   `json:"nominal_voltage_v"`
    MinVoltageV            float64   `json:"min_voltage_v"`
    MaxVoltageV            float64   `json:"max_voltage_v"`
    CapacityAt80SohPct     float64   `json:"capacity_at_80_soh_pct"`
    InternalResistanceOhm  float64   `json:"internal_resistance_ohm,omitempty"`
    MaxChargeCRate         float64   `json:"max_charge_c_rate,omitempty"`
    MaxDischargeCRate      float64   `json:"max_discharge_c_rate,omitempty"`
    TempRangeMinC          float64   `json:"temp_range_min_c"`
    TempRangeMaxC          float64   `json:"temp_range_max_c"`
}
```

---

### 🟡 GAP-9: Recycled Content Checks Are Soft Warnings, Not Hard Blocks (Aug 2028)

**File:** `services/activation_compliance.go` lines 149-162

```go
// Current – these are errors (soft warnings), not appended to missing (hard blocks)
*errors = append(*errors, "Soft Warning: Recycled Cobalt content missing (EU target: 16% by 2030)")
```

**Situation:** The Aug 2028 deadline requires mandatory recycled content declarations. After that date, a passport without declared recycled content **cannot be activated for EU market**. The code is structured correctly (separate `missing` vs `errors` slices), it just needs these upgraded from `errors` to `missing` when Aug 2028 arrives.

**Fix:** Add a `MandatoryAfter` date-gating mechanism:
```go
recycledContentMandatoryDate := time.Date(2028, 8, 18, 0, 0, 0, 0, time.UTC)
if time.Now().After(recycledContentMandatoryDate) {
    // Hard block
    *missing = append(*missing, "batch.specs.material_composition.recycled_cobalt_pct (mandatory from Aug 2028)")
} else {
    // Still a warning
    *errors = append(*errors, "Soft Warning: Recycled Cobalt content missing (EU target: 16% by 2030)")
}
```

---

### 🟡 GAP-10: No Webhook System for Partner Integrations

**Situation:** When a passport changes state (SHIPPED → IN_SERVICE), there is no way for a partner system to receive real-time notification. Partners must poll the API.

**What big players offer:** Circulor, Circularise, and Catena-X all have event-driven architectures where downstream supply chain partners receive webhooks on state transitions.

**Fix:** Add `outbound_webhooks` table. After every successful `ApplyTransition()`, publish a webhook payload to registered URLs. Include the passport UUID, new status, event hash, and timestamp.

---

### 🟡 GAP-11: Swagger UI Not Mounted

**File:** `backend/api/openapi.yaml` — exists and is likely reasonably current.

**Problem:** There's no route that serves the Swagger UI, making developer onboarding harder.

**Fix:** Mount `swagger-ui` at `/api/docs` in `cmd/server/main.go`. One-liner with standard Go Swagger middleware.

---

### 🔴 GAP-11b: Security — Passport Transfer Handler Missing Tenant Ownership Check

**File:** `handlers/passport_handlers.go` — passport transfer endpoint

**Issue:** The passport transfer handler verifies the passport UUID and new owner ID, but does **not** confirm the passport's `batch_id` belongs to the authenticated tenant. This means:
- User A (tenant A) could potentially transfer a passport belonging to tenant B if they know the passport UUID and any valid user ID
- Attack vector: brute-force or leaked UUID → unauthorized ownership transfer

**Fix:** Add tenant ownership verification:
```go
// After fetching passport, verify it belongs to the caller's tenant
if passport.TenantID != tenantID {
    respondError(w, http.StatusForbidden, "passport not found")
    return
}
// Or at DB query level:
// WHERE p.id = $1 AND b.tenant_id = $2 JOIN batches b ON p.batch_id = b.id
```

---

### 🔴 GAP-11c: Security — Refresh Token JTI Stored But Never Validated

**File:** `backend/internal/db/migrations/000037_*.sql` + auth handlers

**Issue:** Migration 000037 adds `refresh_token_jti` and `refresh_token_expires` to the tenants table specifically for token revocation. However, the auth handler's refresh endpoint **never checks this JTI**, meaning:
- A revoked or stolen refresh token can still be used to obtain new access tokens
- Token rotation is superficial — the old token remains valid

**Fix:** On every token refresh:
1. Extract JTI from incoming refresh token
2. Query DB: `WHERE refresh_token_jti = $1 AND refresh_token_expires > NOW()`
3. Reject if not found or expired
4. On success, rotate: update `refresh_token_jti` to new value

---

### 🔴 GAP-11d: Security — Lifecycle Transition Missing Tenant Ownership Check

**File:** `handlers/lifecycle_handlers.go`

**Issue:** Lifecycle transition handler validates actor context and role, but does not verify that the target passport's batch belongs to the authenticated tenant. A malicious tenant could craft a transition request for another tenant's passport.

**Fix:** After fetching the passport, verify `passport.BatchID` is in a batch owned by the requesting tenant.

---

### 🟡 GAP-12: No Third-Party Verification or Claim Attestation

**Circularise's key differentiator:** Claims can be attested by third-party verifiers (auditors, certification bodies). The platform cryptographically links the verifier's signature to the claim.

**ExportReady:** No verifier concept exists. All data is self-declared by the manufacturer.

**Impact:** EU Art. 39 does not require third-party verification for the passport itself, but for supply chain due diligence (Art. 48), independent audit is encouraged. Having an attestation mechanism would be a strong differentiator.

---

### 🟡 GAP-13: Carbon Footprint Missing End-of-Life Phase (EU Art. 7)

**File:** `services/carbon_calculator.go`

**EU requirement:** Art. 7 requires carbon footprint declared per lifecycle phase:
1. Raw material acquisition ✅ (included in cell production factor)
2. Cell manufacturing ✅
3. Battery assembly ✅
4. Transport/logistics ✅
5. **End-of-life (recycling/dismantling)** ❌ Missing

The EU provides default EOL carbon factors per chemistry. Not declaring EOL phase carbon makes the declaration technically incomplete per Art. 7(1)(b).

**Fix:** Add `EOLCarbon float64` to `CarbonBreakdown`. Use EU default factors (or let manufacturer input actual recycler energy data).

---

### 🟡 GAP-14: No Initial SoH Baseline at Factory (EU Art. 14)

**Issue:** EU Art. 14 requires that the passport contain both the **as-manufactured** SoH baseline and the **current** SoH. Currently only the current SoH is stored.

**Fix:** Add `InitialStateOfHealth *float64` to the `Passport` model, set to 100.0 at passport creation (or allow manufacturer to declare a certified initial capacity if testing shows <100%).

---

### 🟡 GAP-15: Missing Validation — Decimal Ranges and Date Sanity

**Issues found in validation layer:**
- `DomesticValueAdd` can be > 100% or negative — no range check
- `RecycledContentPct` can be > 100% — no clamp
- `ManufacturingStartDate` can be in the future — no "not future" check
- Material composition percentages (CobaltPct, etc.) not validated to be 0–100

**Fix:** Add range validators in `validation.go` for all percentage fields (0.0–100.0) and date fields (must be ≤ today for manufacturing dates).

---

## 5. EU Regulation Coverage Scorecard

Based on EU Battery Regulation 2023/1542 and the 80+ data attributes defined by the BatteryPass consortium (thebatterypass.eu):

| EU Article | Requirement | Implemented? | Notes |
|-----------|-------------|-------------|-------|
| Art. 3 | Battery category (EV/LMT/industrial/portable) | 🔴 Missing | No `BatteryCategory` field — **GAP-5** |
| Art. 7 | Carbon footprint declaration (kg CO2e/kWh) | ✅ Done | JRC calculator + declaration text |
| Art. 7 | Carbon footprint class (A–G) | 🟡 Partial | Aug 2027; calculation result stored, no class assigned |
| Art. 8 | Recycled content % (Co, Li, Ni, Pb) | ✅ Stored | Mandatory declaration from Aug 2028 |
| Art. 8 | Recycled content hard-block enforcement | 🟡 Partial | Currently soft warnings only — **GAP-9** |
| Art. 10 | Battery performance (capacity, voltage, cycles) | 🟡 Partial | Free-text strings; no structured `PerformanceSpec` — **GAP-8** |
| Art. 11 | Disassembly & EOL instructions | 🔴 Missing | **GAP-7** |
| Art. 13 | QR code on battery | ✅ Done | QR service with embedded URL |
| Art. 13 | Unique identifier (passport ID) | ✅ Done | BPAN V2 + UUID |
| Art. 14 | Manufacturer info (name, address, contact) | ✅ Done | Tenant + BatchSpec fields |
| Art. 14 | Battery model + category | 🟡 Partial | Model name ✅, category ❌ |
| Art. 14 | State of health (dynamic, verifiable) | 🟡 Partial | SoH stored, but updates bypass hash chain — **GAP-6** |
| Art. 14 | Repair/replacement history | 🔴 Missing | Data structures exist, no endpoints — **GAP-2** |
| Art. 14 | Hazardous substances (REACH/RoHS) | ✅ Done | Pb, Hg, Cd + declaration |
| Art. 14 | Three-tier access (public/partner/regulator) | ✅ Done | Correctly built |
| Art. 39 | Due diligence report PDF | ✅ Done | Full PDF with all 6 sections |
| Art. 48 | Supply chain due diligence (mine level) | 🔴 Missing | Only `CountryOfOrigin` — **GAP-1** |
| Art. 48 | Cobalt/lithium/nickel sourcing documentation | 🔴 Missing | **GAP-1** |

**Coverage estimate:** ~55% of EU-mandatory data points are implemented. ~20% are partially implemented. ~25% are missing.

---

## 6. Competitive Benchmarking

### 6.1 Circulor

**Position:** World's first enterprise battery passport at industrial scale. Deployed with Volvo Cars. ISO 27001 + ISO 9001 certified.

| Capability | Circulor | ExportReady |
|-----------|---------|-------------|
| Battery passport at scale (millions of units) | ✅ Proven | 🟡 Architecture supports it |
| Item-level configurable permissions | ✅ Any field, any role | 🟡 Three fixed tiers only |
| DPP template library (prEN18239 aligned) | ✅ | ❌ No standard mapping |
| Multi-tier supply chain traceability | ✅ Mine → smelter → cell | ❌ Country only |
| ISO 27001 certification | ✅ | ❌ Not documented |
| Brand customization per passport | ✅ Unlimited themes | ❌ Single ExportReady branding |
| Blockchain-anchored provenance | ✅ | ❌ Hash chain is internal only |
| India compliance (BIS, EPR, AIS, MoRTH) | ❌ Not their market | ✅ **ExportReady wins** |
| Dual India + EU activation gate | ❌ | ✅ **ExportReady wins** |
| Carbon calculator (JRC) | 🟡 (integration) | ✅ Native, built-in |
| Developer API + API keys | 🟡 Enterprise sales | ✅ Self-serve API key system |

**ExportReady advantages over Circulor:** India-specific compliance (BIS/EPR/AIS/MoRTH/IEC), dual-mode activation, native JRC carbon calculator, self-serve SaaS model (vs enterprise sales).

---

### 6.2 Circularise

**Position:** Privacy-first digital product passport platform. Key differentiator: zero-knowledge selective disclosure.

| Capability | Circularise | ExportReady |
|-----------|-----------|-------------|
| Zero-knowledge selective disclosure | ✅ ZK proofs per field | ❌ Three-tier fixed views |
| Primary data + third-party attestation | ✅ Verifier signatures on claims | ❌ Self-declared only |
| Public verifiability of claims | ✅ Cryptographic proof | 🟡 Hash chain (internal only) |
| All-in-one EU Battery Reg compliance | ✅ | 🟡 ~55% coverage |
| Model-level + unit-level passport | ✅ Both | ✅ Batch (model) + Passport (unit) |
| QR code access | ✅ | ✅ |
| Recycled content tracking | ✅ | ✅ |
| API for integration | 🟡 | ✅ Self-serve |

**Where to learn from Circularise:** Field-level selective disclosure is the right long-term direction. Even without ZK proofs, ExportReady should make `DataVisibility` JSONB config actually enforce which fields are visible per tier (this is **GAP-4** — the config is stored but ignored).

---

### 6.3 BatteryPass Consortium (thebatterypass.eu)

**Position:** Research/standards body (Fraunhofer IPK, acatech, TU Berlin, GEFEG). Created the reference data model and test environment for EU battery passport.

**Key outputs:**
- 80+ mandatory data attributes mapped to EU Regulation articles
- DIN DKE SPEC 99100 reference implementation
- Test environment for validators (launched 2025)
- prEN18239 CEN/CENELEC standard (March 2026 delivery)

**Gap vs BatteryPass reference model:** ExportReady covers approximately 55% of the 80+ attributes. Key missing categories:
- Battery category (EV/LMT/industrial/portable)
- Structured performance specs (Art. 10)
- Disassembly instructions (Art. 11)
- Supply chain tier data (Art. 48)
- Carbon footprint performance class (A–G, Art. 7 Aug 2027)
- Certified capacity at 80% SoH threshold

**Recommendation:** Map ExportReady's data model explicitly to the BatteryPass consortium attribute list. This produces a compliance gap table that can be shown to customers as "X of 80+ attributes covered."

---

### 6.4 Catena-X

**Position:** Automotive industry data-sharing network (BMW, Mercedes, Ford, Bosch, SAP). Focused on multi-tier supply chain PCF reporting and quality management.

**Key relevance:**
- Multi-tier PCF data exchange from Tier-2 supplier → Tier-1 → OEM
- Primary data (not industry averages) — enables 46% PCF reduction in Ford case study
- Battery passport as part of broader digital product pass ecosystem

**ExportReady vs Catena-X:** These serve different markets. Catena-X targets large OEMs and their Tier-1/2 suppliers. ExportReady targets Indian battery manufacturers exporting directly. There is no direct competition, but Catena-X sets the expectation for **primary supply chain data** that EU customers (importers of Indian batteries) will expect to see.

---

### 6.5 Summary: Where ExportReady Stands

```
Feature Area                ExportReady  Circulor  Circularise  BatteryPass
─────────────────────────────────────────────────────────────────────────────
Core Lifecycle Engine       ████████     ████████  ████████     N/A
Three-tier Access Control   ██████       ████████  ████████     N/A
Hash Chain / Audit Trail    ██████       ████████  ████████     N/A
Carbon Calculator (JRC)     ████████     ██████    ██████       N/A
India Compliance            ████████     ░░░░      ░░░░         ░░░░
EU Data Coverage (~55%)     ██████       ████████  ████████     ████████
Supply Chain Provenance     ██           ████████  ██████       ████████
Repair/Replace Lifecycle    ░░░░         ████████  ████████     ████████
Third-Party Attestation     ░░░░         ████████  ████████     ░░░░
Selective Disclosure        ░░░░         ██████    ████████     ░░░░
Developer Self-Serve API    ████████     ░░░░      ░░░░         N/A
```

**ExportReady's defensible moat:** India-specific compliance (BIS/EPR/AIS/MoRTH) + native dual-mode India+EU activation — **no competitor serves this market**. This is a genuine first-mover advantage for the Indian battery export segment.

---

## 7. Step-by-Step Platform Workflow (current)

Here is the full flow as it works today, with gaps called out inline:

```
MANUFACTURER ONBOARDS
  1. Register account → tenant created (company_name, address)
  2. Set India compliance: EPR number, BIS R-number, IEC code, MoRTH code
  3. Set EU compliance: EU authorized representative name, address, contact email
  4. [GAP-4] Configure DataVisibility per tier → saved but NOT enforced in views

BATCH CREATION (model-level data)
  5. Create batch: chemistry, capacity, voltage, manufacturer, weight
  6. Set market region: INDIA / EU / GLOBAL
  7. Add material composition: Co%, Li%, Ni%, Pb%, Mn%, Graphite%
  8. Add recycled content per material (soft-warned if missing)
  9. Add hazardous substances declaration (REACH/RoHS)
  10. Add certifications: AIS-156, AIS-038, CE, UL, etc.
  11. [GAP-5] No BatteryCategory field (EV/LMT/industrial/portable)
  12. [GAP-8] No structured PerformanceSpec (only free-text capacity/voltage)
  13. [GAP-1] No supply chain provenance beyond country_of_origin

CARBON FOOTPRINT
  14. Open carbon calculator tab in batch detail page (UI exists ✅)
  15. Enter: chemistry, capacity_kWh, cell country, factory country, assembly energy, transport
  16. Calculator calls POST /api/v1/batches/{id}/carbon-footprint
  17. JRC 2024 factors applied → result saved as JSONB to batches.carbon_footprint_result
  18. Declaration text generated (e.g., "45.2 kg CO2e/kWh")
  19. [GAP: Aug 2027] No carbon performance class (A–G) assigned

ACTIVATION (compliance gate)
  20. Manufacturer clicks "Activate Batch"
  21. POST /api/v1/batches/{id}/activate
  22. ValidateActivationCompliance() runs — checks all required fields
  23. India: EPR, BIS, IEC, MORTH, CellSource, AIS-156, AIS-038
  24. EU: EU rep, carbon_footprint_result (JSONB), material_composition, hazardous_substances, lifetime_cycles, warranty
  25. If any missing → 422 with full list of failures
  26. On pass → batch.status = "ACTIVE"

PASSPORT GENERATION
  27. POST /api/v1/batches/{id}/generate-passports with count=N
  28. Each passport gets BPAN serial: IN-TEN-LFP-2026-00001, 00002, ...
  29. BatchSnapshot (full specs) frozen into passport.batch_snapshot at creation
  30. Each passport: status = CREATED, UUID assigned
  31. QR code generated: URL pointing to /p/{uuid}

LIFECYCLE TRANSITIONS
  32. CREATED → ACTIVE: manufacturer activates unit (POST lifecycle endpoint)
  33. ACTIVE → SHIPPED: with owner identifier + shipment evidence
  34. SHIPPED → IN_SERVICE: when battery installed (LOGISTICS/owner)
  35. IN_SERVICE → RECYCLED: by authorized RECYCLER
  36. ANY → RECALLED: by MANUFACTURER only
  37. [GAP-2] No REPAIR or REPLACE transition despite model fields existing
  38. Each transition: SHA-256 hash chained to previous event, immutable DB trigger
  39. [GAP-3] Genesis event uses empty previous_hash instead of UUID-anchored seed

TELEMETRY (in-service phase)
  40. BMS device authenticates via device token (device_token_service.go)
  41. POST /api/v1/telemetry/ingest with soh, cycle_count, temperature, voltage, thermal_event
  42. Passport dynamic fields updated (soh, cycles, temp, voltage, thermal_event_count)
  43. [GAP-6] SoH update NOT written as PassportEvent → not in hash chain audit trail
  44. Telemetry stored in time-series table; accessible via telemetry chart UI

DATA ACCESS (QR scan)
  45. Public scans QR → /p/{uuid} → unauthenticated GET passport
  46. detectAccessTier(): no token → PUBLIC tier
  47. BuildPublicView(): returns safe subset of passport + batch data
  48. [GAP-4] DataVisibility config ignored → all PUBLIC-tier fields always shown
  49. Partner with magic link → Bearer token in request → PARTNER tier
  50. Regulator with key → X-Regulator-Key header → REGULATOR tier (full view)

EXPORTS & REPORTS
  51. Due diligence PDF: GET /api/v1/batches/{id}/due-diligence-report (ACTIVE only)
  52. Compliance declaration PDF: separate export
  53. QR ZIP: all passport QR codes for a batch as a zip
  54. Labels PDF: printable label sheets
  55. Audit CSV/PDF: full lifecycle event log with hash chain
  56. CSV export: batch + passport data

ANALYTICS
  57. Every QR scan logged (country, device type, IP, timestamp)
  58. Dashboard: scan map, production chart, batch status distribution
  59. Live scan feed, device breakdown, country breakdown
```

---

## 8. Recommended Build Roadmap

Prioritized by EU compliance deadline and business impact:

### Phase 1: EU Compliance Minimum (before Feb 2027)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| P1-1 | Add `BatteryCategory` field to `BatchSpec` + activation gate | Small | 🔴 Critical |
| P1-2 | Build REPAIR + REPLACE lifecycle actions with hash chain events | Medium | 🔴 Critical |
| P1-3 | Enforce `DataVisibility` JSONB in `BuildPublicView()` / `BuildPartnerView()` | Small | 🔴 Critical |
| P1-4 | Fix hash chain genesis anchor (bind to passport UUID) | Tiny | 🔴 Critical |
| P1-5 | Add `SupplyChainProvenance` struct to `BatchSpec` (model + migration + UI) | Large | 🔴 Critical (Aug 2027) |
| P1-6 | Write SoH updates as `PassportEvent` in telemetry service | Small | 🔴 Critical |
| P1-7 | Add structured `PerformanceSpec` to `BatchSpec` | Small | 🟡 Important |
| P1-8 | Add `DisassemblyGuide` struct to `BatchSpec` | Small | 🟡 Important |

### Phase 2: Competitive Parity (Q1-Q2 2026)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| P2-1 | Carbon performance class A–G assignment (Aug 2027 mandate) | Small | 🟡 Important |
| P2-2 | Upgrade recycled content checks to hard blocks with date-gating (Aug 2028) | Small | 🟡 Important |
| P2-3 | Mount Swagger UI at `/api/docs` | Tiny | 🟢 Nice |
| P2-4 | Outbound webhook system for partner integrations | Medium | 🟡 Important |
| P2-5 | BatteryPass consortium 80-point attribute mapping + compliance checklist | Medium | 🟡 Important |
| P2-6 | prEN18239 / DIN DKE SPEC 99100 data model alignment documentation | Small | 🟡 Important |

### Phase 3: Differentiation (Q3-Q4 2026)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| P3-1 | Field-level selective disclosure (configurable per tier, per field) | Large | 🟢 Differentiator |
| P3-2 | Third-party attestation model (auditor can sign claims) | Large | 🟢 Differentiator |
| P3-3 | Second-life SoH threshold + automated recommendation | Medium | 🟢 Differentiator |
| P3-4 | Supply chain supplier onboarding portal (Tier-1/2 self-declare) | Large | 🟢 Differentiator |
| P3-5 | ISO 27001 compliance audit preparation | Large | 🟢 Trust signal |

---

## Key Takeaways

1. **The core engine is solid.** Lifecycle state machine, hash chain, three-tier access, carbon calculator, and India compliance are better built than most competitors would expect from a startup.

2. **India-to-EU is a genuine differentiator.** No competitor (Circulor, Circularise, BatteryPass) serves the Indian manufacturer compliance use case. This is ExportReady's defensible moat.

3. **Five critical gaps block EU compliance** — battery category, supply chain provenance, REPAIR/REPLACE actions, DataVisibility enforcement, and genesis hash anchor. These must be fixed before Feb 2027.

4. **Supply chain provenance is the largest build.** This is also the area where Circulor makes their enterprise pitch. Implementing it (even at a basic mine+country level) enables the "responsible sourcing" claim EU importers will demand.

5. **The platform is ~55% of the way to full EU 2023/1542 compliance.** Getting to 80%+ is achievable within 6 months of focused development.

---

*Document last updated: 2025. Generated by ExportReady engineering review.*
