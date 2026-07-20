# Document 2: State Machine & Lifecycle Flow
## ExportReady — Battery DPP Lifecycle Engine
**Source files:** `models/models.go` (lines 871–982), `services/lifecycle.go`, `compliance/battery/india.go`, `compliance/battery/eu.go`, `lib/activation-blockers.ts`

---

## 1. Passport Status Constants

All valid passport statuses are defined as constants in `models/models.go`:

```
CREATED  → ACTIVE → SHIPPED → IN_SERVICE → RECYCLED → END_OF_LIFE
                                         ↘ RECALLED →  END_OF_LIFE
                                                    ↘ RECYCLED → END_OF_LIFE
                   ↘ RECALLED
IN_SERVICE → REMANUFACTURED
IN_SERVICE → REUSED
IN_SERVICE → REPURPOSED
```

| Status | Description |
|---|---|
| `CREATED` | Passport record created, not yet legally validated |
| `ACTIVE` | Manufactured and legally valid — DPP is live |
| `SHIPPED` | Battery left factory or warehouse |
| `IN_SERVICE` | Installed in device, vehicle, or grid system |
| `RECALLED` | Safety or compliance interruption |
| `RECYCLED` | Processed by an authorised recycler |
| `REMANUFACTURED` | Refurbished to like-new condition (EU Art. 14) |
| `REUSED` | Direct second-use without remanufacturing |
| `REPURPOSED` | Repurposed for a different application |
| `END_OF_LIFE` | Terminal state |

---

## 2. Canonical State Transition Map

Extracted directly from `BatteryTransitionMap` in `models/models.go`:

| Action | Allowed From | Transitions To |
|---|---|---|
| `ACTIVATE` | `CREATED` | `ACTIVE` |
| `SHIP` | `ACTIVE` | `SHIPPED` |
| `INSTALL` | `SHIPPED` | `IN_SERVICE` |
| `RECALL` | `ACTIVE`, `SHIPPED`, `IN_SERVICE` | `RECALLED` |
| `RECYCLE` | `IN_SERVICE`, `RECALLED` | `RECYCLED` |
| `CLOSE` | `RECYCLED`, `RECALLED` | `END_OF_LIFE` |
| `REMANUFACTURE` | `IN_SERVICE`, `RECALLED` | `REMANUFACTURED` |
| `REUSE` | `IN_SERVICE`, `RECALLED` | `REUSED` |
| `REPURPOSE` | `IN_SERVICE`, `RECALLED` | `REPURPOSED` |

> **Note:** `SOH_UPDATE` is a pseudo-action that records a State-of-Health reading but does **not** change passport status.

---

## 3. Role-Action Permission Matrix

Extracted directly from `BatteryAllowedRolesByAction` in `models/models.go`:

| Action | Allowed Actor Roles |
|---|---|
| `ACTIVATE` | `SYSTEM` only |
| `SHIP` | `INTERNAL_OPERATOR`, `LOGISTICS`, `ADMIN` |
| `INSTALL` | `TECHNICIAN` |
| `RECYCLE` | `RECYCLER` |
| `CLOSE` | `SYSTEM`, `RECYCLER` |
| `RECALL` | `ADMIN` |
| `REMANUFACTURE` | `RECYCLER`, `TECHNICIAN` |
| `REUSE` | `RECYCLER`, `LOGISTICS` |
| `REPURPOSE` | `RECYCLER`, `TECHNICIAN` |

### Role-to-Actor Type Mapping (from `lifecycle_handlers.go`)

| Team Role | Maps to Actor Role |
|---|---|
| `OWNER`, `ADMIN` | `ADMIN` |
| `MEMBER` | `INTERNAL_OPERATOR` |
| Magic Link `LOGISTICS` | `LOGISTICS` |
| Magic Link `TECHNICIAN` | `TECHNICIAN` |
| Magic Link `RECYCLER` | `RECYCLER` |

---

## 4. Activation Pre-Flight Gate

The `ACTIVATE` action is the most complex transition. Before the `SYSTEM` can activate a passport, the underlying **batch** must pass a merged client+server compliance gate.

### 4.1 Common Requirements (All Markets)

From `activation_compliance.go` and `activation-blockers.ts`:

| Field | Description |
|---|---|
| `batch.model_name` | Product model name |
| `batch.specs.chemistry` | Battery chemistry (LFP, NMC, etc.) |
| `batch.specs.capacity` | Rated capacity |
| `batch.manufacturing_start_date` | Manufacturing window start |
| `batch.manufacturing_end_date` | Manufacturing window end |

### 4.2 India Market Activation Requirements

From `compliance/battery/india.go` and `lib/activation-blockers.ts`:

**Tenant-level (set in Settings → Compliance):**

| Field | Regulation |
|---|---|
| `epr_registration_number` | BWM Rules 2022 — EPR registration (format: `B-XXXXX/YYYY-YY/CPCB`) |
| `bis_r_number` | BIS CRS IS 16046 (format: `R-XXXXXXXX`) |
| `iec_code` | Foreign Trade Policy — IEC (format: 5 letters + 4 digits + 1 letter) |
| `morth_manufacturer_code` | AIS-156 — MoRTH manufacturer registration |
| EPR certificate uploaded | Status: PENDING or VERIFIED |
| BIS certificate uploaded | Status: PENDING or VERIFIED |

**Batch-level:**

| Field | Condition | Regulation |
|---|---|---|
| `specs.cell_source` | Required — `IMPORTED` or `DOMESTIC` | PLI Phase II |
| `specs.certifications` includes `AIS-156` | Always | AIS-156:2022 (MoRTH traction battery) |
| `specs.certifications` includes `AIS-038` | Always | AIS-038 Rev.2 (battery safety for EVs) |
| `specs.bis_certificate_issue_date` | Always | BIS CRS IS 16046 |
| `specs.un38_3_test_date` | Always | UN 38.3 transport safety |
| `specs.iec_62133_test_date` | Always | IEC 62133 safety testing |
| `specs.msds_issue_date` | Always | MSDS declaration |
| `specs.bill_of_entry_no` | Only if `cell_source = IMPORTED` | Customs Act 1962 |
| `specs.country_of_origin` | Only if `cell_source = IMPORTED` | Foreign Trade Policy |
| `specs.customs_date` | Only if `cell_source = IMPORTED` | Customs Act 1962 |
| `domestic_value_add > 0` | Only if `cell_source = DOMESTIC` | PLI Phase II |

**PLI Warning (non-blocking):** DVA < 50% while `pli_compliant = true` triggers warning.

### 4.3 EU Market Activation Requirements

From `compliance/battery/eu.go` and `lib/activation-blockers.ts`:

**Tenant-level:**

| Field | Regulation |
|---|---|
| `company_name` | EU 2023/1542 Art. 38(7) |
| `address` | EU 2023/1542 Art. 38(7) |
| `eu_authorized_representative_name` | EU 2023/1542 Art. 38 |
| `eu_authorized_representative_address` | EU 2023/1542 Art. 38 |
| `eu_contact_email` | EU 2023/1542 Art. 38 |

**Batch-level:**

| Field | Regulation |
|---|---|
| `specs.battery_category` — one of: EV, LMT, INDUSTRIAL, PORTABLE, SLI | EU 2023/1542 Art. 2(1) |
| Carbon footprint result OR `specs.carbon_footprint` text | EU 2023/1542 Art. 7 |
| `specs.material_composition` (at least one non-zero %) | EU 2023/1542 Art. 8 |
| `specs.hazardous_substances.declaration` | REACH Reg. EC 1907/2006 |
| `specs.expected_lifetime_cycles > 0` | EU 2023/1542 Annex IV |
| `specs.warranty_months > 0` | EU 2023/1542 Art. 10 |

**EU Warnings (non-blocking):** Missing per-material recycled content percentages for cobalt, lithium, nickel, lead trigger warnings ("required from Aug 2028").

---

## 5. Complete Data Points: Raw Material to Export Readiness

### 5.1 Raw Material / Supply Chain Layer

Stored in `BatchSpec.SupplyChainProvenance` (JSONB):

```
SupplyChainProvenance
├── due_diligence_policy  (URL to policy document)
└── tiers[]
    ├── material           (cobalt, lithium, nickel, manganese, graphite)
    ├── supplier_name
    ├── country_of_origin  (ISO Alpha-2)
    ├── mine_or_refinery
    ├── certified          (boolean — third-party audited)
    ├── certification_body (RMI, IRMA, etc.)
    ├── recycled_source    (boolean)
    └── percentage         (% of total material from this source)
```

CMRT smelter data (from supplier portal uploads):
```
SupplierCMRTReport
├── smelters[]
│   ├── name, country, mineral, smelter_ref
│   └── rmi_status  (conformant | active | no_longer_conformant | unknown)
├── unknown_smelters (count)
└── rmi_conformant_pct
```

### 5.2 Cell / Component Manufacturing Layer

Stored in `BatchSpec.Components` (flat BOM with ParentID, JSONB):

```
Component
├── id, name, component_type   (cell | module | pack | subsystem)
├── parent_id                  (nil = top-level)
├── model_number, serial_number, lot_number
├── date_of_manufacture
├── manufacturer, manufacturer_address
├── country_of_origin
├── chemistry                  (NMC811, LFP, etc.)
├── material percentages       (cobalt, lithium, nickel, manganese, graphite, lead)
├── recycled percentages       (recycled_cobalt, recycled_lithium, etc.)
├── weight_kg, quantity
├── ce_marking, bis_number
├── hazardous flags            (lead, mercury, cadmium)
└── supplier_id
```

### 5.3 Pack Manufacturing / Batch Layer

Core `Batch` record:

```
Batch
├── id (UUID), batch_name, model_name
├── product_type (BATTERY), market_region (INDIA | EU | GLOBAL)
├── status (DRAFT | ACTIVE | ARCHIVED)
├── manufacturing_start_date, manufacturing_end_date
├── compliance_score (0–100), compliance_gaps (JSONB)
├── carbon_footprint_result (JSONB — JRC 2024 result)
├── ce_marking, notified_body_number, carbon_performance_class
├── removable_and_replaceable, declaration_of_conformity_path
├── gtin (GS1 DL for EU QR)
├── pli_compliant, domestic_value_add, cell_source
└── specs (BatchSpec JSONB):
    ├── chemistry, voltage, capacity, weight, manufacturer
    ├── carbon_footprint (text), recyclable
    ├── country_of_origin, material_profile, lot_size
    ├── sale_price_inr, import_cost_inr
    ├── cell/bms/casing cost breakdown (imported/domestic INR)
    ├── labour_overhead_cost_inr
    ├── dva_source (ESTIMATED | AUDITED)
    ├── audited_domestic_value_add, pli_certificate_url
    ├── hsn_code (85xxxxxx), bis_number (R-XXXXXXXX)
    ├── epr_number (B-XXXXX/YYYY-YY/CPCB)
    ├── bill_of_entry_no, customs_date
    ├── certifications[] (AIS-156, AIS-038, CE, UL, IEC, etc.)
    ├── bis_certificate_issue_date, un38_3_test_date
    ├── iec_62133_test_date, msds_issue_date
    ├── ce_notified_body_number, manufacturer_address
    ├── eu_representative, eu_representative_email, eu_representative_address
    ├── expected_lifetime_cycles, warranty_months
    ├── recycled_content_pct
    ├── material_composition (MaterialComposition)
    │   ├── cobalt_pct, lithium_pct, graphite_pct, nickel_pct
    │   ├── lead_pct, manganese_pct
    │   └── recycled_cobalt/lithium/nickel/lead_pct
    ├── hazardous_substances
    │   ├── lead_present, mercury_present, cadmium_present
    │   ├── declaration, exemptions
    ├── battery_category (EV | LMT | INDUSTRIAL | PORTABLE | SLI)
    ├── performance_spec (PerformanceSpec)
    │   ├── rated_capacity_ah, rated_capacity_wh
    │   ├── rated_voltage, min_voltage, max_voltage
    │   ├── internal_resistance_mohm
    │   ├── max_charge_c_rate, max_discharge_c_rate
    │   ├── operating_temp_min_c, operating_temp_max_c
    │   ├── capacity_at_80_soh_ah, round_trip_efficiency_pct
    │   └── cathode_material, anode_material
    ├── disassembly_guide (DisassemblyGuide)
    │   ├── document_url, steps[], tools_required[]
    │   ├── hazards[], safety_guidelines[], eol_instructions
    │   └── recycler_url
    ├── supply_chain_provenance (see §5.1)
    └── components[] (see §5.2)
```

### 5.4 Individual Passport Layer

```
Passport (uuid)
├── serial_number (BPAN V2 format)
├── battery_passport_id (EU Implementing Reg 2024/1715)
├── manufacture_date
├── status (lifecycle state)
├── batch_snapshot (immutable JSONB copy at creation)
├── current_owner_identifier, current_owner_email
├── ownership_history (JSONB array)
├── shipped_at, installed_at, returned_at, recycled_at
├── state_of_health (0–100)
├── cycle_count, last_temperature, last_voltage
├── thermal_event_count, last_telemetry_at
├── repair_events (JSONB), replacement_events (JSONB)
├── circularity_status (ORIGINAL|REPURPOSED|REUSED|REMANUFACTURED|WASTE)
├── recycling_status, recycler_epr_id, recycling_date
└── geolocation_history (JSONB)
```

### 5.5 Lifecycle Event Layer (Immutable Audit Log)

```
PassportEvent (passport_events table)
├── id (UUID), passport_id
├── event_type (STATUS_CHANGED | SOH_UPDATE | etc.)
├── action (ACTIVATE | SHIP | INSTALL | RECYCLE | CLOSE | RECALL)
├── actor_type (SYSTEM | USER | PARTNER | EXTERNAL)
├── actor_identifier (email or "system")
├── actor_role (SYSTEM | INTERNAL_OPERATOR | LOGISTICS | TECHNICIAN | RECYCLER | ADMIN)
├── source (INTERNAL | MAGIC_LINK | API_KEY)
├── status_from → status_to
├── ip_address
├── metadata (JSONB — evidence, reason_code, admin_note, location)
├── hash (SHA-256 chained with previous_hash)
└── created_at (immutable — DB trigger prevents UPDATE/DELETE)
```

**Immutability guarantee**: A PostgreSQL trigger (`trg_passport_events_no_update`, `trg_passport_events_no_delete`) raises an exception on any attempt to modify `passport_events`.

### 5.6 Export Readiness State

A batch is **Export Ready** (can be ACTIVATED) when:
1. All activation blockers in §4 are cleared.
2. `compliance_score` is computed (0–100) — EU BatteryPass 56-attribute checklist.
3. `carbon_footprint_result` is present (JRC 2024 methodology).
4. All required certificates are uploaded and not REJECTED.
5. Tenant `onboarding_completed = true`.
6. Tenant `subscription` is not expired.
7. Tenant `quota_balance > 0` (passport slots available).

---

## 6. EPCIS 2.0 Export

From `services/epcis_export.go`:

Lifecycle events are mapped to **GS1 EPCIS 2.0 JSON-LD** for interoperability:

| ExportReady Action | GS1 CBV bizStep URN |
|---|---|
| ACTIVATE | `urn:epcglobal:cbv:bizstep:commissioning` |
| SHIP | `urn:epcglobal:cbv:bizstep:shipping` |
| INSTALL | `urn:epcglobal:cbv:bizstep:installing` |
| RECALL | `urn:epcglobal:cbv:bizstep:recall` |
| RECYCLE | `urn:epcglobal:cbv:bizstep:disposing` |
| CLOSE | `urn:epcglobal:cbv:bizstep:decommissioning` |

---

## 7. Undo Transition Mechanism

- **Admin-only**, within a **30-minute window** from the transition being undone.
- Requires a non-empty `admin_note`.
- Cannot undo if passport status has changed again since the transition.
- Endpoint: `POST /api/v1/passports/{uuid}/undo-transition`.

---

*End of Document 2*
