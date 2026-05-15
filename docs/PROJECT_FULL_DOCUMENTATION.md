# AnvayaLabs Battery & Textile DPP — Full Project Documentation

> **Scope:** Comprehensive audit of the Digital Product Passport (DPP) platform for **Battery** and **Textile** products, targeting **Indian manufacturers** who need domestic compliance **and** EU export readiness.
>
> **Date:** 2026-05-14
> **Audited By:** Codebase analysis across backend (Go), frontend (Next.js 16), database (PostgreSQL), and documentation.

---

## 1. Executive Summary

AnvayaLabs Battery is a multi-product Digital Product Passport SaaS platform with three concurrent applications (Go backend, Next.js frontend, Tauri desktop). It currently supports:

- **Battery + India** — EU Battery Regulation 2023/1542 Article 77/78 + India BIS/EPR/MoRTH/PLI
- **Battery + EU** — Full EU Battery Regulation compliance
- **Textile + India/EU** — **Minimal stubs only**; not production-ready

**Readiness Score:**

| Product | India Market | EU Market | Global (India + EU) |
|---------|:----------:|:---------:|:-------------------:|
| **Battery** | ✅ 90% | ✅ 85% | ✅ 85% |
| **Textile** | ❌ 20% | ❌ 20% | ❌ 20% |

The platform has a **clean architectural pattern** for product branching (`[product]` dynamic routes, product-type columns, pluggable compliance registry, split tenant profiles), but **textile implementation is 20-30% complete** with significant gaps in compliance validators, lifecycle engine, serial generation, batch creation UI, and documentation.

**For Indian battery manufacturers:** The platform is **ready for India domestic use** (EPR, BIS, PLI, AIS-156, AIS-038) and **ready for EU export** (carbon footprint Art. 7, recycled content Art. 8, due diligence Art. 11, REACH). A manufacturer can create a `GLOBAL` batch and get compliance-scored against both India and EU regulations simultaneously.

**For Indian textile manufacturers:** The platform is **not ready**. There are no real India textile compliance validators (QCO, BIS textile, facility audits), no EU ESPR validators (durability, recyclability, microplastics, repairability), no textile serial formats, no carbon methodology for textiles, and the batch creation dialog is a 293-line stub versus 2,346 lines for battery.

---

## 2. Product Architecture Overview

### 2.1 Shared Infrastructure

| Layer | Technology | Product-Aware? |
|-------|------------|----------------|
| **Backend API** | Go 1.24, stdlib http.ServeMux | ✅ Yes — `ProductType` passed through handlers, services, registry |
| **Database** | PostgreSQL 16 | ✅ Yes — `product_type` column on `tenants`, `batches`, `passports`, `templates`, `schemas` |
| **Tenant Profiles** | Split tables (`battery_tenant_profiles`, `textile_tenant_profiles`) | ✅ Yes — branched by `product_type` |
| **Compliance Registry** | `compliance.Registry` maps `(ProductType, MarketRegion) → Validator` | ✅ Yes — supports any product/market pair |
| **Schema Registry** | DB-backed with JSON schema seeds | ✅ Yes — `battery_v1.json`, `textile_v1.json` registered |
| **Frontend Router** | Next.js 16 App Router `[product]/dashboard/*` | ✅ Yes — component swap pattern (`battery` vs `textile`) |
| **Product Config** | `frontend/lib/products.ts` | ✅ Yes — full `ProductConfig` for both |

### 2.2 Separation of Concerns Pattern

The codebase uses a **consistent three-tier branching pattern**:

```
Route Shell (shared) → Component Branch (battery|textile) → Business Logic (registry|service)
```

**Examples:**
- `app/[product]/dashboard/page.tsx` → `product === "textile" ? <TextileDashboard /> : <BatteryDashboard />`
- `backend/internal/handlers/batch_handlers.go:CreateBatch` → schema validation uses `productType` from request
- `backend/internal/repository/tenant.go:UpdateTenantProfile` → branches on `productType` to write to `battery_tenant_profiles` or `textile_tenant_profiles`

This pattern is **sound and extensible**. Adding a third product (e.g., `ELECTRONICS`) would require:
1. Adding `ProductTypeElectronics` to `models/types.go`
2. Adding component files under `components/electronics/`
3. Adding validators under `compliance/electronics/`
4. Adding schema seed `electronics_v1.json`
5. Adding tenant profile table `electronics_tenant_profiles`
6. Registering validators in `cmd/server/main.go`

---

## 3. Data Layer Deep Dive

### 3.1 Database Schema

#### Tables WITH `product_type` column (correctly product-aware)
| Table | Default | Notes |
|-------|---------|-------|
| `tenants` | `BATTERY` | Split profile data into `battery_tenant_profiles` / `textile_tenant_profiles` |
| `batches` | `BATTERY` | Shared structure; product-specific data lives in `specs` JSONB |
| `passports` | `BATTERY` | Shared structure; battery telemetry fields present for all products |
| `batch_templates` | `BATTERY` | Templates are product-scoped |
| `product_schemas` | — | Schema registry cache |

#### Tables WITHOUT `product_type` (implicitly battery-biased)
| Table | Bias | Impact |
|-------|------|--------|
| `carbon_factors` | Cell chemistry factors (`LFP`, `NMC_811`, `NCA`) in `kgCO2e/kWh` | No textile carbon methodology (fiber production, dyeing, finishing) |
| `epr_certificates` | Has `battery_type VARCHAR(50)` | India EPR for textiles has no data model |
| `soh_history` | State-of-Health is battery BMS concept | No textile quality metric history (colorfastness, shrinkage) |
| `reward_ledger` | Actions: `SCAN_INSTALL`, `SCAN_RECYCLE`, `SCAN_RETURN` | Battery mechanic/technician actions; no textile supply chain actions |
| `passport_events` | Event types: `SOH_UPDATED`, `REPAIR_LOGGED` | Battery-specific events |
| `trusted_domains` | Roles: `LOGISTICS`, `TECHNICIAN`, `RECYCLER`, `CUSTOMER` | Battery supply chain roles |

### 3.2 Models & Structs

#### Tenant Model
```go
type Tenant struct {
    // Shared fields
    ID, CompanyName, Address, LogoURL, SupportEmail, Website
    ProductType, QuotaBalance, PlanType, OnboardingCompleted

    // Battery-specific (always present in struct, empty for textile)
    EPRRegistrationNumber, BISRNumber, IECCode
    MorthManufacturerCode, MorthFactoryCodes
    EUAuthorizedRepresentativeName, EUAuthorizedRepresentativeAddress, EUContactEmail
    EPRCertificatePath, BISCertificatePath, PLICertificatePath
    EPRStatus, BISStatus, PLIStatus

    // Textile-specific (always present in struct, empty for battery)
    TextileFacilityType, TextileSupplyChainTier
    TextilePrimaryMarkets, TextileDefaultFiberTypes
    TextileCertifications, TextileComplianceDefaults
}
```

**Issue:** Both battery and textile fields coexist in the flat `Tenant` struct. While the database uses split profile tables, the Go struct is a flat union. This is manageable for two products but would scale poorly to 4+ products.

#### Batch & BatchSpec

**`Batch` struct** has battery-specific India columns that exist for ALL product types:
- `PLICompliant`, `DomesticValueAdd`, `CellSource`, `BillOfEntryNo`, `CountryOfOrigin`, `CustomsDate`
- `HSNCode`, `BISNumber`, `EPRNumber`, `DVASource`, `AuditedDomesticValueAdd`, `PLICertificateURL`
- `CarbonFootprintResult`

**`BatchSpec` JSONB** contains:
- **Battery fields:** `chemistry`, `nominal_voltage`, `capacity`, `material_composition`, `hazardous_substances`, `battery_category`, `performance_spec`, `disassembly_guide`, `supply_chain_provenance`, `cell_source`, `domestic_value_add`, `hsn_code`, `bis_number`, `epr_number`, `sale_price_inr`, `import_cost_inr`, `manufacturer_address`, `eu_representative`, `expected_lifetime_cycles`, `warranty_months`, `recycled_content_pct`, `certifications`
- **Textile fields:** `material_profile`, `lot_size`, `production_stage`
- **Shared fields:** `manufacturer`, `weight`, `carbon_footprint`, `country_of_origin`

**Issue:** The `Batch` table has ~15 battery-specific columns that are NULL for textile batches. This is database schema debt. A better design would move all product-specific fields into `specs` JSONB.

#### Passport Model

**`Passport` struct** has battery telemetry fields:
- `StateOfHealth`, `LastSOHUpdateTimestamp`, `CycleCount`, `LastTemperature`, `LastVoltage`, `ThermalEventCount`, `LastTelemetryAt`
- `RecyclingStatus`, `RecyclerEprID`, `RecyclingDate`

**Issue:** No textile equivalent fields (e.g., `WashCycles`, `WearIndex`, `ColorfastnessRating`). Textile passports carry battery BMS fields that are always empty.

### 3.3 Schema Registry

| Schema | Size | DisplayConfig | Maturity |
|--------|------|---------------|----------|
| `battery_v1.json` | 215 lines | ✅ Full field-level access control (PUBLIC / PARTNER / OWNER) | Production-ready |
| `textile_v1.json` | 34 lines | ❌ Nil — all fields default to PUBLIC | Minimal stub |

**Textile schema gap:** Missing structured fields for fiber composition, GSM (grams per square meter), dye process, water usage, energy usage, supplier tier, labor compliance, chemical compliance (ZDHC).

### 3.4 Passport Templates

| Template | Family | Market | Maturity |
|----------|--------|--------|----------|
| `BATTERY_INDIA` | battery | India | ✅ Complete |
| `BATTERY_STANDARD` | battery | EU/Global | ✅ Complete |
| `TEXTILE_STANDARD` | textile | All | ⚠️ Single generic template for all markets |

**Missing:** `TEXTILE_INDIA` variant. Indian textile passports use the same generic template as EU textile passports.

---

## 4. Compliance Engine Assessment

### 4.1 Battery India Validator (`compliance/battery/india.go`)
**Maturity: HIGH — Production-ready (207 lines)**

Rules enforced:
- Tenant credentials: EPR, BIS R-Number, IEC, MoRTH code
- Cell source: IMPORTED requires customs fields; DOMESTIC requires DVA
- PLI claim: DVA ≥ 50%
- Safety certifications: AIS-156, AIS-038 (both mandatory)
- Soft warnings: BIS batch number, EPR batch number

Scoring: Dynamic denominator (8 base + conditional sub-checks).

### 4.2 Battery EU Validator (`compliance/battery/eu.go`)
**Maturity: HIGH — Production-ready (213 lines)**

Rules enforced:
- Tenant: EU Authorized Representative (name, address, email)
- Battery category: EV / LMT / INDUSTRIAL / PORTABLE / SLI (mandatory + validated)
- Carbon footprint: Must come from calculator (free-text rejected)
- Material composition: Critical raw materials + recycled content targets (EU 2030/2035)
- Hazardous substances: REACH/RoHS declaration
- Lifetime & warranty: Expected cycles, warranty months
- Soft warnings: Overall recycled content percentage

Scoring: 13 checkpoints.

### 4.3 Textile India Validator (`compliance/textile/india.go`)
**Maturity: MINIMAL — Placeholder (86 lines)**

Rules enforced:
- Tenant: company_name
- Batch: material_profile, country_of_origin, production_stage
- Warning: lot_size recommended

**Explicit comment in code:** *"It exists so GLOBAL textile compliance can aggregate across markets until dedicated India textile regulations are modelled separately."*

**Missing for real India textile compliance:**
- BIS textile certification (IS 17243, IS 16322, etc.)
- Facility registration / audit requirements
- Fiber composition percentages (mandatory labeling)
- Chemical compliance (ZDHC MRSL, RSL)
- Labor compliance (SA8000, BSCI)
- Water/energy disclosure (ZDHC wastewater guidelines)
- QCO (Quality Control Order) compliance

### 4.4 Textile EU Validator (`compliance/textile/eu.go`)
**Maturity: MINIMAL — Placeholder (99 lines)**

Rules enforced:
- Tenant: company_name, address
- Batch: manufacturer, material_profile, country_of_origin, production_stage
- Hazardous substances: REACH/SVHC declaration
- Warnings: supply-chain due-diligence policy, certifications

**Missing for real EU ESPR compliance:**
- Durability metrics (expected lifetime, wash cycles)
- Recyclability targets and fiber recyclability scoring
- Microplastic compliance (synthetic fiber shedding)
- Repairability index
- Fiber origin traceability (recycled vs virgin)
- Digital Product Passport disclosure requirements (ESPR)
- Environmental footprint calculation (PEF)

### 4.5 GLOBAL Mode Aggregation

The registry's `validateGlobal` function runs BOTH India and EU validators and aggregates results. This is **correctly implemented** and works for battery GLOBAL batches.

For textile GLOBAL batches, it runs the minimal India + minimal EU validators, producing a **weak score that does not reflect real compliance**.

---

## 5. Backend Business Logic

### 5.1 Activation Compliance Gate

**Current behavior:**
- Common checks: `model_name`, `manufacturing_start_date`, `manufacturing_end_date` (all products)
- Battery-only common checks: `chemistry`, `capacity` (hardcoded in `activation_compliance.go:74-81`)
- Market-specific: Delegated to registry validators

**Issue:** No textile-specific required fields in the common gate. A textile batch could activate with almost no data.

**What should be added for textile:**
- `material_profile` required
- `manufacturer` required
- `country_of_origin` required
- `production_stage` required

### 5.2 Serial Number Generation (BPAN)

**Format registry** (`serial/configs.go`):
```go
{ProductTypeBattery, MarketRegionIndia} → IN-XXXX-XXXX-XXXX
{ProductTypeBattery, MarketRegionEU}    → EU-XXXX-XXXX-XXXX
{ProductTypeBattery, MarketRegionGlobal}→ GL-XXXX-XXXX-XXXX
// NO TEXTILE ENTRIES
```

**BPANGenerator.Generate** explicitly rejects non-battery:
```go
if pt != models.ProductTypeBattery {
    return "", fmt.Errorf("serial: BPANGenerator only supports BATTERY products")
}
```

**Impact:**
- ❌ Auto-generate passports fails hard for textile
- ✅ CSV upload works (arbitrary serial numbers accepted)

**What textile needs:** A textile serial format (e.g., `TE-YYYY-NNNN` or India-specific textile traceability code).

### 5.3 Lifecycle Engine

**Current state machine (all products):**
```
CREATED → ACTIVE → SHIPPED → IN_SERVICE → RECYCLED → END_OF_LIFE
```

**Textile-specific states exist but are ORPHANED:**
```go
TextileStatusRawMaterial  = "RAW_MATERIAL"
TextileStatusInProduction = "IN_PRODUCTION"
TextileStatusFinished     = "FINISHED"
TextileStatusInUse        = "IN_USE"
```

These constants are defined in `models/models.go:446-453` but **never wired into `TransitionMap`** (`models/models.go:605-630`).

**Issue:** Textile products are forced through a battery lifecycle. A t-shirt cannot meaningfully be "IN_SERVICE" or "RECYCLED" in the same way a battery is.

**What textile needs:**
```
RAW_MATERIAL → IN_PRODUCTION → FINISHED → SHIPPED → IN_USE → RECYCLED
```
With textile-specific evidence:
- `FINISHED` → quality test report, composition certification
- `SHIPPED` → shipping manifest, customs declaration
- `IN_USE` → care instructions, repair events
- `RECYCLED` → fiber recovery certificate, recycler certification

### 5.4 Carbon Calculator

**Current:** `carbon_factors` table stores cell chemistry factors, transport modes, energy mixes, and assembly factors in `kgCO2e/kWh`.

**Issue:** Textile carbon calculation requires entirely different methodology:
- Fiber production (cotton, polyester, wool, viscose)
- Spinning, weaving/knitting
- Dyeing and finishing
- Cut-make-trim
- Transport and distribution

**No textile carbon factors exist.**

---

## 6. Frontend UI/UX Assessment

### 6.1 Dashboard Subpages

| Subpage | Battery Component | Textile Component | Status |
|---------|-------------------|-------------------|--------|
| `dashboard` | `battery-dashboard-page.tsx` (~1,100 lines) | `textile-dashboard-page.tsx` (~400 lines) | ✅ Both exist |
| `batches` | `battery-batches-page.tsx` (~900 lines) | `textile-batches-page.tsx` (~200 lines) | ✅ Both exist |
| `batches/[id]` | `batch-details-page.tsx` (shared, ~2,300 lines) | same | ⚠️ Battery-oriented |
| `compliance` | `battery-compliance-page.tsx` (~1,000 lines) | `textile-compliance-page.tsx` (~150 lines) | ⚠️ Textile is stub |
| `settings` | `battery-settings-page.tsx` (~800 lines) | `textile-settings-page.tsx` (~600 lines) | ✅ Both exist |
| `onboarding` | `battery-onboarding-page.tsx` (855 lines) | `textile-onboarding-page.tsx` (754 lines) | ✅ Both exist |
| `team` | `battery-team-page.tsx` | `textile-team-page.tsx` | ✅ Both exist |
| `templates` | `battery-templates-page.tsx` | `textile-templates-page.tsx` | ✅ Both exist |
| `lifecycle` | `battery-lifecycle-page.tsx` | `textile-lifecycle-page.tsx` | ⚠️ Textile is stub |
| `analytics` | Full implementation | `UnderDevelopment` | ❌ Missing |
| `billing` | Full implementation | `UnderDevelopment` | ❌ Missing |
| `dispatch` | Full implementation | `UnderDevelopment` | ❌ Missing |
| `developer` | Full implementation | `UnderDevelopment` | ❌ Missing |
| `exports` | Full implementation | `UnderDevelopment` | ❌ Missing |
| `partners` | Full implementation | `UnderDevelopment` | ❌ Missing |
| `rewards` | Full implementation | `UnderDevelopment` | ❌ Missing |

**Textile dashboard is ~40-50% complete.** Core pages exist but 8 subpages are `UnderDevelopment` placeholders.

### 6.2 Batch vs Lot Creation

| Feature | Battery (`create-batch-dialog.tsx`) | Textile (`create-textile-lot-dialog.tsx`) |
|---------|-------------------------------------|-------------------------------------------|
| Lines of code | 2,346 | 293 |
| Market region | India / EU / Global | Hardcoded `GLOBAL` |
| Template save | ✅ Yes | ❌ No |
| Carbon calculator | ✅ Yes | ❌ No |
| DVA calculator | ✅ Yes | ❌ No |
| Compliance fields | EU (category, footprint, materials, REACH) + India (HSN, BIS, EPR, PLI, customs, AIS) | None |
| Chemistry | LFP/NMC/NCA/LTO/Na-ion | N/A |
| Certifications | AIS-156, AIS-038, BIS, CE, UN38.3 | Free-text only |

### 6.3 Shared Components with Battery Bias

| Component | Issue |
|-----------|-------|
| `DashboardSidebar.tsx` | Always labels section "Batches". No `productType` prop to relabel to "Lots" for textile. |
| `hooks/use-queries.ts` | `useBatches` fetches ALL batches without `product_type` filter. Textile users see battery batches. |
| `create-batch-dialog.tsx:584` | Payload hardcodes `product_type: "BATTERY"` |
| `passport-view.tsx` | Battery-only. Shows chemistry, voltage, SoH gauge, cell source, "Aadhaar" label. No textile branching. |
| `app/p/[uuid]/page.tsx:92` | Defaults `product_type` to `"BATTERY"` if API returns none |

---

## 7. Indian Manufacturer: Battery Passport Journey

### 7.1 What's Ready Today

**Onboarding:**
- ✅ Company profile, target markets (India/EU/Both), compliance setup
- ✅ India: EPR registration, BIS R-Number, IEC code, MoRTH manufacturer code
- ✅ EU: Authorized representative name/address/email
- ✅ Completion latch triggers dashboard access

**Batch Creation:**
- ✅ Create batch with full India fields: HSN (8507), BIS, EPR, PLI checkbox, cell source, DVA calculator, customs declaration
- ✅ Create batch with full EU fields: Battery category, carbon footprint calculator, material composition, recycled content, REACH declaration, lifetime, warranty
- ✅ Create `GLOBAL` batch that targets both markets
- ✅ Save as template for future batches
- ✅ Schema validation against `battery_v1.json`

**Compliance Scoring:**
- ✅ India validator checks EPR, BIS, IEC, MoRTH, cell source, customs, PLI, AIS-156, AIS-038
- ✅ EU validator checks EU AR, carbon footprint, material composition, REACH, lifetime, warranty, battery category
- ✅ GLOBAL mode aggregates India + EU scores
- ✅ Gap reporting with regulation references

**Activation:**
- ✅ Hard gate blocks activation if compliance requirements are missing
- ✅ Quota deduction on activation
- ✅ Passport generation with BPAN serials (IN- prefix for India)

**Post-Activation:**
- ✅ QR code generation (256×256 PNG)
- ✅ Label generation (PDF with BPAN, QR, compliance badges)
- ✅ Public passport page (`/p/[uuid]`) with India-specific view
- ✅ Lifecycle transitions: ACTIVE → SHIPPED → IN_SERVICE → RECYCLED
- ✅ SOH (State of Health) updates for installed batteries
- ✅ Audit trail with BLAKE2b hash chain

**Export to EU:**
- ✅ EU attribute scoring (56-attribute checklist)
- ✅ Compliance declaration PDF download
- ✅ CPCB Form 3 export for India regulators

### 7.2 What's Missing for Battery

| Gap | Priority | Effort |
|-----|----------|--------|
| **EU battery passport format alignment** with EU Battery Passport consortium standard | P2 | Medium |
| **CBAM integration** (Carbon Border Adjustment Mechanism) for EU export | P3 | High |
| **EPR certificate upload** (PDF) and validation | P2 | Low |
| **BIS certificate upload** and auto-verification against BIS database | P2 | Medium |
| **MoRTH code validation** against RTO database | P3 | Medium |
| **Advanced carbon calculator** with grid mix, transport mode, cell format | P2 | Medium |

---

## 8. Indian Manufacturer: Textile Passport Journey

### 8.1 What's Ready Today

**Onboarding:**
- ✅ Company profile, supply chain setup, product data readiness
- ✅ Textile-specific fields: facility type, supply chain tier, material focus, certifications (GOTS, GRS, OEKO-TEX, BSCI)
- ✅ Launch workspace

**Dashboard:**
- ✅ Basic stats (total records, active lots, quota)
- ✅ Recent lots list
- ✅ Quick actions: Create Lot, Upload Catalog, Team & Access, Settings

**Lot Creation:**
- ✅ Create lot with: lot name, style/SKU, lot size, production stage, material profile, country of origin, certifications
- ⚠️ No market region selection (hardcoded GLOBAL)
- ⚠️ No compliance fields (ESPR, QCO, etc.)
- ⚠️ No template save
- ⚠️ No carbon or traceability calculators

**Public Passport:**
- ✅ Basic certificate view with textile badge (🧵)
- ✅ Shows material profile, lot size, production stage, facility type, supply chain tier
- ⚠️ No India-specific textile view
- ⚠️ No EU ESPR-specific view

### 8.2 What's Missing for Textile

| Gap | Priority | Effort |
|-----|----------|--------|
| **India textile compliance validators** (QCO, BIS textile IS 17243, facility audits) | **P1** | High |
| **EU ESPR compliance validators** (durability, recyclability, microplastics, repairability, PEF) | **P1** | High |
| **Textile serial format** (auto-generation fails hard) | **P1** | Medium |
| **Textile lifecycle engine** (RAW_MATERIAL → IN_PRODUCTION → FINISHED → IN_USE → RECYCLED) | **P1** | High |
| **Textile carbon calculator** (fiber, spinning, dyeing, CMT factors) | **P1** | High |
| **Textile batch creation dialog** (needs market region, ESPR/QCO fields, template save, calculators) | **P1** | High |
| **Textile schema** (structured fields: fiber composition, GSM, dye process, water usage, supplier tier) | **P1** | Medium |
| **`TEXTILE_INDIA` passport template** | **P2** | Low |
| **Textile compliance page** (certificate upload, scoring dashboard) | **P2** | Medium |
| **Textile lifecycle page** (lot tracking, quality tests, repair events) | **P2** | Medium |
| **Dashboard sidebar** relabeling ("Lots" instead of "Batches") | **P2** | Low |
| **Analytics, Billing, Dispatch, Developer, Exports, Partners, Rewards** pages | **P3** | Medium each |
| **Manual test plans** for textile flows | **P2** | Low |
| **User-facing documentation** for textile onboarding and compliance | **P2** | Low |

---

## 9. EU Export Readiness

### 9.1 Battery EU Export

| Requirement | EU Regulation | Status |
|-------------|---------------|--------|
| Digital Battery Passport | 2023/1542 Art. 77 | ✅ UUID-based passports with QR codes |
| Carbon footprint declaration | Art. 7 | ✅ Calculator + validation (free-text rejected) |
| Recycled content targets | Art. 8 | ✅ Material composition + 2030/2035 targets |
| Supply chain due diligence | Art. 11 | ✅ Hazardous substances + EU AR |
| Battery category classification | Art. 2 | ✅ EV/LMT/Industrial/Portable/SLI validation |
| Performance & durability | Annex IV | ⚠️ Expected lifetime cycles field exists; not validated |
| Removability & replaceability | Art. 11 | ❌ Not tracked |
| Regulator access (Art. 78) | Art. 78 | ✅ `REGULATOR_API_KEY` endpoint exists |

### 9.2 Textile EU Export (ESPR)

| Requirement | ESPR Status | Platform Status |
|-------------|-------------|-----------------|
| Digital Product Passport | Required by 2027/2030 | ❌ No structured DPP for textiles |
| Durability / lifetime info | Required | ❌ No validation |
| Recyclability | Required | ❌ No scoring |
| Fiber composition | Required | ⚠️ Free-text `material_profile` only |
| Microplastic compliance | Required for synthetics | ❌ No validation |
| Repairability index | Required | ❌ No tracking |
| Environmental footprint (PEF) | Required | ❌ No calculator |
| Chemical compliance (REACH/SVHC) | Required | ⚠️ Basic declaration field only |

---

## 10. Complete Gap Analysis Matrix

| Capability | Battery India | Battery EU | Textile India | Textile EU |
|------------|:-----------:|:----------:|:-------------:|:----------:|
| **Compliance Validator** | ✅ Complete | ✅ Complete | ❌ Placeholder | ❌ Placeholder |
| **Activation Gate** | ✅ Works | ✅ Works | ⚠️ No textile fields | ⚠️ No textile fields |
| **Serial Generation** | ✅ BPAN V2 | ✅ BPAN V2 | ❌ Not supported | ❌ Not supported |
| **Lifecycle States** | ✅ Designed | ✅ Designed | ❌ Orphaned | ❌ Orphaned |
| **Passport Templates** | ✅ BATTERY_INDIA + STANDARD | ✅ BATTERY_STANDARD | ⚠️ TEXTILE_STANDARD only | ⚠️ TEXTILE_STANDARD only |
| **Schema Registry** | ✅ 215 lines + display config | ✅ Same schema | ❌ 34 lines, no display config | ❌ Same |
| **Carbon Calculator** | ✅ Cell chemistry factors | ✅ Same | ❌ No methodology | ❌ No methodology |
| **Batch/Lot Creation UI** | ✅ 2,346 lines | ✅ Same | ❌ 293-line stub | ❌ Same |
| **Onboarding UI** | ✅ 855 lines | ✅ Same | ✅ 754 lines | ✅ Same |
| **Dashboard** | ✅ Full | ✅ Same | ⚠️ Basic (8 pages missing) | ⚠️ Same |
| **Compliance Page** | ✅ ~1,000 lines | ✅ Same | ❌ ~150-line stub | ❌ Same |
| **Settings Page** | ✅ Full | ✅ Same | ✅ Full | ✅ Full |
| **Public Passport View** | ✅ Rich view | ✅ Same | ⚠️ Basic certificate only | ⚠️ Same |
| **QR Code Labels** | ✅ PDF with compliance badges | ✅ Same | ⚠️ Basic label | ⚠️ Same |
| **EU Attribute Score** | ✅ 56-attribute checklist | ✅ Same | ❌ None | ❌ None |
| **Documentation** | ✅ Extensive | ✅ Same | ❌ None | ❌ None |
| **Manual Test Plans** | ✅ 8 plans | ✅ Same | ❌ None | ❌ None |
| **E2E Test Coverage** | ❌ None | ❌ None | ❌ None | ❌ None |

---

## 11. Implementation Roadmap

### Phase 1: Textile Foundation (4–6 weeks)
**Goal:** Make textile functional for basic lot creation and public passport viewing.

| Task | Files | Owner |
|------|-------|-------|
| Add `TEXTILE_INDIA` passport template | `models/types.go`, `lib/passport-template-config.ts` | Backend + Frontend |
| Create textile serial format | `serial/configs.go`, `serial/generator.go` | Backend |
| Expand textile schema (fiber, GSM, dye, water, supplier tier) | `schema/seeds/textile_v1.json`, `schema/seeds/seeds.go` | Backend |
| Add structured textile fields to `BatchSpec` | `models/models.go` | Backend |
| Build textile lot creation dialog (market region, ESPR/QCO fields, template save) | `components/textile/create-textile-lot-dialog.tsx` | Frontend |
| Add `product_type` filter to `useBatches` hook | `hooks/use-queries.ts` | Frontend |
| Fix `DashboardSidebar` to accept `productType` prop | `components/dashboard/DashboardSidebar.tsx` | Frontend |
| Fix `create-batch-dialog.tsx` hardcoded `product_type: "BATTERY"` | `components/batches/create-batch-dialog.tsx` | Frontend |

### Phase 2: Textile Compliance (6–8 weeks)
**Goal:** Real India and EU compliance validation for textiles.

| Task | Files | Owner |
|------|-------|-------|
| Implement India textile validator (QCO, BIS textile, facility audits, fiber composition, chemical compliance) | `compliance/textile/india.go` | Backend |
| Implement EU ESPR validator (durability, recyclability, microplastics, repairability, PEF, fiber traceability) | `compliance/textile/eu.go` | Backend |
| Add textile-specific activation fields to common gate | `services/activation_compliance.go` | Backend |
| Build textile carbon calculator (fiber, spinning, dyeing, CMT) | New service + frontend component | Backend + Frontend |
| Build textile compliance page (certificate upload, scoring dashboard) | `components/textile/textile-compliance-page.tsx` | Frontend |
| Add textile lifecycle states to `TransitionMap` | `models/models.go`, `services/lifecycle.go` | Backend |
| Add textile-specific evidence types | `models/evidence.go` | Backend |

### Phase 3: Textile Lifecycle & Advanced Features (4–6 weeks)
**Goal:** Full lifecycle tracking, partner integration, and advanced features.

| Task | Files | Owner |
|------|-------|-------|
| Build textile lifecycle page (lot tracking, quality tests, repair events) | `components/textile/textile-lifecycle-page.tsx` | Frontend |
| Implement textile quality metric history (colorfastness, shrinkage) | New table + service | Backend |
| Add textile supply chain roles (MILL, DYE_HOUSE, CUT_SEW, BRAND) | `models/models.go`, `trusted_domains` | Backend |
| Build Analytics, Billing, Dispatch, Exports, Partners pages for textile | `app/[product]/dashboard/*/page.tsx` | Frontend |
| Write manual test plans for textile | `testing/` | QA |
| Write user-facing textile documentation | `docs/` | Documentation |

### Phase 4: Battery Hardening (parallel, 2–4 weeks)
**Goal:** Address remaining battery gaps while textile work continues.

| Task | Files | Owner |
|------|-------|-------|
| EPR/BIS certificate upload and validation | `repository/tenant.go`, `components/settings/battery-compliance-page.tsx` | Backend + Frontend |
| Performance & durability validation (Annex IV) | `compliance/battery/eu.go` | Backend |
| Advanced carbon calculator (grid mix, transport, cell format) | `services/carbon_service.go` | Backend |
| Add `product_type` guards to battery-only handlers | `handlers/batch_handlers.go`, `handlers/upload_handlers.go` | Backend |
| Fix `passport-view.tsx` battery bias | `components/passport/passport-view.tsx` | Frontend |

---

## 12. Critical Recommendations

### 12.1 Immediate Actions (This Week)

1. **Fix `create-batch-dialog.tsx:584`** — Change hardcoded `product_type: "BATTERY"` to use the actual product type from context/router.
2. **Fix `hooks/use-queries.ts`** — Add `product_type` filter to `useBatches` to prevent data leakage between battery and textile workspaces.
3. **Fix `app/p/[uuid]/page.tsx:92`** — Remove the `"BATTERY"` default for `product_type`. If API returns none, show an error or require explicit type.
4. **Fix `DashboardSidebar.tsx`** — Accept a `productType` prop and relabel "Batches" → "Lots" for textile.

### 12.2 Short-Term (Next 2 Weeks)

5. **Create `TEXTILE_INDIA` passport template** — Even a basic one is better than using `TEXTILE_STANDARD` for all markets.
6. **Implement textile serial format** — The simplest blocker. Define a format (e.g., `TE-YYYY-NNNN`) and register it in `serial/configs.go`.
7. **Expand `textile_v1.json` schema** — Add structured fields for fiber composition, GSM, dye process, water usage. Add a `DisplayConfig` for field-level access control.
8. **Add `product_type` guards to India batch creation** — `handlers/batch_handlers.go:110-221` forces ALL India batches through battery PLI/DVA/HSN/customs logic. Add `if productType == BATTERY` guards.

### 12.3 Medium-Term (Next 2 Months)

9. **Build real textile compliance validators** — Start with India (QCO, BIS textile, fiber composition) and EU ESPR basics (durability, chemical compliance). This is the biggest value driver.
10. **Build textile carbon calculator** — Textile carbon footprint is increasingly required by EU buyers. A basic fiber + dyeing + CMT model would differentiate the platform.
11. **Wire textile lifecycle states** — Connect `RAW_MATERIAL`, `IN_PRODUCTION`, `FINISHED`, `IN_USE` to `TransitionMap` with appropriate evidence requirements.
12. **Add Playwright E2E tests** — Start with the critical battery flow (onboarding → batch create → activate → passport view) to prevent regressions as textile work proceeds.

### 12.4 Strategic

13. **Refactor `Batch` table** — Move battery-specific columns (`CellSource`, `BillOfEntryNo`, `HSNCode`, `BISNumber`, etc.) into `specs` JSONB. This eliminates schema debt and makes the table truly product-agnostic.
14. **Refactor `Tenant` struct** — Consider using embedded profile structs instead of a flat union. This would scale better to 4+ products.
15. **Consider a generic `ProductDomain` abstraction** — The archived `GENERIC_DPP_ENGINE_DESIGN.md` proposed this. It would replace hardcoded `if productType == BATTERY` branches with domain-config-driven logic.

---

## Appendix A: File Reference Index

### Backend (Go)
| File | Purpose |
|------|---------|
| `backend/internal/models/models.go` | Domain structs (Tenant, Batch, Passport, BatchSpec) |
| `backend/internal/models/types.go` | ProductType, MarketRegion, PassportTemplateVariant |
| `backend/internal/models/access_views.go` | Public view builders for passport pages |
| `backend/internal/models/evidence.go` | Lifecycle evidence requirements |
| `backend/internal/compliance/registry.go` | Pluggable compliance registry |
| `backend/internal/compliance/battery/india.go` | India battery validator |
| `backend/internal/compliance/battery/eu.go` | EU battery validator |
| `backend/internal/compliance/textile/india.go` | India textile validator (stub) |
| `backend/internal/compliance/textile/eu.go` | EU textile validator (stub) |
| `backend/internal/services/activation_compliance.go` | Activation gate |
| `backend/internal/services/lifecycle.go` | Lifecycle state machine |
| `backend/internal/services/batch_service.go` | Batch creation, compliance runner |
| `backend/internal/services/passport_service.go` | Passport generation |
| `backend/internal/serial/configs.go` | Serial format registry |
| `backend/internal/serial/generator.go` | BPAN generator |
| `backend/internal/handlers/batch_handlers.go` | Batch CRUD, activation, upload |
| `backend/internal/repository/tenant.go` | Tenant profile persistence |
| `backend/internal/db/migrations/` | Database schema evolution |
| `backend/internal/schema/seeds/battery_v1.json` | Battery JSON schema |
| `backend/internal/schema/seeds/textile_v1.json` | Textile JSON schema (stub) |

### Frontend (Next.js / React)
| File | Purpose |
|------|---------|
| `frontend/app/[product]/dashboard/*/page.tsx` | Dashboard subpages |
| `frontend/components/dashboard/battery-dashboard-page.tsx` | Battery dashboard |
| `frontend/components/dashboard/textile-dashboard-page.tsx` | Textile dashboard |
| `frontend/components/batches/create-batch-dialog.tsx` | Battery batch creation |
| `frontend/components/textile/create-textile-lot-dialog.tsx` | Textile lot creation |
| `frontend/components/onboarding/battery-onboarding-page.tsx` | Battery onboarding |
| `frontend/components/onboarding/textile-onboarding-page.tsx` | Textile onboarding |
| `frontend/components/passport/certificate-view.tsx` | Public passport certificate |
| `frontend/components/passport/passport-view.tsx` | Rich passport dashboard (battery-only) |
| `frontend/lib/products.ts` | Product configuration |
| `frontend/lib/passport-template-config.ts` | Template resolution |
| `frontend/lib/routes.ts` | Product-aware route builder |
| `frontend/hooks/use-queries.ts` | TanStack Query hooks |

### Documentation
| File | Purpose |
|------|---------|
| `docs/DEVELOPER_ONBOARDING.md` | Backend/frontend setup |
| `docs/DEMO_READINESS_AUDIT.md` | Pre-demo checklist |
| `docs/ENTERPRISE_COMPLIANCE_ROADMAP.md` | Compliance feature roadmap |
| `docs/PASSPORT_LIFECYCLE_TESTING.md` | Lifecycle test guide |
| `testing/01-authentication-onboarding.md` | Manual test plans (battery-only) |
| `testing/03-batch-creation-carbon.md` | Batch creation tests (battery-only) |

---

*End of document. This audit should be revisited after each major phase completion.*
