# Textile Digital Product Passport (DPP) Blueprint
## For Indian Manufacturers Exporting to the European Union

**Version:** 1.1  
**Date:** June 2026  
**Status:** Strategic blueprint — verified against current codebase and June 2026 regulations  
**Related documents:**
- `docs/textile_schema_gap_analysis.md` — full SQL schema gap analysis (directionally correct, reviewed)
- `docs/TEXTILE_CLEANUP_PLAN.md` — cleanup items (partially outdated, reviewed)
- `docs/DPP_COMPETITIVE_ANALYSIS_ROADMAP.md` — execution roadmap vs. codebase
- `dpp-competitive-analysis.agent.final/dpp-competitive-analysis.agent.final.md` — market research

---

## 1. Executive Summary

The EU textile Digital Product Passport is not yet legally mandatory, but the regulatory path is now clear enough that Indian exporters must treat **2027–2029 as the compliance window**. The combination of the **India–EU FTA** (concluded January 2026, expected entry into force late 2026 / early 2027) and the **Ecodesign for Sustainable Products Regulation (ESPR)** means DPP compliance will become the new non-tariff barrier for Indian textiles entering Europe.

ExportReady / AnvayaLabs already has a functioning textile-api and textile-web scaffold, but it is currently a **traceability platform with significant battery-derived schema debt**, not a regulation-ready textile DPP platform. This blueprint bridges that gap: it defines the minimum viable architecture, data model, compliance engine, and rollout plan to make the textile product line EU-market-ready for Indian manufacturers.

### Key conclusions

| Theme | Finding |
|---|---|
| **Regulatory deadline** | Textile DPP likely mandatory **late 2028 to mid-2029** (ESPR delegated act adoption mid-2027 + 18–24 month transition). |
| **Market window** | India–EU FTA removes 8–12% textile tariffs; DPP becomes the new gate. Current Indian textile exports to EU ≈ USD 7.2B, with potential to grow to USD 30–40B. |
| **Platform maturity** | Core platform (tenants, batches, passports, QR, audit chain, billing) is solid. However, the **regulatory payload layer** is missing and the schema still carries battery-specific columns/migrations. |
| **Biggest gaps** | (1) GS1 Digital Link / UPI, (2) structured fiber & recycled-content data, (3) REACH/SVHC/SCIP chemical tracking, (4) tiered supplier traceability, (5) ecodesign scores, (6) EPR & destruction-ban reporting, (7) EU DPP Registry integration, (8) removal of battery schema debt from textile-api. |
| **Winning positioning** | **Dual-use compliance**: one data collection effort satisfies India domestic EPR/textile traceability and EU DPP. This is the moat global platforms cannot copy. |

---

## 2. Regulatory Landscape (Current as of June 2026)

### 2.1 ESPR — the framework

- **Regulation (EU) 2024/1781** entered into force **18 July 2024**.
- It is a *horizontal framework*: it creates the legal basis for delegated acts per product group but does not set product-specific requirements itself.
- **Textiles/apparel** is a first-wave priority in the ESPR Working Plan 2025–2030 (COM(2025) 187).

### 2.2 JRC Preparatory Study — what the DPP will likely contain

The Joint Research Centre (JRC) preparatory study on apparel textiles reached its **third milestone in December 2025**, with the final study expected **June 2026**. The Commission is expected to launch an impact assessment consultation, then draft the **Textiles Delegated Act for adoption around mid-2027**, followed by an **18+ month transition period**.

Likely mandatory DPP data categories (based on JRC milestone 3 and Commission direction):

| Data category | Why it matters for Indian exporters |
|---|---|
| **Product identification** | GTIN/UPI, manufacturer, EU importer, EU authorized representative, facility GLN. |
| **Fiber composition** | Fiber type + % by weight, recycled content %, certified content (GOTS/GRS/BCI), origin country. |
| **Chemical compliance** | REACH SVHC >0.1% w/w, Annex XVII restricted substances (azo dyes, phthalates, PFAS), SCIP notification. |
| **Supply chain traceability** | Tier 1–2+ suppliers, facility identifiers, processing stages (spinning, knitting, weaving, dyeing, finishing, cut/sew). |
| **Ecodesign scores** | Robustness (0–10), recyclability (0–10), recycled content thresholds, manufacturing footprint. |
| **Environmental performance** | Carbon footprint (PEFCR/apparel), water use, energy use, microplastic shedding (when method harmonized). |
| **End-of-life / EPR** | Recycling instructions, take-back info, EPR registration, eco-modulation data. |
| **Multi-language access** | Public/B2B/authority tiers; official EU languages where sold. |

### 2.3 EU Textile EPR Directive (Waste Framework Directive amendment)

- **Directive (EU) 2025/1892** adopted September 2025; entered into force **16 October 2025**.
- All EU Member States must establish textile EPR schemes by **17 April 2028**.
- Producers (including non-EU companies selling into the EU via importer or direct) must register with national producer registers / PROs and report quantities placed on the market.
- Fees will be **eco-modulated** based on durability, repairability, and recyclability — directly rewarding products with better DPP data.

### 2.4 REACH & chemical compliance

- **REACH (EC 1907/2006)** is the immediate gate. SVHC >0.1% w/w triggers Article 33 communication and **SCIP database** notification.
- **PFAS**: broad restriction proposal advancing through ECHA; final adoption expected around **2027**, with 18-month transition. Textile water/stain repellency is a major use case.
- **Annex XVII**: azo dyes (30 mg/kg limit), phthalates (0.1% sum), heavy metals, flame retardants.

### 2.5 CSDDD — supply chain due diligence

- **Directive (EU) 2024/1760** (CSDDD) requires large EU companies to conduct human rights and environmental due diligence across supply chains.
- **Omnibus I** (February 2026) narrowed scope significantly: first wave applies from **July 2029** to companies with 5,000+ employees / €1.5B+ turnover; due diligence scope is primarily **Tier 1** suppliers.
- Indian suppliers to large EU brands will be asked for labor, environment, and governance data even if not directly in scope.

### 2.6 ECGT — green claims

- **Directive (EU) 2024/825** bans generic environmental claims ("eco-friendly", "green") and requires substantiation in the DPP.
- Climate neutrality claims based on offsetting are banned; self-certified sustainability labels are banned.

### 2.7 India–EU FTA

- Concluded **27 January 2026**; ratification expected late 2026 / early 2027.
- Eliminates EU textile tariffs of **8–12%** immediately for most Indian textile lines.
- Rules of origin require **substantial transformation** in India (weaving/knitting + cut/sew typically qualifies; simple cut/sew of imported fabric may not).
- DPP compliance will sit alongside rules-of-origin documentation as a non-tariff market-access condition.

---

## 3. Current Platform Assessment — Verified Against Codebase

### 3.1 What already exists

| Capability | Status | Notes |
|---|---|---|
| Multi-tenant architecture | ✅ Built | `tenants`, `team_members`, `api_keys`, RBAC, OAuth. |
| Batch & passport lifecycle | ✅ Built | `batches`, `passports`, `passport_events`, hash-chained audit trail. |
| QR codes / scanning | ✅ Built | UUID-based URLs; not yet GS1 Digital Link. |
| Textile-specific batch spec | ✅ Built | `BatchSpec` with fiber composition, supplier tier, ZDHC, labor compliance. |
| Dual-market compliance engine | ✅ Partial | `textile/eu.go` and `textile/india.go` validators exist, but rules are basic. |
| Carbon calculator | ✅ Built | `textile_carbon_calculator.go`. |
| CSV bulk import | ✅ Built | 23 fields, 500-row preview. |
| Document storage / SHA256 | ✅ Built | `passport_documents`. |
| Billing / Razorpay | ✅ Built | Quota-based passport activation. |
| Dashboard pages (exports, analytics, dispatch, billing) | ✅ Built | No longer `UnderDevelopment` stubs; real components exist. |
| Terms / privacy pages | ✅ Built | Already rewritten for textile. |
| Auth / OAuth fallback | ✅ Fixed | Already defaults to `TEXTILE`; JWT issuer is `anvayalabs-textile`. |
| Batch label dialog | ✅ Fixed | Already textile-focused ("Download Product Tags"). |
| Passport template config | ✅ Fixed | Already textile-only; no battery configs. |

### 3.2 Remaining battery-derived debt (verified)

| Location | Issue | Severity |
|---|---|---|
| `services/textile-api/internal/db/migrations/000004_add_dual_mode.up.sql` | Migration comments reference "Battery Aadhaar", "Battery Passport", "BPAN", "Cobalt, Lithium, Nickel, Lead". Adds `cell_source`, `pli_compliant`, `domestic_value_add`. | Medium |
| `services/textile-api/internal/db/migrations/000007_add_india_compliance.up.sql` | Comments reference "BWM Rules 2022", "IS 16046", "imported battery cells/packs". Adds `bill_of_entry_no`, `customs_date`. | Medium |
| `services/textile-api/internal/db/migrations/000055_move_battery_fields_to_specs.up.sql` | Moved battery fields to `specs` JSONB but **did not drop the columns**. They remain as a safety net. | High |
| `services/textile-api/internal/db/migrations/000057_add_eu_battery_passport_fields.up.sql` | Added `ce_marking`, `notified_body_number`, `carbon_performance_class`, `removable_and_replaceable`, `battery_passport_id` to textile-api. These are EU Battery Regulation fields, not textile. | **Critical** |
| `services/textile-api/cmd/migrate/main.go` | `expectedColumns` still checks battery-specific columns: `cell_source`, `dva_source`, `pli_certificate_url`, `hsn_code`, `bis_number`, `epr_number`, `audited_domestic_value_add`. | High |
| `apps/textile-web/app/docs/page.tsx` | Still titled "AnvayaLabs-Battery Documentation", mentions "Digital Battery Passports", "EU Battery Regulation", "DVA Calculator", imports `Battery` icon. | High |
| `apps/textile-web/context/auth-context.tsx` | Contains `morth_manufacturer_code` and `morth_factory_codes` (MoRTH = automotive battery); `pli_certificate_path`/`pli_status` are battery PLI scheme fields. | Medium |

### 3.3 Critical gaps vs. EU DPP readiness

| Gap | Why it blocks EU access | Current state |
|---|---|---|
| **GS1 Digital Link / UPI** | EU DPP requires persistent, interoperable product identifiers. | QR URLs are proprietary `/p/{uuid}`. No GTIN/UPI field. |
| **Structured fiber & recycled content** | Fiber composition must be per-product, per-fiber, with recycled % and certification evidence. | `FiberComposition` is a flat struct inside `specs` JSONB; no certified content or origin tracking. |
| **REACH / SVHC / SCIP** | Chemical data is a hard gate; SVHC >0.1% must be declared and notified. | `HazardousSubstances` is a minimal boolean struct; no CAS numbers, no SCIP workflow. |
| **Tiered supplier traceability** | ESPR Art. 9 requires facility-level identifiers to tier 2+. | `SupplierTier` is six string fields; no GLN, no audit status, no CSDDD risk scoring. |
| **Ecodesign scores** | JRC milestone 3 proposes robustness, recyclability, recycled content thresholds. | No scoring tables or logic. |
| **EPR / end-of-life** | EU Textile EPR requires PRO registration and eco-modulation data by 2028. | No EPR tables. |
| **Multi-language DPP** | Public DPP must be available in official languages of sale. | Only en/de/fr i18n exists; no structured DPP translation model. |
| **EU DPP Registry (EREVS)** | Must submit UPI + data access point URL to registry. | No submission tracking. |
| **Declaration of Conformity / ECGT** | Legal statement of compliance; green claims validation. | No DoC or claims governance. |

---

## 4. Verification of Existing Reference Documents

### 4.1 `docs/textile_schema_gap_analysis.md`

**Verdict: Directionally accurate, but incomplete.**

- ✅ Regulatory dimensions and data categories align with June 2026 ESPR/JRC direction.
- ✅ The 21 proposed tables are the right architectural target for a full EU textile DPP.
- ⚠️ It states the existing schema covers "~11%" of the regulatory data model. This is plausible but the analysis understates the **battery-derived schema debt** already present in `textile-api` (e.g., `battery_passport_id`, `ce_marking`, `removable_and_replaceable`).
- ⚠️ Some proposed thresholds (e.g., 20% recycled cotton in denim, 15% recycled polyester) are **JRC proposals**, not final delegated-act requirements. The blueprint below treats them as indicative.
- ⚠️ It does not account for the fact that several dashboard features it lists as "missing" are now built.

**Recommendation:** Use the schema gap analysis as the **target data model reference**, but do not treat the implementation priority order as gospel. The first priority must be schema cleanup + product identification + fiber composition, not a literal Phase 1–6 sequence.

### 4.2 `docs/TEXTILE_CLEANUP_PLAN.md`

**Verdict: Significantly outdated.**

Many items listed as critical/cleanup have already been fixed:

| Cleanup plan claim | Verified reality |
|---|---|
| JWT issuer is `anvayalabs-battery` | ✅ Already `anvayalabs-textile` |
| `battery_tenant_profiles` in migration checker | ✅ List has `textile_tenant_profiles`; issue is battery *columns* in `expectedColumns` |
| OAuth fallback `"BATTERY"` | ✅ Already `"TEXTILE"` |
| `create-batch-dialog.tsx` battery form | ✅ File does not exist |
| `manual-soh-entry.tsx` | ✅ File does not exist |
| `dva-calculator.tsx` | ✅ File does not exist |
| `DownloadLabelsDialog.tsx` battery copy | ✅ Already textile-focused |
| `/terms`, `/privacy` battery content | ✅ Already rewritten for textile |
| `dashboard-layout-shell.tsx` battery path check | ✅ Cleaned |
| `passport-template-config.ts` battery configs | ✅ Already textile-only |
| `/blog/[slug]/page.tsx` battery CTA | ✅ Already textile-focused |
| `BATTERY_ACTION_CONFIG` dead code | ✅ Already removed |

**However, the cleanup plan misses newer, more serious issues:**
- Battery-specific migrations in `textile-api` (000057 especially).
- `cmd/migrate/main.go` still checking battery columns.
- `/docs/page.tsx` still battery-focused.
- `auth-context.tsx` still carries `morth_*` automotive-battery fields.

**Recommendation:** Do not execute the cleanup plan as written. Use the **accurate cleanup list in Section 5.1** of this blueprint instead.

---

## 5. Blueprint Architecture

### 5.1 Design principles

1. **Clean schema first**. Remove or migrate battery-specific columns/migrations from `textile-api` before adding EU textile DPP tables.
2. **Regulatory payload layer on top of existing platform**. Reuse tenants, batches, passports, QR, audit chain, billing. Add DPP-specific tables without rebuilding the core.
3. **Dual-use compliance by default**. Every data field should serve both India domestic rules and EU DPP where possible.
4. **GS1 Digital Link as the primary data carrier**. Move from proprietary UUID URLs to `https://id.gs1.org/01/{GTIN}/21/{SN}` or a GS1 resolver pattern.
5. **Tiered access control**. Public / B2B / authority data tiers baked into the schema and API.
6. **MSME-first onboarding**. Mobile PWA for informal suppliers, Tally integration, regional languages, DGFT TRACE subsidy documentation.

### 5.2 Phase 0: Accurate cleanup prerequisites ✅ COMPLETED

The following cleanup was executed and verified (tests green, frontend build green):

**Backend (`services/textile-api`)**
1. Removed battery-only fields from Go models and API payloads:
   - `Batch`: `pli_compliant`, `domestic_value_add`
   - `CreateBatchRequest` / `PatchBatchRequest`: `cell_source`, `bill_of_entry_no`, `customs_date`, `domestic_value_add`, `dva_source`, `audited_domestic_value_add`, `pli_certificate_url`, `pli_compliant`
   - `PassportWithSpecs`: `cell_source`, `bill_of_entry_no`, `customs_date`, `domestic_value_add`, `pli_compliant`, `dva_source`
2. Updated `internal/repository/batch.go`, `passport.go`, `internal/handlers/batch_handlers.go`, `external_handlers.go` to stop reading/writing battery columns.
3. Removed battery-only validation logic (`ValidateDVASource`, `ValidatePLICompliance`) and battery parameters from `ValidateIndiaCompliance`.
4. Removed battery metadata parsing from `CSVService` and `upload_handlers.go`; CSV samples now use textile-relevant headers.
5. Updated `cmd/migrate/main.go` `expectedColumns` to check only textile-relevant columns.
6. Re-commented battery-only migrations so fresh installs skip them: `000004`, `000007`, `000025`, `000040`, `000055`, `000057`. India-generic fields (`country_of_origin`, `hsn_code`, `bis_number`, `epr_number`) are retained.

**Frontend (`apps/textile-web`)**
7. Removed `morth_*` and `pli_*` fields from `context/auth-context.tsx`.
8. Rewrote `app/docs/page.tsx` from battery to textile content and replaced the `Battery` icon with `Shirt`.
9. Removed battery-specific compliance checks from `components/batches/batch-details-page.tsx`.
10. Added missing `switch.tsx` / `slider.tsx` UI primitives and relaxed `Tabs.defaultValue` requirement to unblock the build.

**Verification**
- `cd services/textile-api && go test ./...` — all green.
- `cd apps/textile-web && npm run build` — succeeds.
- `cd apps/textile-web && npm test` — 82 tests pass.

### 5.3 Core data model additions

The following additions are required. Full SQL is available in `docs/textile_schema_gap_analysis.md`; this section summarizes the architectural intent.

#### Product identification & economic operators

```
batches
  gtin VARCHAR(14)
  upi VARCHAR(50)
  taric_code VARCHAR(10)
  cn_code VARCHAR(10)
  hs_code VARCHAR(10)
  gs1_digital_link_uri TEXT
  product_category VARCHAR(50)
  apparel_subcategory VARCHAR(50)

economic_operators
  operator_type: MANUFACTURER | IMPORTER | DISTRIBUTOR | EU_REPRESENTATIVE | FULFILMENT_SERVICE_PROVIDER
  legal_name, trade_name, vat_number, eori_number, address, gln

batch_economic_operators
  role per batch: MANUFACTURER | IMPORTER_OF_RECORD | EU_AUTHORIZED_REP
```

**Why:** ESPR Art. 9 and Annex III require UPI + full economic-operator identification. Indian manufacturers exporting directly or via an importer must record the EU importer; if selling direct-to-consumer, an EU authorized representative is required.

#### Material composition

```
fiber_types              -- master reference
batch_material_composition
  fiber_type_id, percentage_by_weight
  is_recycled, recycled_content_percentage, recycled_content_source, recycled_certification
  is_organic, organic_certification
  origin_country_code, supplier_name, supplier_id
  verification_method, verification_date

material_origins
  supply_chain_tier, process_stage, facility_name, facility_gln, facility_certifications
```

**Why:** This transforms the flat `FiberComposition` JSONB into a queryable, auditable model that can enforce recycled-content thresholds and trace fiber origin per ESPR/JRC requirements.

#### Chemical compliance

```
chemical_substances
  substance_name, cas_number, ec_number
  is_svhc, svhc_listing_date
  is_annex_xvii_restricted, restriction_limit_value
  is_pfas
  concentration_percentage, concentration_mg_kg, component, material_part
  compliance_status
  test_report_reference, testing_lab_name, testing_date, testing_method
  scip_notification_required, scip_notification_submitted, scip_notification_date

reach_regulatory_data    -- read-only ECHA reference table
chemical_inventory       -- production chemicals with ZDHC MRSL conformance
```

**Why:** REACH compliance is the entry gate. The schema must support SVHC screening, Annex XVII limit enforcement, SCIP notification status, and PFAS tracking.

#### Supply chain & CSDDD

```
suppliers
  company_name, gln, facility_type, processes, certifications
  supply_chain_tier
  csddd_risk_level, csddd_risk_factors, csddd_audit_status
  has_grievance_mechanism

batch_suppliers
  process_stage, stage_sequence, start_date, end_date, quantity_processed

due_diligence_assessments
  OECD-aligned: identification, assessment, mitigation, tracking
  human_rights_score, environment_score, governance_score
```

**Why:** ESPR requires tier 1–2 traceability; CSDDD (even narrowed) drives brand demand for supplier due diligence. The `csddd_*` fields let Indian exporters respond to buyer questionnaires.

#### Ecodesign & environmental performance

```
ecodesign_scores
  robustness_score (0-10) + sub-scores
  recyclability_score (0-10) + composition_complexity, trim_separability
  recycled_content_overall_pct + per-fiber pct
  manufacturing_footprint_kg_co2e, benchmark, outperformance_pct
  repairability_info_available, spare_parts_available

environmental_performance
  carbon_footprint_total / per_unit (PEFCR apparel methodology)
  water_consumption, energy_consumption, renewable_energy_percentage
  microplastic_shedding_mg_per_kg_wash
  full PEF impact categories
```

**Why:** JRC milestone 3 identifies robustness, recyclability, recycled content, and manufacturing footprint as the core ecodesign parameters.

#### EPR & end-of-life

```
epr_registrations
  country_code, pro_name, pro_registration_number, registration_status
  reporting_frequency, eco_modulation_category, fee_per_kg

end_of_life_info
  disassembly_instructions, recyclability_rate_percentage
  recycling_technology_compatibility, take_back_scheme

unsold_goods_disclosures
  destruction ban reporting per ESPR Art. 24–25
```

**Why:** EU Textile EPR is operational by April 2028. The destruction ban for unsold apparel applies from July 2026 for large companies.

#### Access tiers, language, governance

```
dpp_field_access_tiers
  field_name, field_category, access_tier_public/b2b/authority

dpp_translations
  batch_id, language_code, localized product/care/recycling/repair content

declarations_of_conformity
  doc_reference_number, signatory, compliance flags, doc_url, sha256

green_claims
  claim_text, claim_type, ecgt_compliant, substantiation_status, evidence

dpp_registry_submissions
  upi_submitted, data_access_point_url, submission_status, registry_response
```

**Why:** ESPR requires three-tier access, multi-language content, DoC, and EREV registry submission. ECGT requires claim substantiation.

### 5.4 Compliance engine blueprint

Upgrade the existing `textile/eu.go` and `textile/india.go` validators to a **rule-driven engine** backed by the `compliance_rules` table (already exists in battery-api; extend to textile-api):

```
compliance_rules
  product_type = 'TEXTILE'
  market_region = 'EU' | 'INDIA' | 'GLOBAL'
  rule_category = 'IDENTIFICATION' | 'MATERIAL' | 'CHEMICAL' | 'SUPPLY_CHAIN' | 'ECODESIGN' | 'ENVIRONMENTAL' | 'EPR' | 'GOVERNANCE'
  rule_name, effective_date, severity = 'ERROR' | 'WARNING'
  condition_json, message
```

The validator should:
1. Load active rules from the DB.
2. Evaluate each rule against the batch + related tables (fiber composition, chemicals, suppliers, ecodesign scores).
3. Return a structured `compliance.Result` with score, gaps, and severity.
4. Support **preview mode** so manufacturers can see EU readiness before activating passports.

### 5.5 Passport rendering & data carrier

#### Public passport page (`/p/[uuid]`)

The textile public view should display:

- **Header**: product name, brand, GTIN, serial number, manufacturing date, QR code.
- **Identification**: manufacturer, EU importer / authorized representative, country of origin.
- **Fiber composition table**: fiber type, %, recycled %, certification, origin country.
- **Supply chain timeline**: PRODUCE → SPIN → KNIT/WEAVE → DYE → FINISH → CUT/SEW → SHIP, with facility names and GLNs.
- **Chemical compliance**: SVHC status, restricted substance summary, test report links.
- **Ecodesign**: robustness score, recyclability score, recycled content, manufacturing footprint vs. benchmark.
- **Care & end-of-life**: washing instructions, recycling guidance, take-back scheme.
- **Authority view toggle**: expanded test reports, supplier audit data, SCIP details (token-gated).

#### GS1 Digital Link QR

Migrate QR generation to support:

```
https://id.gs1.org/01/{GTIN}/21/{SERIAL_NUMBER}
```

If GTIN is not yet available, use a GS1 resolver-style URI:

```
https://anvayalabs.in/01/{GTIN}/21/{SN}?linkType=all
```

The serial number format (currently `IN-TEN-CTN-2026-00001`) should be retained but branded consistently — e.g., **TPAN (Textile Product Aadhaar Number)** — and embedded in the GS1 link.

### 5.6 Supplier & informal-sector onboarding

Build a **mobile-first supplier PWA** with:

- Profile: name, location, facility type, processes, GLN (if available).
- Verifiable credential: QR-code-based identity for informal suppliers without formal registrations.
- Photo/document upload: GOTS/GRS certificates, audit reports, water/energy bills.
- Offline sync for low-connectivity factory floors.

This directly addresses the CSDDD Tier 1 data request flow and creates a two-sided network effect.

### 5.7 India-specific integration

| Integration | Purpose |
|---|---|
| **Tally Prime plugin** | Extract BOM, supplier invoices, GST-linked HSN codes, production quantities → auto-populate batch creation. |
| **DGFT TRACE** | Auto-generate reimbursement documentation for traceability investments (75% subsidy). |
| **Regional languages** | Add Hindi, Tamil, Telugu, Gujarati to public passport and dashboard. |
| **India textile EPR** | Prepare for MoEFCC draft textile EPR rules (expected FY 2026–27 notification). |

---

## 6. Implementation Roadmap

### Phase 0: Verified Cleanup (Weeks 1–4)

Before building DPP features, stabilize the textile codebase using the **verified** cleanup list from Section 5.2.

**Exit criteria:**
- No battery-specific columns remain in `textile-api` `batches`/`passports` tables.
- `cmd/migrate/main.go` checks only textile-relevant columns.
- `/docs/page.tsx` and related docs pages are textile-only.
- Full test suite passes; baseline release tagged.

### Phase 1: Identification & Material Composition (Weeks 5–10)

Goal: Make the passport structurally valid for EU identification and fiber disclosure.

1. Add `gtin`, `upi`, `cn_code`, `hs_code`, `gs1_digital_link_uri` to `batches`.
2. Create `economic_operators` and `batch_economic_operators` tables + API.
3. Create `fiber_types`, `batch_material_composition`, `material_origins` tables + API.
4. Update batch creation UI to collect per-fiber composition, recycled %, certification, origin.
5. Implement GS1 Digital Link QR generation.
6. Update EU validator to enforce fiber composition + economic operator rules.

**Exit criteria:** A textile passport can be scanned and resolve to a GS1-compliant page showing manufacturer, EU operator, and fiber composition.

### Phase 2: Chemical Compliance (Weeks 11–16)

Goal: Pass REACH / SVHC / SCIP gate.

1. Create `chemical_substances`, `reach_regulatory_data`, `chemical_inventory` tables.
2. Build SVHC screening against ECHA reference data.
3. Implement SCIP notification status tracking.
4. Add PFAS flagging and restricted-substance checks.
5. Build chemical inventory UI linked to dye/finishing processes.
6. Add test report upload and SHA256 verification.

**Exit criteria:** Batch with SVHC >0.1% correctly flags ERROR + SCIP required; compliant batch passes EU chemical rules.

### Phase 3: Supply Chain & CSDDD (Weeks 17–22)

Goal: Enable tier 1–2 traceability and supplier due diligence.

1. Create `suppliers`, `batch_suppliers`, `due_diligence_assessments` tables.
2. Build supplier onboarding PWA (MVP).
3. Add facility GLN capture and process-stage mapping.
4. Implement CSDDD risk scoring (low/medium/high/critical) and audit status.
5. Update public passport supply chain timeline.

**Exit criteria:** A garment can trace fiber → yarn → fabric → dye → finish → cut/sew with facility names and risk scores.

### Phase 4: Ecodesign & Environmental Performance (Weeks 23–28)

Goal: Support JRC milestone 3 ecodesign parameters.

1. Create `ecodesign_scores` and `environmental_performance` tables.
2. Implement robustness score input and sub-score aggregation.
3. Implement recyclability score logic (blend complexity, trim separability).
4. Enforce recycled content thresholds (denim 20% cotton, knit/woven 15% polyester, etc. — update when delegated act finalizes).
5. Enhance carbon calculator to output PEFCR-aligned manufacturing footprint.
6. Add microplastic shedding field (optional until harmonized test method is finalized).

**Exit criteria:** Passport displays robustness, recyclability, recycled content %, and manufacturing footprint.

### Phase 5: EPR, Registry & Governance (Weeks 29–34)

Goal: Full operational compliance for EU market placement.

1. Create `epr_registrations`, `end_of_life_info`, `unsold_goods_disclosures` tables.
2. Build DoC generation and signing workflow.
3. Implement green-claims validation against ECGT.
4. Build EU DPP Registry (EREVS) submission tracking.
5. Add multi-language DPP translation workflow.

**Exit criteria:** Manufacturer can generate a signed DoC, submit passport to registry (mock or live), and display multi-language content.

### Phase 6: India Market Fit & Scale (Weeks 35–44)

Goal: Make the platform affordable and usable for Indian MSMEs.

1. Tally Prime plugin MVP.
2. Hindi + 3 regional languages.
3. DGFT TRACE auto-documentation.
4. India textile EPR reporting module (prepared for MoEFCC notification).
5. Cluster-based onboarding: Tirupur, Surat, Panipat, Bengaluru.

**Exit criteria:** MSME exporter can onboard via Tally, generate EU-ready DPP, and claim TRACE subsidy.

---

## 7. Compliance Checklist for Indian Textile Manufacturers

Use this checklist when onboarding a manufacturer:

### Company-level
- [ ] Legal name, address, VAT/GST, website
- [ ] BIS/QCO registration (India)
- [ ] SA8000 / BSCI / SEDEX / Fair Trade certification
- [ ] EU importer / authorized representative identified
- [ ] EORI number of importer (if known)
- [ ] EPR registration with EU PRO(s) (by 2028)

### Product / batch-level
- [ ] GTIN assigned
- [ ] Fiber composition = 100% by weight
- [ ] Recycled content % declared and certified (GRS/RCS)
- [ ] Organic content certified (GOTS/OCS) if claimed
- [ ] Country of origin per fiber / stage
- [ ] REACH SVHC screening completed
- [ ] Restricted substances test reports (azo dyes, phthalates, PFAS, heavy metals)
- [ ] SCIP notification submitted if SVHC >0.1%
- [ ] ZDHC MRSL conformance level declared
- [ ] Water & energy usage per unit
- [ ] Carbon footprint (PEFCR/apparel or ISO 14067)
- [ ] Robustness and recyclability scores
- [ ] Care instructions and end-of-life guidance
- [ ] Multi-language content for target EU countries
- [ ] Declaration of Conformity signed

### Supply chain
- [ ] Tier 1 suppliers identified (name, address, GLN if available)
- [ ] Tier 2 suppliers identified for key materials
- [ ] Facility certifications captured (GOTS, OEKO-TEX, ZDHC)
- [ ] CSDDD risk assessment completed for in-scope suppliers

---

## 8. Go-to-Market Notes

1. **Target segments (in order):**
   - Tier 1 exporters already supplying EU brands: Arvind, Welspun, Vardhman, KPR, Shahi, Gokaldas, etc.
   - Mid-size garment exporters in Tirupur / Surat / NCR clusters.
   - MSME long tail via Tally + TRACE subsidy.

2. **Pricing anchor:**
   - Enterprise (brands/large exporters): ₹3–10 lakh/year.
   - Mid-market: ₹10,000–25,000/month.
   - MSME: ₹2,000–5,000/month (effective ₹500–1,250 after TRACE reimbursement).

3. **Partnerships:**
   - AEPC, TEXPROCIL, CII for textile reach.
   - Testing labs (SGS, Intertek, TÜV) for chemical test report ingestion.
   - Certification bodies (Control Union, GOTS, GRS) for certificate verification.

4. **Differentiation vs. global platforms (Circularise, Circulor, SAP):**
   - India-born cost structure and MSME pricing.
   - Native Tally integration.
   - Dual India EPR + EU DPP output.
   - Informal supplier PWA.
   - DGFT TRACE subsidy support.

---

## 9. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Textile delegated act delayed beyond 2027 | Medium | Medium | Build core DPP infrastructure now; rules engine makes threshold updates trivial. |
| Indian MSMEs cannot afford data collection | High | High | Tally plugin + TRACE subsidy + tiered pricing; start with large exporters. |
| Suppliers refuse to share data | Medium | High | Mobile PWA with verifiable credentials; lead with buyer demand / CSDDD. |
| PFAS restriction broad ban disrupts finishes | High | High | Add PFAS screening now; help manufacturers reformulate. |
| India–EU FTA ratification slower than expected | Medium | Medium | DPP is mandatory regardless of FTA; market access alone justifies investment. |
| Global platform enters India market | Medium | High | Lock in via Tally integration, dual compliance, and informal supplier network. |
| Battery schema debt causes migration conflicts | Medium | High | Phase 0 cleanup explicitly drops/renames battery columns before adding textile DPP tables. |

---

## 10. Regulatory Timeline Summary

| Date | Milestone | Action required |
|---|---|---|
| **July 2024** | ESPR entered into force | Framework established. |
| **Jan 2025** | Separate textile collection mandatory across EU | Operational signal. |
| **16 Oct 2025** | EU Textile EPR Directive (2025/1892) in force | Member States transpose by June 2027; PROs by April 2028. |
| **19 July 2026** | EU DPP Registry (EREVS) operational | DPP service providers must integrate. |
| **July 2026** | Destruction ban for unsold apparel (large enterprises) | Reporting format required by February 2027. |
| **Mid-2026** | JRC preparatory study final | Prepare for delegated act draft. |
| **Mid-2027** | Textiles Delegated Act expected adoption | 18–24 month transition begins. |
| **Late 2026 / Early 2027** | India–EU FTA expected entry into force | Zero-duty textile access; DPP becomes gate. |
| **April 2028** | EU Textile EPR schemes fully operational | PRO registration and reporting mandatory. |
| **Late 2028 / Mid-2029** | Textile DPP likely mandatory | All apparel placed on EU market must carry valid DPP. |
| **2029** | CSDDD first-wave compliance (large EU companies) | Tier 1 supplier due diligence data required. |

---

## 11. Immediate Next Steps

1. ✅ **Phase 0 cleanup completed** (Section 5.2). Battery-specific code, tests, and migrations have been removed from `textile-api` and `textile-web`; test and build pipelines are green.
2. **Schedule a GS1 Digital Link spike** — decide resolver strategy and serial format.
3. **Begin Phase 1 schema migrations** (economic operators, fiber composition, GTIN).
4. **Set up a textile DPP conformance test harness** that runs the EU validator against sample batches and fails CI on regression.
5. **Deprecate `docs/TEXTILE_CLEANUP_PLAN.md`** or mark it clearly as outdated; use Section 5.2 of this blueprint for cleanup instead.

---

*This blueprint is a living document. Update it when the EU Textiles Delegated Act is formally adopted and when India’s domestic textile EPR rules are notified.*
