# Battery Dual Compliance Gap Analysis
## EU Battery Regulation 2023/1542 + India BWM Rules 2022

### Executive Summary

| Regulation | Coverage | Key Gaps |
|------------|----------|----------|
| **EU 2023/1542** (Annex XIII) | ~85% | CE marking, carbon performance class, removability, battery passport ID format, spare parts |
| **India BWM 2022** | ~80% | EPR obligation ledger, quarterly CPCB returns, collection center linkage |

---

## 1. EU Battery Regulation 2023/1542 — Annex XIII Coverage

### ✅ Well Covered (in DB schema or specs JSONB)

| Data Category | Fields | Where Stored |
|--------------|--------|-------------|
| **General Info** | manufacturer, model, manufacturing date, place, weight, capacity, chemistry, battery category | `batches.specs` JSONB + `passports` table |
| **Composition & Materials** | cobalt, lithium, nickel, graphite, manganese, lead %; recycled content % per material | `batches.specs.material_composition` |
| **Hazardous Substances** | lead, mercury, cadmium presence; REACH/RoHS declaration | `batches.specs.hazardous_substances` |
| **Carbon Footprint** | total kgCO2e/kWh, lifecycle stage breakdown, performance class | `batches.carbon_footprint_result` JSONB |
| **Performance & Durability** | rated capacity, voltage, internal resistance, C-rates, cycle life, round-trip efficiency, operating temps | `batches.specs.performance_spec` |
| **Supply Chain Due Diligence** | country of origin, supplier names, certification body (RMI/IRMA), mine/refinery | `batches.specs.supply_chain_provenance` |
| **SoH & Telemetry** | state of health, cycle count, temperature, voltage, thermal events | `passports` cols + `soh_history` + `passport_telemetry` |
| **End-of-Life** | recycling status, recycler ID, recycling date, dismantling guide, repair history | `passports` cols + `passport_events` hash chain |
| **EU Rep** | name, address, email | `battery_tenant_profiles` + `batches.specs` |
| **Audit Trail** | immutable lifecycle events with SHA-256 hash chain | `passport_events` table |

### ❌ Missing for EU Compliance

| # | Gap | Regulation Ref | Why It Matters |
|---|-----|---------------|----------------|
| 1 | **CE marking boolean** | Art 16, Annex XIII(3) | Required for EU market placement. Currently only a string in `certifications[]` array. |
| 2 | **Notified Body number** | Art 18, Annex XIII(3) | CE conformity assessment body ID (e.g., "0123"). No dedicated field. |
| 3 | **Carbon performance class (A-E)** | Art 7(4), Annex XIII(7) | Mandatory label from Aug 2025 (EV) / Feb 2026 (industrial). No field exists. |
| 4 | **Removability & replaceability** | Art 11, Annex XIII(5) | EU requires info on how battery can be removed/replaced from product. |
| 5 | **Battery Passport ID** | Implementing Reg 2024/1715 | EU-specific format distinct from serial/BPAN. Required for QR code linking. |
| 6 | **Declaration of Conformity path** | Art 18, Annex XIII(3) | Link to signed DoC PDF. No dedicated field. |
| 7 | **Expected lifetime (years)** | Art 10, Annex IV | Only `expected_lifetime_cycles` exists. EU requires years too. |
| 8 | **Spare parts availability** | Art 11, Annex XIII(5) | Part numbers + supplier contact for replacement parts. |
| 9 | **Battery condition/status** | Art 14, Annex XIII(4c) | EU requires: original, repurposed, re-used, remanufactured, waste. Current `PassportStatus` is lifecycle-oriented (CREATED→ACTIVE→SHIPPED...), not circularity-oriented. |

---

## 2. India Battery Waste Management Rules 2022 — Coverage

### ✅ Well Covered

| Requirement | Where Stored |
|------------|-------------|
| EPR registration number | `battery_tenant_profiles.epr_registration_number` |
| BIS R-number | `battery_tenant_profiles.bis_r_number` |
| BIS/EPR/PLI certificate uploads | `battery_tenant_profiles.*_certificate_path` + `epr_certificates` table |
| IEC code | `battery_tenant_profiles.iec_code` |
| HSN code, DVA %, cell source | `batches.specs` |
| Customs BoE, country of origin | `batches.specs` |
| MORTH codes | `battery_tenant_profiles.morth_*` |
| Recycling tracking | `passports.recycling_status`, `recycler_epr_id`, `recycling_date` |
| Immutable audit trail | `passport_events` with hash chain |

### ❌ Missing for India Compliance

| # | Gap | Rule Ref | Why It Matters |
|---|-----|----------|----------------|
| 1 | **EPR obligation ledger** | Rule 4(4) | Producer must track annual EPR obligation (kg of batteries placed on market) vs kg fulfilled via recycling. Current `epr_certificates` table only tracks recycler-issued certs, not producer obligations. |
| 2 | **CPCB quarterly returns** | Rule 4(4) | Producers must file quarterly returns on the CPCB portal. No table to track filing status. |
| 3 | **Collection center / recycler MoUs** | Rule 4(4) | Producers need formal agreements with registered collection centers and recyclers. |
| 4 | **Environmental Compensation (ECC)** | Rule 13 | Shortfall in EPR targets attracts ECC. No tracking of penalties. |
| 5 | **Refurbishment certificates** | 2025 amendment | Second-life batteries need BIS/NABL-backed refurbishment certs. |

---

## 3. Recommended Additions (Pragmatic Priority)

### P0 — Must have before running migration

| Migration | What | Tables |
|-----------|------|--------|
| **057** | EU compliance columns: `ce_marking`, `notified_body_number`, `carbon_performance_class`, `removable_and_replaceable`, `declaration_of_conformity_path` | `batches` |
| **057** | EU passport ID: `battery_passport_id` (unique), `circularity_status` | `passports` |
| **058** | India EPR obligation tracking: `epr_obligations` table | new table |

### P1 — Nice to have

| Migration | What | Tables |
|-----------|------|--------|
| **059** | India quarterly returns: `epr_quarterly_returns` table | new table |
| **059** | Spare parts info, expected lifetime years | `batches.specs` JSONB schema update |
