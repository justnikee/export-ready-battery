# Document 3: Regulatory Compliance Mapping — EU & India
## ExportReady — How the Code Satisfies Legal Requirements
**Source files:** `compliance/battery/eu.go`, `compliance/battery/india.go`, `services/compliance_score.go`, `services/carbon_calculator.go`, `lib/activation-blockers.ts`, `models/models.go`

---

## Part A: EU Battery Regulation 2023/1542 Mapping

### Overview

The EU Battery Regulation (Regulation (EU) 2023/1542, in force since 17 August 2023) repeals Directive 2006/66/EC and establishes a comprehensive DPP framework. Key implementation dates:
- **EV batteries >2 kWh**: DPP required from **18 February 2027**
- **Industrial batteries >2 kWh / LMT batteries**: DPP required from **18 February 2027**
- **SLI batteries**: DPP required from **18 August 2028**

---

### A.1 EU Regulation Requirements vs. ExportReady Implementation

| Regulation Article | Legal Requirement | ExportReady Implementation | Status |
|---|---|---|---|
| **Art. 2(1)** — Battery categories | Classify battery as: EV, LMT, Industrial, Portable, SLI | `BatchSpec.battery_category` field with enum validation. Activation blocker if missing for EU market. | ✅ Implemented |
| **Art. 6** — REACH/RoHS hazardous substances | Declare presence of lead, mercury, cadmium; provide exemptions | `BatchSpec.hazardous_substances` (lead_present, mercury_present, cadmium_present, declaration, exemptions). Activation blocker if declaration missing. | ✅ Implemented |
| **Art. 7** — Carbon footprint declaration | Declare lifecycle carbon footprint in kgCO2e/kWh; assign performance class A–G | JRC 2024 methodology `CarbonCalculatorService`. Outputs `total_kg_co2e`, `per_kwh_kg_co2e`, carbon class A–G (thresholds: A≤40, B≤60, C≤80, D≤100, E≤120, F≤150, G>150). Result stored as `carbon_footprint_result` JSONB. EU compliance attribute EU-44, EU-45. | ✅ Implemented |
| **Art. 8** — Recycled content targets | Declare recycled % for cobalt, lithium, nickel, lead. 2030 targets: Co≥16%, Li≥6%, Ni≥6%, Pb≥85% | `MaterialComposition.recycled_cobalt/lithium/nickel/lead_pct`. DB-configurable thresholds via `compliance_rules` table (defaults: Co=16%, Li=6%, Ni=6%, Pb=85%). EU attributes EU-38 to EU-42. Warning if targets not met. | ✅ Implemented |
| **Art. 10** — Warranty | Declare warranty period | `BatchSpec.warranty_months`. Activation blocker if ≤0. EU attribute EU-17. | ✅ Implemented |
| **Art. 11** — Supply chain due diligence | Declare due diligence policy and supply chain tiers | `SupplyChainProvenance` (due_diligence_policy URL, tiers with material/supplier/country/certification). OECD 5-step supplier assessments. CMRT parsing. EU attributes EU-51, EU-52. | ✅ Implemented |
| **Art. 14** — Circularity | Track circularity status: original, repurposed, reused, remanufactured, waste | `Passport.circularity_status` with DB constraint. Lifecycle actions REMANUFACTURE, REUSE, REPURPOSE. EU Art. 14 / Annex XIII(4c). | ✅ Implemented |
| **Art. 17** — Conformity certifications | Declare certifications (CE, UL, IEC, etc.) | `BatchSpec.certifications[]` string array. EU attribute EU-46. CE marking field on Batch. | ✅ Implemented |
| **Art. 38** — EU Authorized Representative | Identify EU-based authorized representative with name, address, contact | `BatteryProfileUpdate.eu_authorized_representative_name/address`, `eu_contact_email` on `battery_tenant_profiles`. Activation blocker if any missing for EU market. EU attributes EU-11 to EU-15. | ✅ Implemented |
| **Art. 39** — Supply chain due diligence (minerals) | OECD-aligned due diligence for cobalt, lithium, nickel, manganese, graphite | `SupplyChainProvenance.tiers[]`, `SupplierCMRTReport` (smelter tracking, RMI conformance), `CorrectiveAction` tracking. Due diligence OECD 5-step: policy → identify → assess → respond → audit. | ✅ Implemented |
| **Art. 48** — Supply chain information | Disclose supply chain tier structure | `SupplyChainProvenance.tiers[]` with material, supplier, country, certification_body. EU attribute EU-52. | ✅ Implemented |
| **Art. 57** — Dismantling information | Provide disassembly guide, safety steps, recycler URL | `BatchSpec.disassembly_guide` (document_url, steps[], tools_required[], hazards[], safety_guidelines[], eol_instructions, recycler_url). EU attributes EU-53 to EU-56. | ✅ Implemented |
| **Art. 78** — Regulator access | Regulator access to geolocation and sensitive data | Dedicated `regulatorAPIKey` env var; scoped access patterns in `access_views.go`. GDPR note on geolocation. | ✅ Implemented |
| **Annex IV** — Performance data | Declare: rated capacity (Ah/Wh), voltage (rated/min/max), internal resistance, C-rates, operating temp, SoH threshold, round-trip efficiency, electrode materials | `BatchSpec.PerformanceSpec` (rated_capacity_ah, rated_capacity_wh, rated_voltage, min_voltage, max_voltage, internal_resistance_mohm, max_charge/discharge_c_rate, operating_temp_min/max_c, capacity_at_80_soh_ah, round_trip_efficiency_pct, cathode_material, anode_material). EU attributes EU-18 to EU-31. | ✅ Implemented |
| **Annex XIII** — DPP data attributes | BatteryPass consortium's 56-attribute checklist | `buildBatteryAttributeChecklist()` in `services/compliance_score.go` — evaluates EU-1 through EU-56 with regulation references. | ✅ Implemented |
| **QR Code / GS1 Digital Link** | Machine-readable DPP access via QR code using GS1 DL standard | `BatchSpec.GTIN` + `Batch.GTIN` (14-char GS1 DL GTIN). QR service (`services/qr_service.go`). Battery Passport ID in EU Implementing Reg 2024/1715 format. | ✅ Implemented |
| **Verifiable Credentials** | Tamper-evident data integrity | W3C VC Ed25519/DID-LD proofs (`services/vc_crypto_service.go`). OpenTimestamps Bitcoin anchoring for certificates. SHA-256 chained event hash in `passport_events`. | ✅ Implemented |

---

### A.2 EU Compliance Score (56-Attribute Checklist)

The `CalculateComplianceScore()` function in `services/compliance_score.go` evaluates 56 attributes across 8 categories:

| Category | Attributes | EU References |
|---|---|---|
| General Information | EU-1 to EU-10 | Art. 2(1), Art. 38(7), Annex IV |
| EU Representative | EU-11 to EU-15 | Art. 38 |
| Performance & Durability | EU-16 to EU-31 | Annex IV, Art. 10 |
| Material Composition | EU-32 to EU-37 | Art. 8 |
| Recycled Content | EU-38 to EU-42 | Art. 8 |
| Carbon Footprint | EU-43 to EU-45 | Art. 7, Art. 7(3) |
| Certifications | EU-46 | Art. 17 |
| Hazardous Substances | EU-47 to EU-50 | Art. 6, REACH |
| Supply Chain | EU-51 to EU-52 | Art. 39, Art. 48 |
| Disassembly & Recycling | EU-53 to EU-56 | Art. 57 |

**Score calculation:** `score = (filled / total) × 100`. Default 56 attributes; score is persisted on the batch as `compliance_score`.

---

### A.3 Missing / Partial EU Compliance Features

> [!WARNING]
> The following EU requirements have partial or planned (not fully live) implementations:

| Gap | Description | Severity |
|---|---|---|
| **EU DPP Registry** | EU 2023/1542 Art. 77 requires registration in the EU Battery DPP Registry. No registry submission endpoint is implemented. | **HIGH** |
| **Notified Body Integration** | CE Marking notified body number is stored (`notified_body_number`) as free-text on batch creation. A scrape-based NANDO verification adapter exists (`integrations/registry/eu_nando_adapter.go`) and is registered in `NewAdapterRegistry()` alongside BIS, CPCB, and UN38.3 adapters. It scrapes the EU NANDO public database, validates 4-digit body number format, uses a circuit breaker, and returns `TrustTierRegistry` on success. **If `EUNANDO_BASE_URL` env var is not set, the adapter degrades gracefully to `TrustTierSelfDeclared`.** The gap is therefore limited to: the activation gate does not block on NANDO result — it is advisory only. | LOW |
| **EU Ecodesign / LCA Full Scope** | Art. 7 requires lifecycle LCA beyond the 4 phases currently modelled (missing: end-of-life transport, material production). | MEDIUM |
| **GDPR Right-to-Erasure** | `deleted_at` soft delete is present but permanent erasure of personal data (owner email, geolocation) is not explicitly handled. | MEDIUM |
| **Portable Battery Recycling Collection Targets** | Art. 59 collection rate reporting is not implemented. | LOW |

---

## Part B: Indian Battery Waste Management Rules 2022 + Ancillary Regulations

### B.1 India Regulatory Framework

| Regulation | Authority | Scope |
|---|---|---|
| Battery Waste Management Rules 2022 (BWMR) | MoEFCC / CPCB | EPR obligations, collection, recycling targets |
| BIS CRS IS 16046 | BIS | Mandatory certification for lithium-ion batteries |
| AIS-156:2022 | MoRTH | Traction battery type-approval for EVs |
| AIS-038 Rev.2 | MoRTH | Battery safety standards for EVs |
| PLI Scheme Phase II (ACC) | NITI Aayog / MHI | ≥50% DVA for PLI subsidy eligibility |
| Foreign Trade Policy / DGFT | DGFT | IEC code, RODTEP/RoSCTL incentive claims |
| Customs Act 1962 | CBIC | Bill of Entry, HSN classification |

---

### B.2 India Regulation Requirements vs. ExportReady Implementation

| Regulation | Requirement | ExportReady Implementation | Status |
|---|---|---|---|
| **BWMR 2022 — EPR** | Manufacturer/importer must register with CPCB; track EPR obligations by financial year and category | `epr_obligations` table (obligation_kg, fulfilled_via_recycling/refurbishment_kg, net_obligation, shortfall, ECC). CPCB Form 3 **CSV** export (`cpcb_export_handler.go` → `cpcb_export_service.go`): file `CPCB_Form3_<FY>.csv` with 11 columns (Producer Name, EPR Reg No, FY, Battery Category, Produced kg, Collection Target %, etc.) for direct regulatory submission. EPR certificate upload and status tracking. Activation blocker: EPR number must be in format `B-XXXXX/YYYY-YY/CPCB`. | ✅ Implemented |
| **BIS CRS IS 16046** | Mandatory type-testing and R-number for lithium-ion batteries | `BatchSpec.bis_number` (format `R-XXXXXXXX`). `bis_certificate_issue_date` required for activation. BIS R-number on `battery_tenant_profiles`. Certificate upload with status tracking (NOT_UPLOADED, PENDING, VERIFIED). | ✅ Implemented |
| **AIS-156:2022** | MoRTH type-approval for traction batteries | `specs.certifications` must include `AIS-156`. `morth_manufacturer_code` on tenant profile required for activation. | ✅ Implemented |
| **AIS-038 Rev.2** | Safety standard for EV batteries | `specs.certifications` must include `AIS-038`. Hard activation blocker. | ✅ Implemented |
| **UN 38.3** | Transport safety test for lithium cells/batteries | `specs.un38_3_test_date` required for activation. `specs.un38_3_lab_name` stored. | ✅ Implemented |
| **IEC 62133** | Portable battery safety | `specs.iec_62133_test_date` required for activation. | ✅ Implemented |
| **MSDS** | Material Safety Data Sheet declaration | `specs.msds_issue_date` required for activation. | ✅ Implemented |
| **PLI Phase II — DVA ≥50%** | Domestic Value-Add must be ≥50% for PLI subsidy | DVA calculator (MHI PLI-ACC formula): `CellCostDomesticINR + BMSCostDomesticINR + CasingCostDomesticINR + LabourOverheadCostINR / total_cost`. `dva_source`: ESTIMATED or AUDITED. PLI threshold: 50%. Warning if `pli_compliant=true` and DVA < 50%. Server forces DVA=0 for IMPORTED cells. | ✅ Implemented |
| **Customs Act — Bill of Entry** | Required for imported cells: BoE number, country of origin, import date | `bill_of_entry_no`, `country_of_origin`, `customs_date` — all mandatory activation blockers for IMPORTED cell source. | ✅ Implemented |
| **DGFT — IEC Code** | Import-Exporter Code for DGFT claims | `iec_code` stored on `battery_tenant_profiles`. Regex validated: 5 uppercase letters + 4 digits + 1 letter = 10 chars (e.g., `AAAPL1234C`). Activation blocker. | ✅ Implemented |
| **DGFT — RODTEP/RoSCTL** | Duty remission scheme claims for exporters | `dgft_claims` table with scheme_type, HSN code, export value/quantity, claim period, estimated claim amount. Document assembly service. | ✅ Implemented |
| **HSN Code — Chapter 85** | HS 8507xxxx classification for batteries | `BatchSpec.hsn_code`. Validation regex: `^8507[0-9]{4}$`. | ✅ Implemented |
| **BWMR 2022 — Recycling Targets** | Declare recycled content; track recycler EPR ID | `Passport.recycler_epr_id`, `recycling_date`. EPR certificates from CPCB-registered recyclers. | ✅ Implemented |
| **Reward System** | Consumer incentives for return/recycling | `reward_ledger` table — action types: SCAN_INSTALL, SCAN_RECYCLE, SCAN_RETURN, BONUS, REDEMPTION. Points earned per action. | ✅ Implemented |

---

### B.3 Missing / Partial India Compliance Features

> [!WARNING]
> The following Indian regulatory requirements have partial or absent implementations:

| Gap | Description | Severity |
|---|---|---|
| **CPCB EPR Portal Integration** | BWMR 2022 requires annual filing with CPCB portal. CPCB export generates a report PDF but no direct API submission to CPCB's portal. | **HIGH** |
| **DGFT Icegate Integration** | Shipping bill lookup and automatic pre-filled claim documents from DGFT Icegate are not implemented. | MEDIUM |
| **PLI Scheme — MHI Portal Submission** | PLI certificate management is implemented but no direct submission to MHI's PLI portal. | MEDIUM |
| **AIS-049 (BMS Software)** | No specific AIS-049 compliance field for battery management system software version/certification. | LOW |
| **Hazardous Waste Rules** | No tracking for lead-acid battery end-of-life under Hazardous Waste Management Rules 2016. | LOW |

---

## Part C: Cross-Jurisdictional Summary

| Feature | India Implementation | EU Implementation |
|---|---|---|
| DPP serial number | BPAN V2: `IN-MFR-CHEM-YYYY-NNNNN` | BPAN V2 + Battery Passport ID (EU Reg 2024/1715) |
| Carbon data | Stored for reference | JRC 2024 calculator + A–G class assignment |
| Material composition | BIS numbers on components | Full % breakdown (Co, Li, Ni, Mn, Gr, Pb) + recycled % |
| Regulatory certificates | BIS, EPR, PLI (uploaded + status) | DoC, CE marking, notified body number |
| End-of-life | EPR obligation tracking + recycler EPR ID | Circularity status (ORIGINAL/REPURPOSED/REUSED/REMANUFACTURED/WASTE) |
| Immutability | Chained SHA-256 event hash + OpenTimestamps | W3C VC Ed25519 LD-Proof + OpenTimestamps |
| Supply chain | Bill of Entry + DVA breakdown | OECD 5-step + CMRT smelter tracking |

---

*End of Document 3*
