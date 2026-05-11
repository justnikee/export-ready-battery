# Product Passport Engine — Architecture & Expert Review

> **Document purpose:** Explain how the Battery Digital Passport engine works inside this codebase, identify what is correctly implemented, and flag gaps that need attention.  
> Last reviewed: 2026-03-29

---

## Table of Contents

1. [What Problem This Solves](#1-what-problem-this-solves)
2. [High-Level Architecture](#2-high-level-architecture)
3. [The Passport Data Model](#3-the-passport-data-model)
4. [Passport Identity — BPAN Serial Numbers](#4-passport-identity--bpan-serial-numbers)
5. [Three-Layer Data Access (EU Art 78)](#5-three-layer-data-access-eu-art-78)
6. [Lifecycle State Machine](#6-lifecycle-state-machine)
7. [Immutable Audit Trail & Hash Chain](#7-immutable-audit-trail--hash-chain)
8. [Activation Compliance Gate](#8-activation-compliance-gate)
9. [Carbon Footprint Calculator](#9-carbon-footprint-calculator)
10. [QR Code Generation](#10-qr-code-generation)
11. [BMS Telemetry Ingestion](#11-bms-telemetry-ingestion)
12. [Magic-Link External Access](#12-magic-link-external-access)
13. [Dual-Mode: India + EU Compliance](#13-dual-mode-india--eu-compliance)
14. [Audit Export (CSV / PDF)](#14-audit-export-csv--pdf)
15. [Database Schema Evolution](#15-database-schema-evolution)
16. [Expert Assessment — What Is Correctly Implemented](#16-expert-assessment--what-is-correctly-implemented)
17. [Gaps & Recommended Changes](#17-gaps--recommended-changes)
18. [Workflow Summary](#18-workflow-summary)

---

## 1. What Problem This Solves

Indian battery manufacturers exporting to the EU face two separate compliance mandates simultaneously:

| Market | Mandate | Key Requirement |
|--------|---------|-----------------|
| India | BWM Rules 2022, BIS IS 16046, MoRTH AIS-156/038, CPCB EPR | EPR registration, BIS R-Number, domestic value addition (DVA), PLI eligibility |
| EU | Battery Regulation 2023/1542 (effective Feb 2027) | Digital Battery Passport, carbon footprint declaration, material composition, recycled content, three-tier data access |

The Passport Engine is the technical backbone that generates, manages, and validates a **Battery Digital Passport (BDP)** for every individual battery unit — covering both markets from a single platform. The core insight is that a passport must be:

- **Created** from a batch template with full specification metadata
- **Activated** only after compliance validation passes
- **Trackable** through its entire lifecycle (factory → customer → recycler)
- **Readable** at three different access tiers (public consumer, supply-chain partner, market regulator)
- **Auditable** via an immutable, tamper-proof event log

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  Dashboard · Batch creation · Passport viewer · QR scan page │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼─────────────────────────────────┐
│                   Backend API (Go / net/http)                │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Passport   │  │  Lifecycle   │  │   Carbon / BPAN /  │  │
│  │  Handlers   │  │  Handlers    │  │   QR / Telemetry   │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                │                    │              │
│  ┌──────▼────────────────▼────────────────────▼───────────┐ │
│  │              Services Layer                              │ │
│  │  LifecycleService · ActivationCompliance · BPANService  │ │
│  │  CarbonCalculator · QRService · TelemetryService        │ │
│  │  AuditExportService · ValidationService                 │ │
│  └──────────────────────────┬───────────────────────────── ┘ │
│                             │                                │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │           Repository (PostgreSQL / pgx)                │  │
│  │  passports · passport_events · batches · tenants       │  │
│  │  carbon_factors · telemetry_readings · magic_links     │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key packages:**

| Path | Responsibility |
|------|---------------|
| `backend/internal/handlers/passport_handlers.go` | GET /passports/{uuid} — three-tier data access |
| `backend/internal/handlers/lifecycle_handlers.go` | POST /passports/{uuid}/transition |
| `backend/internal/handlers/batch_handlers.go` | Batch CRUD + passport generation |
| `backend/internal/services/lifecycle.go` | State-machine engine |
| `backend/internal/services/activation_compliance.go` | Pre-activation gate |
| `backend/internal/services/bpan_service.go` | Serial number generation |
| `backend/internal/services/carbon_calculator.go` | EU carbon footprint calculation |
| `backend/internal/services/qr_service.go` | QR code PNG generation + ZIP |
| `backend/internal/services/event_hash.go` | SHA-256 hash chain for audit events |
| `backend/internal/services/telemetry_service.go` | BMS IoT data ingestion |
| `backend/internal/models/models.go` | All data models + lifecycle constants |
| `backend/internal/models/access_views.go` | Three-tier view builders |

---

## 3. The Passport Data Model

Every `Passport` record maps to **one physical battery unit**. It lives in the `passports` table and holds:

### 3.1 Identity Fields
```
UUID            — globally unique identifier (used in QR code URL)
SerialNumber    — BPAN V2 serial (e.g. IN-TEN-LFP-2026-00001)
ManufactureDate — legal manufacturing date
Status          — lifecycle state (enum, DB-constrained)
BatchID         — parent batch (contains shared specs)
```

### 3.2 Batch Specification (Inherited)
Stored in `batches.specs` as JSONB (`BatchSpec` struct). Each passport inherits these at creation time and a point-in-time `BatchSnapshot` is frozen onto the passport itself:

```
Chemistry           — LFP, NMC, NCA, LCO, etc.
NominalVoltage      — e.g. "3.7V"
Capacity            — e.g. "5000mAh"
Weight, CarbonFootprint, CountryOfOrigin
Manufacturer, ManufacturerAddress
MaterialComposition — Cobalt%, Lithium%, Nickel%, Graphite%, Lead%, Manganese% + recycled %
HazardousSubstances — REACH/RoHS lead/mercury/cadmium + declaration
Certifications      — CE, AIS-156, AIS-038, UL, IEC, etc.
ExpectedLifetimeCycles, WarrantyMonths, RecycledContentPct
```

### 3.3 Dynamic (Live) Fields — Updated over battery lifetime
```
StateOfHealth           — 0–100%, updated by BMS telemetry
CycleCount              — charge cycles
LastTemperature         — °C
LastVoltage             — V
ThermalEventCount       — running count of thermal events
ShippedAt, InstalledAt, ReturnedAt, RecycledAt — lifecycle timestamps
RepairEvents            — JSONB array of repair records
ReplacementEvents       — JSONB array of replacement records
OwnershipHistory        — JSONB audit trail of owner changes
CurrentOwnerIdentifier  — email or external ID of current owner
RecyclingStatus, RecyclerEprID, RecyclingDate — India EPR recycling
```

### 3.4 Traceability Fields
```
CSVSourceFilename, CSVRowIndex — provenance if imported via CSV upload
BatchSnapshot                  — frozen copy of specs at creation time
```

---

## 4. Passport Identity — BPAN Serial Numbers

**BPAN = Battery Passport Alphanumeric Number**

### Format: `{REGION}-{MFR}-{CHEM}-{YYYY}-{NNNNN}`

| Segment | Length | Example | Meaning |
|---------|--------|---------|---------|
| REGION | 2 chars | `IN` / `EU` / `GL` | Market region |
| MFR | 3 chars | `TEN` | Manufacturer code (derived from company name) |
| CHEM | 2–3 chars | `LFP` / `NMC` | Battery chemistry |
| YYYY | 4 digits | `2026` | Manufacturing year |
| NNNNN | 5 digits | `00001` | Zero-padded sequence |

**Example:** `IN-TEN-LFP-2026-00001`

The `BPANService` handles:
- `GenerateBPANv2(prefix, sequence)` — generates the serial
- `ParseBPAN(serial)` — reverse-parses any BPAN into components
- `ValidateBPANv2(serial, expectedRegion)` — validates format + region
- `DeriveManufacturerCode(companyName)` — auto-generates 3-char MFR code
- `MapChemistryCode(chemistry)` — normalises chemistry names to BPAN codes

When a QR code is scanned, the BPAN metadata (chemistry, year, manufacturer, region) is embedded as URL query params for lightweight pre-flight display before the full API response loads.

---

## 5. Three-Layer Data Access (EU Art 78)

The EU Battery Regulation (Art 78) mandates three distinct access levels for the Digital Battery Passport. This is implemented precisely in `passport_handlers.go` + `access_views.go`:

```
Requester               Auth Method                  View
─────────────────────────────────────────────────────────────────────
Consumer (public)       No auth                      PublicPassportView
Supply-chain partner    Bearer <magic_link_token>    PartnerPassportView
                        ?access_token=<token>
Market regulator        X-Regulator-Key: <key>       RegulatorPassportView
```

### Priority Order (detect highest available)
1. `X-Regulator-Key` header matched against `REGULATOR_API_KEY` env var (constant-time compare)
2. `?access_token=` query param → validated against `data_access_tokens` table (supports PARTNER or REGULATOR tier)
3. `Authorization: Bearer <token>` → validated as an unused magic-link token for this exact passport
4. Default: PUBLIC

### What Each Tier Sees

**PUBLIC** — Consumer-safe only:
- Battery chemistry, voltage, capacity, weight, carbon footprint
- Certifications, material composition, hazardous substances
- State of Health (SoH), manufacturer info
- India compliance fields (EPR number, BIS number, country of origin)

**PARTNER** — Everything in PUBLIC, plus:
- Ownership history and current owner identifier
- Lifecycle timestamps (shipped, installed, returned, recycled)
- Repair and replacement event arrays
- BMS telemetry summary (cycle count, last temperature/voltage)
- India recycling traceability (recycler EPR ID, recycling date)

**REGULATOR** — Full passport data plus:
- Complete immutable audit event log with hash chain
- All actor identity information (who did what, when, from where)
- IP addresses for all lifecycle transitions

---

## 6. Lifecycle State Machine

The lifecycle engine is the heart of the passport system. Every passport follows a strict state machine enforced at both the application and database levels.

### State Diagram

```
   CREATED
      │
      │ ACTIVATE (SYSTEM role)
      ▼
   ACTIVE ──────────────────────────┐
      │                             │
      │ SHIP (INTERNAL_OPERATOR     │
      │       or LOGISTICS)         │ RECALL (ADMIN role)
      ▼                             │
   SHIPPED ─────────────────────────┤
      │                             │
      │ INSTALL (TECHNICIAN)        │
      ▼                             │
  IN_SERVICE ──────────────────────►│
                                    ▼
                                 RECALLED
                                    │
                          ┌─────────┴──────────┐
                          │ RECYCLE (RECYCLER)  │ CLOSE (SYSTEM/RECYCLER)
                          ▼                     ▼
                       RECYCLED            END_OF_LIFE
                          │
                          │ CLOSE
                          ▼
                      END_OF_LIFE
```

### Transition Validation (all enforced in `LifecycleService.ApplyTransition`)

1. **Actor context completeness** — ActorID, ActorType, ActorRole, Source must all be present
2. **Actor context consistency** — SYSTEM actors must have role=SYSTEM and source=INTERNAL; PARTNER actors must come from MAGIC_LINK
3. **Action validity** — must be one of: ACTIVATE, SHIP, INSTALL, RECYCLE, CLOSE, RECALL
4. **Role authorization** — each action has a whitelist of allowed roles (see table below)
5. **State allowance** — action must be valid from the current passport status
6. **Evidence validation** — SHIP, INSTALL, RECYCLE, RECALL each require specific evidence fields

### Role × Action Matrix

| Action | Allowed Roles |
|--------|---------------|
| ACTIVATE | SYSTEM |
| SHIP | INTERNAL_OPERATOR, LOGISTICS |
| INSTALL | TECHNICIAN |
| RECYCLE | RECYCLER |
| CLOSE | SYSTEM, RECYCLER |
| RECALL | ADMIN |

### Evidence Requirements

| Action | Required Evidence Fields |
|--------|--------------------------|
| SHIP | `shipment_reference`, `shipment_date` |
| INSTALL | `installation_date`, `installer_id` |
| RECYCLE | `recycler_epr_id`, `recycling_date`, `certificate_reference` |
| RECALL | `recall_reason`, `recall_reference` |
| ACTIVATE | None |
| CLOSE | None |

Evidence dates are validated to ISO 8601 / RFC3339. Unknown evidence keys are rejected. Evidence is embedded immutably in the audit event metadata.

---

## 7. Immutable Audit Trail & Hash Chain

Every lifecycle transition writes an immutable `PassportEvent` record. The events form a **tamper-evident hash chain** (similar to a simplified blockchain):

### How the Chain Works

```
Event 1: hash(event1_data + "")           → H1
Event 2: hash(event2_data + H1)           → H2  (previous_hash = H1)
Event 3: hash(event3_data + H2)           → H3  (previous_hash = H2)
```

Each event's `Hash` field is SHA-256 of a deterministic JSON serialisation of all event fields + the `previous_hash` of the prior event. This means:

- Modifying any past event invalidates all subsequent hashes
- The full chain can be verified with `VerifyEventChain(events)`
- Database triggers enforce event immutability (no UPDATE or DELETE on `passport_events`)

### Event Fields

```
ID, PassportID, EventType, Action
Actor (who), ActorType, ActorRole, ActorID
Source (INTERNAL | MAGIC_LINK)
StatusFrom, StatusTo
IPAddress
Metadata (JSON — includes evidence, owner info)
CreatedAt
Hash, PreviousHash
```

### Event Types
`CREATED`, `IMPORTED`, `TRANSFERRED`, `STATUS_CHANGED`, `SCANNED`, `SHIPPED`, `INSTALLED`, `RECALLED`, `RECYCLED`, `END_OF_LIFE`, `THERMAL_EVENT`

---

## 8. Activation Compliance Gate

Before any batch can be activated (`ACTIVATE` action), `ValidateActivationCompliance()` runs a market-specific checklist. Failure **blocks** activation.

### Common Required Fields (all markets)
- `batch.model_name`
- `batch.specs.chemistry`
- `batch.specs.capacity`
- `batch.manufacturing_start_date` + `manufacturing_end_date`

### India-Specific Gates (`MarketRegionIndia` or `MarketRegionGlobal`)
- `tenant.epr_registration_number` (CPCB EPR)
- `tenant.bis_r_number` (BIS CRS)
- `tenant.iec_code` (Import Export Code)
- `tenant.morth_manufacturer_code` (MoRTH)
- `batch.cell_source` (IMPORTED or DOMESTIC)
- If `cell_source = IMPORTED`: `bill_of_entry_no`, `country_of_origin`, `customs_date`
- If `cell_source = DOMESTIC`: `domestic_value_add > 0`
- PLI claim: `domestic_value_add >= 50%`
- Safety certifications: `AIS-156` (traction battery type-approval) and `AIS-038` rev.2

### EU-Specific Gates (`MarketRegionEU` or `MarketRegionGlobal`)
- `tenant.company_name`, `address`, `eu_authorized_representative_name/address/email`
- `batch.carbon_footprint_result` (must use the calculator — free text is rejected)
- `batch.specs.material_composition` (at least one non-zero critical material %)
- `batch.specs.hazardous_substances.declaration`
- `batch.specs.expected_lifetime_cycles > 0`
- `batch.specs.warranty_months > 0`
- **Soft warnings** (non-blocking): recycled content per material (Co, Li, Ni, Pb) for EU 2030 targets

---

## 9. Carbon Footprint Calculator

Implements EU Battery Regulation Art 7 — declared carbon footprint using JRC-aligned factors.

### Input Parameters (BOM-based)

```
chemistry           — LFP, NMC_622, NMC_811, NCA, LCO, SODIUM
capacity_kwh        — battery pack capacity
cell_source_country — ISO Alpha-2 (CN, IN, KR, etc.)
factory_country     — assembly location
assembly_energy_kwh — energy consumed in assembly per pack
transport_mode      — SHIP, RAIL, TRUCK, AIR
transport_distance_km
battery_weight_kg
```

### Calculation Steps
```
cellCO2       = chemistry_factor × capacity_kWh
cellEnergyCO2 = grid_factor(cell_source_country) × assembly_energy_kWh
assemblyCO2   = grid_factor(factory_country) × assembly_energy_kWh
transportCO2  = transport_factor × (weight_kg/1000) × distance_km
TOTAL         = sum of above
```

### Output
```json
{
  "total_kg_co2e": 385.5,
  "per_kwh_kg_co2e": 65.2,
  "breakdown": { "cell_production_kg_co2e": ..., "assembly_kg_co2e": ..., "transport_kg_co2e": ... },
  "methodology": "JRC_2024_DECLARED",
  "calculation_date": "2026-03-29",
  "declaration_text": "...",
  "factors_used": [...]
}
```

The result is stored as JSONB in `batches.carbon_footprint_result` and is mandatory for EU activation. The `per_kwh_kg_co2e` value is also embedded in QR code URLs.

---

## 10. QR Code Generation

Every passport gets a 256×256 PNG QR code generated by the `QRService`.

### QR URL Format

**Legacy / simple serial:**
```
https://app.anvayalabs.in/p/{passport-uuid}
```

**BPAN V2 serial (enriched):**
```
https://app.anvayalabs.in/p/{uuid}?bpan=IN-TEN-LFP-2026-00001&chem=LFP&yr=2026&mfr=TEN&rgn=IN
```

**EU with carbon footprint:**
```
https://app.anvayalabs.in/p/{uuid}?bpan=...&co2=65.20
```

The query parameters allow the frontend to display basic battery info (chemistry, year, manufacturer) before the full API response loads — useful for low-connectivity scanning scenarios.

### Bulk Generation
QR codes are generated in parallel (up to 20 goroutines) with a 5-minute timeout and packaged into a ZIP archive for batch download. A 500-passport limit per download prevents memory exhaustion.

---

## 11. BMS Telemetry Ingestion

Enables real-time battery health monitoring, a mandatory EU requirement for the "dynamic data" portion of the battery passport.

### Ingestion Flow
1. BMS device authenticates with a `DeviceToken` (scoped to a specific passport)
2. `POST /api/v1/telemetry` with readings
3. `TelemetryService.Ingest()` validates the payload, stores to `telemetry_readings`, and updates `passports` dynamic fields
4. Automatic `PassportEvent` is created for thermal events

### Ingest Payload
```json
{
  "passport_id": "uuid",
  "state_of_health": 94.5,
  "cycle_count": 142,
  "temperature": 28.3,
  "voltage": 48.2,
  "current": 12.5,
  "thermal_event": false,
  "recorded_at": "2026-03-29T08:00:00Z"
}
```

### Validations
- `recorded_at` cannot be in the future
- At least one measurement field must be present
- Device token must be valid and scoped to the passport

---

## 12. Magic-Link External Access

Magic links provide **time-limited, single-use, role-bound** access tokens for external partners (logistics, technicians, recyclers) who do not have platform accounts.

### Token Properties
- Single-use (marked used after first valid consumption)
- Action-bound (token is tied to a specific action, e.g. SHIP)
- Role-bound (token carries the role e.g. LOGISTICS)
- Time-limited (expiry timestamp)
- Passport-specific (only valid for one passport UUID)

### Validation Order
1. Token exists in `magic_links` table
2. Token is not already used
3. Token is not expired
4. Action in request matches token's bound action
5. Role in token matches action's allowed-role list

This prevents token reuse, scope escalation, and impersonation attacks.

---

## 13. Dual-Mode: India + EU Compliance

The platform supports three market modes set per-batch via `market_region`:

| Mode | Scope |
|------|-------|
| `INDIA` | India BWM/BIS/EPR/MoRTH rules only |
| `EU` | EU Battery Regulation 2023/1542 only |
| `GLOBAL` | Both India AND EU — strictest of both |

### India Compliance Chain
- **EPR** (CPCB): Verified via `EPRRegistrationNumber` regex `^B-[0-9]{5}/[0-9]{4}-[0-9]{2}/CPCB$`
- **BIS R-Number**: Verified via `^R-[0-9]{8}$`
- **IEC Code** (Import/Export): Verified via `^[A-Z]{5}[0-9]{4}[A-Z]$`
- **HSN Code**: `^8507[0-9]{4}$` (battery-specific HS chapter)
- **DVA** (Domestic Value Addition): Stored as literal percentage; PLI eligibility requires ≥50%
- **AIS-156 / AIS-038**: Safety type-approval certifications (hard requirement)
- **EPR Obligation Tracking**: Service tracks recycling obligations per batch

### EU Compliance Chain
- **Carbon Footprint**: Calculated via JRC methodology, stored as JSONB, embedded in passport
- **Material Composition**: Critical raw material percentages (Co, Li, Ni, Graphite, Mn, Pb)
- **Recycled Content**: Per-material recycled %, with soft warnings for 2030 targets (Co ≥16%, Li ≥6%, Ni ≥6%, Pb ≥85%)
- **EU Representative**: Mandatory for non-EU manufacturers
- **Three-Tier Access**: Full Art 78 implementation

---

## 14. Audit Export (CSV / PDF)

The `AuditExportService` generates compliance-ready exports of all lifecycle events for a batch:

- **CSV**: All `passport_events` for all passports in a batch, joined with serial numbers, ordered chronologically
- **PDF**: Formatted PDF report using `gofpdf`

Both formats are used for:
- Regulatory submission to CPCB/BIS/EU market surveillance
- Internal compliance audits
- Due diligence packs for export customers

The hash and previous_hash are included in exports to allow regulators to verify chain integrity independently.

---

## 15. Database Schema Evolution

The database schema is managed with numbered SQL migrations (`000001` → `000038`). Key milestones:

| Migration | Purpose |
|-----------|---------|
| 000001 | Base schema: tenants, batches, passports |
| 000004 | Dual-mode (INDIA/EU/GLOBAL) |
| 000007 | India compliance fields |
| 000012 | Enterprise lifecycle (state machine, actor roles) |
| 000019 | Passport event hash chain |
| 000024 | EU compliance alignment |
| 000026 | Passport state lockdown (DB CHECK constraint on status values) |
| 000027 | Audit events hard immutability (DB trigger) |
| 000028 | Magic-link hardening (single-use enforcement) |
| 000031 | Carbon calculator + carbon_factors table |
| 000032 | BPAN V2 serial numbers |
| 000033 | BMS telemetry readings table |
| 000034 | Data access tokens (PARTNER/REGULATOR tier) |
| 000036 | Per-field data visibility settings (JSONB) |
| 000038 | Email verification |

---

## 16. Expert Assessment — What Is Correctly Implemented

The following are **correctly and solidly implemented** based on code review:

### ✅ Lifecycle State Machine
The transition engine in `lifecycle.go` is clean, complete, and properly layered:
- Single source of truth for `TransitionMap` and `AllowedRolesByAction`
- Validation runs in correct sequence (actor → action → state → evidence)
- Timestamps are auto-applied from evidence dates (or now as fallback)
- Hash chain is built atomically before persistence

### ✅ Three-Tier Data Access (EU Art 78)
The implementation in `passport_handlers.go` + `access_views.go` is textbook-correct:
- Priority ordering (Regulator > Partner > Public) is right
- Constant-time comparison for regulator key (prevents timing attacks)
- Clean separation of data at each tier — no sensitive data leaks into public views
- Graceful degradation (regulator view served even if events query fails)

### ✅ Immutable Hash Chain
SHA-256 chained hashing with deterministic JSON serialisation is correctly implemented:
- `PreviousHash` linkage is maintained
- `VerifyEventChain` can validate the entire chain
- DB trigger enforces immutability at the storage layer

### ✅ Activation Compliance Gate
The gate correctly blocks activation when compliance data is missing, and is market-region-aware. The PLI ≥50% DVA check and the AIS-156/AIS-038 certificate enforcement are correctly implemented.

### ✅ BPAN V2 Serial Numbers
Region-aware serial generation is well-designed:
- Format encodes useful metadata (region, manufacturer, chemistry, year) for QR scan pre-display
- `DeriveManufacturerCode` handles edge cases (short names, non-letter chars)
- Carbon footprint embedded in QR URL for EU use case

### ✅ Carbon Calculator
JRC-aligned methodology with database-stored factors is a strong approach:
- Factors are storable and updatable without code changes
- Per-kWh breakdown is the correct EU declaration format
- Factors audit trail (`factors_used` array) enables future regulatory verification

### ✅ Dual-Mode Compliance
India + EU in a single batch model is well-structured. Market region drives validation branching cleanly, and GLOBAL mode correctly applies both rule sets.

### ✅ Magic-Link Security
Single-use, action-bound, role-bound tokens with correct validation order prevent all common token abuse patterns.

---

## 17. Gaps & Recommended Changes

These are real gaps found during review that need attention:

### 🔴 Critical

**1. Hash chain does not include the genesis (CREATED) event**
The `previous_hash` for the very first event in a passport's chain is an empty string `""`. There is no anchor/seed value. A sophisticated attacker could prepend fabricated events.  
**Fix:** Use the passport UUID as the seed hash for the first event, e.g. `PreviousHash = sha256(passport_uuid)`.

**3. Recycled content soft warnings should become hard blocks on EU activation post-2030**  
Currently `RecycledCobaltPct`, `RecycledLithiumPct`, etc. are soft warnings. The EU mandates these as hard requirements from 2030.  
**Fix:** Add a `complianceDate`-aware check that escalates these to blocking errors after 2030-01-01.

### 🟡 Important

**4. No `REPAIR` or `REPLACE` lifecycle actions despite `RepairEvents` and `ReplacementEvents` fields**  
The passport model stores `repair_events` and `replacement_events` arrays (EU mandatory dynamic data), and the `PartnerPassportView` exposes them. However, no `REPAIR` or `REPLACE` lifecycle action exists in `TransitionMap` or `AllowedRolesByAction`.  
**Fix:** Add `REPAIR` (allowed from `IN_SERVICE`, role: `TECHNICIAN`) and `REPLACE` (same) actions that append to the respective arrays without changing the main status.

**5. Telemetry `StateOfHealth` updates do not write to the audit event log**  
SoH updates from BMS devices update `passports.state_of_health` directly. Only thermal events generate `PassportEvent` records. For EU compliance, SoH must be traceable.  
**Fix:** Create a `SOH_UPDATED` passport event type whenever SoH changes by more than a configurable threshold (e.g. ≥5% change).

**6. `DataVisibility` JSONB config is stored but not enforced at the API tier**  
The `Tenant.DataVisibility` field and migration `000036` indicate per-field visibility configuration exists. However, the `BuildPublicView` and `BuildPartnerView` functions do not read or apply this config — every tenant exposes the same fields.  
**Fix:** Pass the tenant's `DataVisibility` config into view builders and conditionally omit fields marked as hidden.

**7. No per-field `data_visibility` enforcement on the public passport endpoint**  
Related to above: the public endpoint (`GetPassport` with no auth) does not load the tenant's visibility config before building the public view.  
**Fix:** Load tenant visibility config in `GetPassport` and pass it to `BuildPublicView`.

**8. `SHIP` action missing RECALLED → SHIPPED re-export path**  
A recalled battery that has been cleared may need to be re-shipped. The current `TransitionMap` does not allow `SHIP` from `RECALLED`.  
**Fix:** Consider whether RECALLED → ACTIVE → SHIPPED is the correct remediation path, or add it as a special admin-authorized re-export action.

### 🟢 Low Priority / Improvements

**9. OpenAPI spec is not wired to a UI**
`backend/api/openapi.yaml` exists but is not served at any URL.  
**Fix:** Mount Swagger UI at `/api/docs`.

**11. Email HTML is hardcoded in strings**  
`internal/services/email.go` contains raw HTML in Go strings.  
**Fix:** Move to `html/template` files in `internal/templates/`.

**12. Missing `CLOSE` role assignment for manual end-of-life**  
`CLOSE` is allowed for `SYSTEM` and `RECYCLER`. There is no path for an ADMIN to manually close a passport (e.g. after a RECALLED battery is destroyed, not recycled).  
**Fix:** Add `ADMIN` to the allowed roles for `CLOSE`.

---

## 18. Frontend Coverage

The frontend (Next.js 16 / React 19 / Tailwind / shadcn/ui) implements most of the passport engine surface, but several backend capabilities have no UI yet:

### ✅ Frontend — Implemented
| Feature | Page / Component |
|---------|-----------------|
| Public passport viewer (three-tier) | `app/p/[uuid]/page.tsx` + `components/passport/passport-view.tsx` |
| Multi-language display (EN, FR, DE) | `lib/i18n/` — per EU label requirements |
| Batch creation + spec entry | `app/(dashboard)/batches/` |
| CSV upload + validation preview | `app/(dashboard)/batches/[id]/page.tsx` |
| QR code download (ZIP) | Batch detail page |
| Label PDF download (multi-language) | Batch detail page |
| Lifecycle transitions dashboard | Batch / passport detail |
| Magic-link partner access | `app/(dashboard)/partners/page.tsx` |
| India compliance settings (BIS, EPR, IEC, MoRTH) | `app/(dashboard)/settings/page.tsx` |
| EU authorized representative settings | Settings page |
| QR scan analytics (heatmap, geo) | `app/(dashboard)/analytics/page.tsx` |
| Team management + role assignment | `app/(dashboard)/team/page.tsx` |
| API keys for ERP integration | `app/(dashboard)/developer/page.tsx` |

### ❌ Frontend — Missing (backend ready, no UI)
| Feature | Gap | Impact |
|---------|-----|--------|
| **Carbon Calculator** | No UI form for `POST /api/v1/carbon/calculate` | EU activation blocked — manufacturer cannot fill mandatory `carbon_footprint_result` without CLI/Postman |
| **Telemetry Chart** | `telemetry-chart.tsx` is partial — SoH/cycle/temperature history not rendered | EU dynamic data visibility incomplete |
| **Data Access Token Management** | No UI for creating/revoking PARTNER or REGULATOR access tokens | Regulators must use raw API calls |
| **Audit Chain Verification UI** | `GET /passports/{uuid}/verify-chain` endpoint exists but no frontend panel | Regulators cannot verify integrity without API access |

---

## 19. Feature Maturity Summary

| Feature | Backend | Frontend | Tests | Compliance Target |
|---------|---------|----------|-------|------------------|
| UUID generation + QR codes | ✅ Done | ✅ Done | ✅ | EU Art 77 |
| Lifecycle state machine | ✅ Done | ✅ Done | ✅ 5 files | EU / India |
| Tamper-proof audit trail (hash chain) | ✅ Done | ❌ No UI | ✅ 1 file | EU Art 78 |
| Hash chain verify endpoint | ✅ Done | ❌ No UI | — | EU Art 78 |
| BPAN V2 serial numbers | ✅ Done | ✅ Done | ✅ 1 file | India Battery Aadhaar |
| Three-tier data access (Art 78) | ✅ Done | ⚠️ No token mgmt UI | ❌ 0 | EU Art 78 |
| Carbon footprint calculator (JRC) | ✅ Done | ❌ No UI | ✅ 1 file | EU Art 7 |
| BMS telemetry ingestion | ✅ Done | ⚠️ Partial chart | ❌ 0 | EU Art 77 |
| Magic-link external access | ✅ Done | ✅ Done | ✅ 1 file | EU Art 78 |
| CSV batch upload + traceability | ✅ Done | ✅ Done | ✅ 1 file | — |
| India compliance (PLI/BIS/EPR/DVA) | ✅ Done | ✅ Done | ✅ 1 file | India BWM / BIS |
| EU authorized representative | ✅ Done | ✅ Done | ❌ 0 | EU Art 77 |
| Material composition (Art 8) | ✅ Done | ✅ Done | ❌ 0 | EU Art 8 |
| Recycled content per-material | ✅ Done | ✅ Done | ❌ 0 | EU Art 8 (2030) |
| Label PDF (multi-language) | ✅ Done | ✅ Done | ❌ 0 | EU label requirement |
| Async export jobs | ✅ Done | ✅ Done | ❌ 0 | UX |
| Audit CSV/PDF export | ✅ Done | ✅ Done | ❌ 0 | Regulatory submission |
| Compliance declaration PDF (Art 7) | ✅ Done | ✅ Done | ❌ 0 | EU Art 7 |
| Quota + billing (Razorpay) | ✅ Done | ✅ Done | ❌ 0 | Monetization |

---

## 20. Workflow Summary

The complete end-to-end lifecycle of a passport:

```
1. Manufacturer creates a TEMPLATE (product SKU) with specs
   └── market_region, chemistry, voltage, capacity, material composition, certifications

2. Manufacturer creates a BATCH from a template
   └── Add manufacturing dates, cell source, carbon footprint, DVA, HSN, EPR/BIS numbers

3. Manufacturer uploads passports to the batch
   └── Via CSV upload or API — each row = one battery unit
   └── BPAN V2 serial numbers auto-generated per unit
   └── Status = CREATED

4. Compliance gate runs (ValidateActivationCompliance)
   └── Checks all mandatory fields for target market region
   └── Returns missing/error list if incomplete

5. Batch ACTIVATED (all passports → ACTIVE)
   └── SYSTEM actor triggers bulk ACTIVATE
   └── Quota deducted from tenant account
   └── Audit event written with hash chain

6. QR codes generated
   └── Per-passport PNG QR codes with BPAN-enriched URLs
   └── Bulk ZIP download for attachment to physical batteries

7. Battery SHIPPED (ACTIVE → SHIPPED)
   └── Logistics partner uses magic-link or internal operator uses dashboard
   └── Evidence: shipment_reference + shipment_date
   └── ShippedAt timestamp recorded

8. Battery INSTALLED (SHIPPED → IN_SERVICE)
   └── Technician uses magic-link
   └── Evidence: installation_date + installer_id
   └── InstalledAt timestamp recorded

9. BMS Telemetry ingested (ongoing while IN_SERVICE)
   └── SoH, cycle count, temperature, voltage updated on passport
   └── Thermal events auto-generate PassportEvent records

10. QR code scanned by end user / regulator
    └── GET /passports/{uuid} → tier determined by auth headers
    └── Public: basic specs + SoH
    └── Partner: + ownership, repair, telemetry
    └── Regulator: + full audit event log with hash chain

11. Battery RECYCLED (IN_SERVICE or RECALLED → RECYCLED)
    └── Authorized recycler (EPR ID required in evidence)
    └── RecycledAt + RecyclerEprID + RecyclingDate recorded
    └── India EPR obligation tracking updated

12. Passport CLOSED (RECYCLED → END_OF_LIFE)
    └── Final state — no further transitions possible
    └── Full audit trail exportable for regulatory submission
```

---

*Document generated by expert review of the AnvayaLabs Battery codebase. For corrections or updates, edit this file and reference the relevant source files noted above.*

