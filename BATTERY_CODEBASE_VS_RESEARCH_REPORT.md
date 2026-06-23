# Battery Codebase vs. Deep Research Report — Comprehensive Gap Analysis

> **Date:** 2026-06-06  
> **Report:** `docs/deep-research-report.md`  
> **Codebase:** `apps/battery-*`, `services/battery-api`

---

## Executive Summary

The deep-research-report outlines regulatory requirements (India BWM 2022/25, EU Battery Regulation 2023/1542, ESPR, OECD Due Diligence, etc.) and maps them to product features with priorities P0–P2. **The battery codebase (web + API) is remarkably well-aligned with the report.** Most P0 and P1 features are either fully implemented or have substantial foundations. The report appears to have been written either before the current codebase matured or as a parallel requirements document, because the implementation team has already addressed the majority of identified gaps.

**Critical finding:** The backend (`services/battery-api`) and web frontend (`apps/battery-web`) are production-grade. The mobile app (`apps/battery-mobile`) is an empty scaffold, and the desktop app (`apps/battery-desktop`) is a thin Tauri shell. The largest remaining gaps are **live registry integrations** (all placeholder), **regulatory intelligence/monitoring**, and **mobile/desktop parity**.

---

## 1. Requirement-by-Requirement Comparison

### 1.1 India: BWM Rules 2022/25 (CPCB EPR) — P0

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| Producer registration tracking | ✅ **Implemented** | `epr_certificates` table, EPR registration number in tenant profile | None |
| Annual EPR plan submission | ⚠️ **Partial** | CPCB Form 3 CSV export (`cpcb_export_service.go`, `/api/v1/epr/cpcb-export`) | No live CPCB API submit; CSV export only |
| Collection/recycling target calculation | ✅ **Implemented** | `epr_obligation_service.go` computes 60–80% targets, deficit, penalty exposure @ ₹50/kg | None |
| Credit reconciliation (authorised recyclers) | ⚠️ **Partial** | `epr_certificate_handler.go` supports CRUD/retire of recycler certificates | No automated credit import from recycler systems |
| Recyclers MoU tracking | ⚠️ **Partial** | Supplier portal exists; supplier documents track CoCs | No explicit "MoU" document type or recycler-specific workflow |
| Barcode/QR traceability | ✅ **Implemented** | `qr_service.go` generates 256×256 PNGs; GS1 Digital Link when GTIN present | None |
| Environmental Compensation calculator | ✅ **Implemented** | `CalculateEPRObligation` computes `PenaltyExposureINR` | None |
| **CPCB portal integration** | ❌ **Placeholder** | `registry/adapter.go` CPCB adapter returns `self_declared` unless API key configured | **Major gap:** No real CPCB API connectivity |

**Verdict:** India EPR compliance is structurally complete for data capture and calculation, but **live CPCB integration is entirely missing.** The platform can prepare filings (CSV export) but cannot submit or pull real-time EPR data.

---

### 1.2 India: BIS/AIS (EV Battery Safety) — P1

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| BIS certification document upload | ✅ **Implemented** | Batch spec includes `BISCertificateIssueDate`, `BISCertificateNumber`; document upload endpoints exist | None |
| DoC/versioned registry | ✅ **Implemented** | `passport_documents` table, document attachments with SHA-256 hashes | None |
| AIS-156 / AIS-038 validation | ✅ **Implemented** | `india.go` validator checks AIS-156 and AIS-038 compliance | None |
| Electronic linkage of certificates | ✅ **Implemented** | Certificates linked to batches; blockchain anchors (`certificate_anchors`, OpenTimestamps) | None |
| **BIS CRS live verification** | ❌ **Placeholder** | `registry/adapter.go` BIS adapter returns `self_declared` | **Major gap:** No real BIS API |

**Verdict:** Document management and validation logic are complete. Live BIS registry verification is a placeholder.

---

### 1.3 India: PLI-ACC Scheme — P2

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| BOM tracking for DVA | ✅ **Implemented** | `components` table (BOM), `DomesticValueAdd` field on batch, DVA calculator UI | None |
| PLI certificate tracking | ✅ **Implemented** | Batch spec has `PLICertificateNumber`, `PLICertificateIssueDate` | None |
| DVA reporting (25%→60%) | ✅ **Implemented** | India validator checks `PLI Phase II DVA ≥50%`; UI shows DVA card | None |
| Investment commitment tracking (₹225 Cr/GWh) | ❌ **Not implemented** | No fields or modules for capex tracking | Minor gap — P2, acceptable |

**Verdict:** Well covered for a P2 feature. Investment commitment tracking is missing but low priority.

---

### 1.4 EU: Batteries Regulation 2023/1542 — P0

#### Digital Battery Passport

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| Unique ID generation | ✅ **Implemented** | `serial/generator.go` BPAN-V2 format: `{REGION}-{MFR3}-{CHEM3}-{YYYY}-{NNNNN}` | None |
| GS1 Digital Link / GTIN | ✅ **Implemented** | QR service encodes GS1 Digital Link when GTIN present; `BatchSpec.GTIN` field | None |
| QR code printing | ✅ **Implemented** | `qr_service.go` generates PNG; export jobs include QR ZIP, Labels PDF | None |
| AAS/JSON-LD export | ✅ **Implemented** | `epcis_export.go` GS1 EPCIS JSON-LD; VC crypto service for W3C credentials | None |
| Passport data fields (BOM, chemistry, capacity, etc.) | ✅ **Implemented** | `BatchSpec` covers all fields; `components` table for BOM | None |
| Public passport page | ✅ **Implemented** | `/p/[uuid]` route with tiered access (public/partner/regulator), 24 languages | None |
| **EU DPP Registry interface** | ❌ **Not implemented** | No code references EU registry APIs | Expected — registry not operational until July 2026 |

#### Carbon Footprint (Art. 7)

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| Carbon footprint calculation | ✅ **Implemented** | `carbon_calculator.go` JRC/IEA/BEE methodology; A–G performance class | None |
| kgCO₂eq per battery declaration | ✅ **Implemented** | `CarbonResult` includes `DeclarationText`, `Methodology` | None |
| LCA data collection workflow | ⚠️ **Partial** | Carbon input accepts cell chemistry, energy mix, transport; not full upstream LCA | Gap: limited to battery-specific factors, not full supply-chain LCA |

#### Recycled Content (Art. 8)

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| Track recycled inputs | ✅ **Implemented** | `MaterialComposition` tracks recycled % for Co, Li, Ni, Pb, Mn, graphite | None |
| Mass balance ledger | ✅ **Implemented** | `mass_balance_ledgers` / `mass_balance_allocations` tables with balance enforcement | None |
| EU validator threshold checks | ✅ **Implemented** | `eu.go` checks Co≥16%, Li≥6%, Ni≥6%, Pb≥85% (2030 targets) | None |

#### CE Marking / DoC

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| CE certificate tracking | ✅ **Implemented** | `BatchSpec.CEMarking`, `CENotifiedBodyNumber`, `CEDeclarationDate` | None |
| DoC management | ✅ **Implemented** | Document upload endpoints; compliance declaration PDF generation | None |

#### Due Diligence (Art. 11 / Arts. 48–52)

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| Supplier onboarding portal | ✅ **Implemented** | `/supplier/*` routes, supplier login/dashboard/upload, invitation workflow | None |
| Supplier document upload (CoC, audit, provenance) | ✅ **Implemented** | `supplier_documents` table; document upload with status review | None |
| Due diligence report PDF | ✅ **Implemented** | `due_diligence_pdf.go` generates multi-page A4 PDF | None |
| **OECD risk assessment workflow** | ⚠️ **Partial** | Supplier portal captures documents but no structured risk scoring, country flags, or conflict-minerals checks | **Gap:** No automated risk scoring engine (OECD Step 2/3) |
| **RMI/ICGLR template alignment** | ❌ **Not implemented** | No CMRT (Conflict Minerals Reporting Template) import or validation | **Gap:** Missing structured due-diligence templates |
| **Third-party audit integration** | ❌ **Not implemented** | No RMAP certificate verification or external audit API | **Gap:** Report flags this as critical for 2027 |

**Verdict:** Supplier portal and document capture are solid. The **due-diligence engine lacks depth** — no risk scoring, no CMRT/RMI integration, no automated country-risk flags. This is the largest EU compliance gap.

---

### 1.5 EU: DPP/ESPR (Textiles, Others) — P1

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| Flexible DPP framework | ✅ **Implemented** | `product_schemas` table, JSON Schema validation, `schema/registry.go` supports multiple product types | None |
| Textile DPP readiness | ⚠️ **Partial** | Separate `apps/textile-web` exists; battery codebase is battery-only | Not a gap within battery scope |
| EU DPP Registry interface | ❌ **Not implemented** | No registry API code | Expected — not operational yet |

**Verdict:** Architecture supports multi-product DPP. Textile implementation lives in separate apps.

---

### 1.6 EU: OECD Due Diligence (Arts. 48–52) — P0 (2027)

This is largely covered in 1.4 above. Additional items:

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| Chain-of-custody tracking | ⚠️ **Partial** | BOM `components` table tracks parent-child; but no mine-to-smelter chain | Gap |
| Risk categories (child labor, conflict zones) | ❌ **Not implemented** | No structured risk category data model | **Major gap** |
| Corrective action tracking | ❌ **Not implemented** | No workflow for supplier corrective actions | **Major gap** |
| **Omnibus 2025/1561 date update** | ✅ **Handled** | EU validator references 2023/1542; due diligence obligations are tracked | The code doesn't hard-code the old 2025 date |

---

### 1.7 EU: ECHA/REACH (SVHCs) — P2

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| SVHC screening (>0.1%) | ❌ **Not implemented** | No ECHA API integration, no SVHC list import, no automated screening | **Gap:** Report calls this P2 but notes it's mandated transparency |
| Hazardous substance tracking | ✅ **Implemented** | `HazardousSubstances` model (Pb, Hg, Cd) for REACH/RoHS; EU validator checks limits | Partial — only battery-specific substances, not full SVHC list |
| SDS linkage | ⚠️ **Partial** | Document upload supports SDS; no automated SDS parsing | Minor gap |

---

### 1.8 GS1 Digital Link / ISO 15459 — P1

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| GS1 UPI generation | ✅ **Implemented** | QR service encodes GS1 Digital Link when GTIN present | None |
| URI-based QR | ✅ **Implemented** | `qr_service.go` enriches URL with BPAN metadata | None |
| EU registry lookup compatibility | ⚠️ **Future-ready** | UPI registry not operational; structure is compatible | None |

---

### 1.9 Data Protection (GDPR/DPDP) — P1

| Report Requirement | Codebase Status | Evidence | Gap Assessment |
|---|---|---|---|
| User consent management | ⚠️ **Partial** | Auth system exists; no explicit consent management UI | Minor gap |
| Right of access/erasure | ⚠️ **Partial** | No dedicated GDPR/DPDP erasure workflow; soft-delete on passports | Gap |
| Data residency flagging | ❌ **Not implemented** | No data residency controls in tenant config | Gap |

---

### 1.10 Report Gap Analysis — What the Report Said Was Missing

The report (Section 4) identified these as "high-risk gaps" in the MD. Here is how the **current codebase** addresses each:

| Report Gap | Current Codebase Status |
|---|---|
| **Supplier Data/Portal** | ✅ **CLOSED** — Full supplier portal with login, dashboard, document upload, invitation workflow |
| **Document Extraction/Validation (DocAI)** | ⚠️ **Partially closed** — `pdf-extractor.ts` + Groq LLM (`ai_service.go`) for datasheet parsing and NL batch creation. No OCR for certificates. |
| **Carbon Footprint Calculation** | ✅ **CLOSED** — JRC-aligned calculator with A–G classes, declaration text, factor audit trail |
| **Regulatory Monitoring & Alerts** | ⚠️ **Partially closed** — Certificate expiry alerts (`alerts.go`) exist. **No regulatory newsfeed or automated policy update alerts.** |
| **Due-Diligence Engine** | ⚠️ **Partially closed** — PDF report generation exists. **No risk scoring, CMRT, or OECD workflow engine.** |
| **Carbon/ESG Accounting** | ⚠️ **Partially closed** — Carbon per batch. No full GHG inventory or offset planning. |
| **Textiles & Other Verticals** | ✅ **CLOSED architecturally** — Separate textile apps exist; schema engine supports multi-product |

---

## 2. Competitive Landscape Alignment

The report compares competitors across 5 capabilities. Here is where the codebase stands:

| Capability | ExportReady Codebase | Competitor Benchmark |
|---|---|---|
| Battery Passport (QR/AAS) | ✅ GS1 QR, EPCIS JSON-LD, VC signing, public pages | Matches Circularise, Circulor |
| Carbon LCA Reporting | ✅ JRC calculator, A–G class, declaration PDF | Matches Circulor, Minespider |
| Conflict Minerals / Due Diligence | ⚠️ Document portal + PDF report. **No risk scoring, no CMRT.** | Behind Minespider, Circulor |
| India EPR Integration | ✅ CPCB CSV export, EPR obligation calc, certificate ledger | **Unique differentiator** — none of the competitors have this |
| Regulatory Alerts | ⚠️ Certificate expiry only. **No policy/news alerts.** | Behind none (competitors also lack this) — but report planned it |

**Key insight:** The codebase has already achieved the report's proposed competitive differentiation ("dual India+EU focus"). The India EPR module is a genuine moat.

---

## 3. MVP Roadmap vs. Current Codebase

The report proposes a 3-phase MVP. The codebase has **already implemented most of Phase 1 and Phase 2**:

### Phase 1 (0–3 months): Foundations & India EPR

| Phase 1 Feature | Status |
|---|---|
| CPCB EPR portal connector | ⚠️ CSV export only (no live API) |
| Producer registry | ✅ Implemented |
| Supplier onboarding portal | ✅ Implemented |
| Basic QR code assignment | ✅ Implemented |
| CE/DoC doc registration | ✅ Implemented |
| EPR plan submission & collection tracking | ✅ Implemented |
| Carbon LCA engine design | ✅ Fully implemented |

### Phase 2 (3–6 months): EU Passport & ESG Modules

| Phase 2 Feature | Status |
|---|---|
| Battery Passport generator | ✅ Implemented |
| GS1 ID issuance | ✅ Implemented |
| QR code printing | ✅ Implemented |
| AAS/JSON-LD export | ✅ Implemented |
| Carbon LCA calculation | ✅ Implemented |
| Recycled-content documentation | ✅ Implemented |
| Due-diligence questionnaires | ⚠️ Basic document capture only |
| Risk scoring (OECD/ICGLR) | ❌ Not implemented |
| Central passport repository | ✅ Implemented |

### Phase 3 (6–12 months): Scaling & Expansion

| Phase 3 Feature | Status |
|---|---|
| Automated SVHC screening | ❌ Not implemented |
| Regulatory newsfeed | ❌ Not implemented |
| W3C VC signing | ✅ Implemented |
| Textile DPP features | ⚠️ In separate apps |
| Compliance analytics dashboard | ✅ Implemented |
| GDPR/DPDP features | ⚠️ Partial |

**Verdict:** The team has built approximately **70–80% of the report's 12-month roadmap** in the web + API stack.

---

## 4. Critical Gaps Requiring Attention

### 🔴 P0 — Must Fix Before 2027 Deadlines

| # | Gap | Risk | Recommended Action |
|---|---|---|---|
| 1 | **Registry integrations are all placeholders** | BIS/CPCB/EU NANDO/UN38.3 adapters return `self_declared` with no real API calls. Customers cannot verify certificates against official registries. | Prioritize CPCB and BIS API partnerships. EU NANDO can wait until closer to 2027. |
| 2 | **Due-diligence engine lacks OECD depth** | No risk scoring, no CMRT import, no country-risk flags, no corrective-action workflow. This is mandatory by Aug 2027. | Build structured supplier questionnaire (OECD Step 1), integrate CMRT/CRT templates, add country-risk flagging. |
| 3 | **No live CPCB portal submission** | EPR filing is CSV export only. Producers must manually upload to CPCB. | Build CPCB API integration or at minimum a filed-status tracking workflow. |

### 🟡 P1 — Important for Competitive Position

| # | Gap | Risk | Recommended Action |
|---|---|---|---|
| 4 | **No regulatory monitoring/newsfeed** | Customers miss regulatory changes (e.g. Omnibus delays, new delegated acts). | Add a "Regulatory Intelligence" module: scrape EU Official Journal, MoEF notifications, push alerts. |
| 5 | **No SVHC/ECHA screening** | REACH compliance requires transparency on ~200 SVHCs. | Integrate ECHA API or bulk-download candidate list; screen BOM materials against SVHCs. |
| 6 | **Mobile app is empty** | Field technicians, recyclers, and logistics partners need mobile access for scans and lifecycle updates. | `apps/battery-mobile` is a blank Expo scaffold. Implement QR scanning, passport lookup, and lifecycle transitions. |
| 7 | **Desktop app is a thin shell** | `apps/battery-desktop` has page stubs but no real functionality beyond auth and layout. | Either deprecate or invest in offline-capable desktop features (e.g. factory-floor QR printing without internet). |
| 8 | **GDPR/DPDP erasure workflows** | Legal risk if users cannot request data deletion. | Implement tenant-level data export and erasure endpoints. |

### 🟢 P2 — Future Enhancement

| # | Gap | Risk | Recommended Action |
|---|---|---|---|
| 9 | **No RMAP/third-party audit integration** | Due diligence credibility depends on third-party verification. | Partner with RMI or build audit certificate upload/verification workflow. |
| 10 | **Carbon calculator is not dynamic LCA** | Current model uses fixed JRC factors. Real LCA requires supplier-specific primary data. | Build upstream data collection API for suppliers to submit primary energy/material data. |
| 11 | **No investment commitment tracking (PLI)** | PLI-ACC requires ₹225 Cr/GWh proof. | Add capex/opex tracking module for PLI beneficiaries. |

---

## 5. Architecture & Technical Observations

### Strengths
- **Product-agnostic schema engine** (`product_schemas`, JSONB specs) future-proofs for textiles/electronics.
- **Tamper-proof audit chains** — SHA-256 linked events, OpenTimestamps blockchain anchoring.
- **W3C Verifiable Credentials** — Ed25519 `did:key` signing is production-ready.
- **Dual-market validation** — India + EU validators run in parallel for GLOBAL batches.
- **Async export worker** — Background jobs for QR ZIP, PDFs, CSVs without blocking HTTP.
- **Comprehensive i18n** — 24 locales including Hindi, Tamil, Telugu, Gujarati.

### Weaknesses
- **Placeholder registry adapters** undermine trust claims. The UI shows "verified" badges but data is self-declared.
- **No event-driven architecture** — Compliance checks run synchronously or on timers; no pub/sub for real-time updates.
- **Monolithic backend** — Single Go binary; may struggle to scale independent modules (e.g. telemetry ingestion vs. compliance checking).
- **Limited test coverage on compliance validators** — Only `india_test.go` and `eu_test.go` exist; gap scenarios (e.g. edge thresholds) may be untested.

---

## 6. Conclusion

The battery codebase is **far more mature than the deep-research-report assumes.** The report reads like a requirements doc for a product that did not yet exist; the codebase has already implemented the vast majority of P0 and P1 features. 

**Where the report and codebase diverge:**
1. The report treats supplier portal, carbon calculator, and battery passport as "gaps" — they are all **built and working**.
2. The report's competitive analysis positions ExportReady as "planned" — the codebase is already at or near parity with Circularise/Circulor on passport and carbon, and **ahead on India EPR**.
3. The report's 12-month roadmap is **~70% complete** in the web/API stack.

**Where the codebase genuinely falls short of the report's vision:**
1. **Live regulatory integrations** (all placeholders).
2. **Due-diligence depth** (no risk engine, no CMRT).
3. **Regulatory intelligence** (no automated policy monitoring).
4. **Mobile and desktop parity** (mobile is empty, desktop is thin).
5. **SVHC screening** (no ECHA integration).

**Recommendation:** Update the deep-research-report to reflect the current codebase maturity. Shift focus from "build the foundation" to **"harden integrations and close the due-diligence gap before 2027."** The highest ROI investments are: (1) real CPCB/BIS APIs, (2) OECD due-diligence workflow engine, and (3) a functional mobile app for field operations.
