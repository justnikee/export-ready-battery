# Document 1: Product Requirements Document (PRD)
## ExportReady / ExportLens — Battery Digital Product Passport Platform
**Version:** Derived from codebase as of 2026-07-15  
**Module:** `github.com/anvayalabs/battery-api` (Go 1.24.3) · `@anvaya/battery-web` (Next.js 16 / React 19)

---

## 1. Executive Summary

### What ExportReady Does

ExportReady (also branded ExportLens) is a **B2B SaaS compliance and lifecycle traceability platform for battery exports**. Its core product is a **Battery Digital Product Passport (DPP)** — a structured, machine-readable identity record that tracks every battery unit from raw material sourcing through manufacturing, export, field operation, and end-of-life recycling.

### Core Problem Solved

| Pain Point | Without ExportReady | With ExportReady |
|---|---|---|
| EU market access | DPP required from Feb 2027 for EV batteries; exporters have no compliant tool | Full EU 2023/1542-aligned passport generated per battery unit |
| India regulatory burden | Manual filing of BIS, EPR, AIS-156, PLI paperwork | Automated validation and PDF generation for all Indian authorities |
| Supply chain opacity | No auditable link between cells, packs, and downstream use | Immutable blockchain-anchored event ledger per unit |
| Carbon disclosure | No standardised calculator for JRC-aligned LCA | Integrated JRC 2024 methodology carbon calculator with EU class A–G output |
| Export incentive claims | Manual DGFT worksheet preparation | Automated RODTEP/RoDTEP/MEIS claim estimation and document assembly |

---

## 2. User Personas

Personas are derived directly from the authentication, role, and lifecycle systems in the codebase.

### 2.1 Internal Tenant Personas

| Persona | System Role | Key Permissions (from `models/team_member.go`) |
|---|---|---|
| **Company Owner** | `OWNER` | Full access: delete org, manage billing, all data, lifecycle actions |
| **Compliance Admin** | `ADMIN` | Manage team, full batch/passport access, RECALL lifecycle action |
| **Operations Member** | `MEMBER` | Create/edit batches, SHIP lifecycle action (maps to `INTERNAL_OPERATOR` actor role) |
| **Read-Only Auditor** | `VIEWER` | Read-only access to all data |

**Plan-based seat limits** (from `models/team_member.go`):

| Plan | Max Seats |
|---|---|
| STARTER | 2 |
| GROWTH | 10 |
| ENTERPRISE | 100 |

### 2.2 External Partner Personas

Authenticated via **Magic Link tokens** or **scoped API keys** (from `handlers/magic_link_handlers.go` and `models/models.go`):

| Persona | Actor Role | Actions Permitted |
|---|---|---|
| **Logistics Partner** | `LOGISTICS` | SHIP, REUSE |
| **Field Technician** | `TECHNICIAN` | INSTALL, REMANUFACTURE, REPURPOSE, SoH readings |
| **Recycler** | `RECYCLER` | RECYCLE, CLOSE, REMANUFACTURE, REPURPOSE |
| **EU Buyer / Regulator** | `EXTERNAL` (read-only) | Public scan of passport DPP data |
| **Supplier (Portal)** | Supplier JWT | Upload CoC, audit reports, CMRT files |

### 2.3 System Actors

- **System**: Auto-activates passports on batch activation. Only `SYSTEM` role can perform `ACTIVATE`.
- **Regulator API**: A dedicated API key (`regulatorAPIKey`) grants read-only access to field geolocation data under Art. 78 GDPR scope.

---

## 3. Core Features (Implemented in Codebase)

### 3.1 Batch Management (Product SKU Definition)

**Source:** `handlers/batch_handlers.go`, `models/models.go`

- Create, update, and soft-delete production batches (status: `DRAFT → ACTIVE → ARCHIVED`).
- **Dual-mode compliance:** Each batch targets a `MarketRegion` — `INDIA`, `EU`, or `GLOBAL`.
- **Batch Specs** stored as JSONB (`BatchSpec`) supporting: chemistry, voltage, capacity, weight, material composition, carbon footprint, performance specs, BOM, supply chain provenance.
- Batch **Templates** allow reusable product SKU specs.
- **Security override layer**: Server enforces PLI/DVA to zero for IMPORTED cells regardless of client input.
- **CSV bulk import**: Upload a CSV to create hundreds of passports in one operation.
- **GS1 GTIN support** per batch for EU DL-compliant QR codes.

### 3.2 Digital Passport Generation

**Source:** `services/passport_service.go`, `services/bpan_service.go`, `models/models.go`

- Each passport is a unique unit-level record linked to its parent batch.
- **BPAN V2 Serial Number** format: `{REGION}-{MFR}-{CHEM}-{YYYY}-{NNNNN}` (e.g., `IN-TEN-LFP-2026-00001`).
  - Region prefix: `IN` (India), `EU` (EU), `GL` (Global).
  - Manufacturer code: auto-derived from company name (3-char uppercase).
  - Chemistry code: normalized from freetext (LFP, NMC, NCA, LCO, LTO, LMO, NAI, LIO, UNK).
- **Battery Passport ID**: EU Implementing Reg 2024/1715 format for EU-specific passports.
- Immutable **batch snapshot** stored at passport creation time.

### 3.3 Lifecycle State Machine

**Source:** `models/models.go` (`BatteryTransitionMap`, `BatteryAllowedRolesByAction`), `services/lifecycle.go`

Full state machine documented in Document 2.

### 3.4 Compliance Engine

**Source:** `services/compliance_score.go`, `compliance/battery/eu.go`, `compliance/battery/india.go`, `lib/activation-blockers.ts`

- **56-attribute EU BatteryPass checklist** (EU-1 to EU-56) scored 0–100%.
- **EU Validator**: 15 hard checkpoints covering Art. 7, 8, 11, REACH.
- **India Validator**: 15+ checkpoints covering AIS-156, AIS-038, BIS CRS IS 16046, EPR (BWM Rules 2022), PLI Phase II, MoRTH.
- **Live dry-run check** available before batch creation via `POST /api/v1/compliance/check`.
- **Activation gate**: merged client-side (`activation-blockers.ts`) + server-side (`activation_compliance.go`) blocker lists.
- **Compliance Report PDF** downloadable per batch.

### 3.5 Carbon Footprint Calculator

**Source:** `services/carbon_calculator.go`

- JRC 2024 methodology: calculates total kgCO2e from cell production, cell energy (grid), assembly, transport, EOL recycling.
- Inputs: chemistry, capacity (kWh), cell source country, factory country, assembly energy, transport mode/distance/weight.
- Output: `total_kg_co2e`, `per_kwh_kg_co2e`, **EU class A–G** (thresholds: A ≤40, B ≤60, C ≤80, D ≤100, E ≤120, F ≤150, G >150 kgCO2e/kWh), full breakdown, legal declaration text, audit trail of factors.

### 3.6 DVA (Domestic Value-Add) Calculator — PLI

**Source:** `handlers/batch_handlers.go`, `services/batch_creation_validator.go`

- **MHI PLI-ACC formula**: calculates DVA from cost breakdown (cell, BMS, casing — domestic vs. imported — plus labour/overhead).
- **DVA Source**: `ESTIMATED` (calculated) or `AUDITED` (CA-certified, uploaded as PDF).
- PLI compliance threshold: ≥50% DVA.
- Hard server-side blocks: DVA forced to 0 for IMPORTED cells.

### 3.7 DGFT Export Incentive Claims

**Source:** `handlers/dgft_claim_handlers.go`, `services/dgft_calculator.go`, `services/dgft_document_service.go`

- Manage RODTEP/MEIS/RoSCTL claims per batch.
- Fields: HSN code, destination country, export value (INR), export quantity, claim period.
- Estimate claim amount; assemble supporting documents.
- Document types tracked: invoice, shipping bill, bank realisation certificate, test reports.

### 3.8 Supplier Portal & Due Diligence Engine

**Source:** `handlers/supplier_handlers.go`, `handlers/due_diligence_handlers.go`, `models/models.go`

- Invite upstream suppliers by email; suppliers get a separate JWT-authenticated portal.
- Supplier uploads: CoC, audit reports, provenance files, MSDS, CMRT/CRT Excel reports.
- **OECD 5-step due diligence tracking**: steps `policy → identify → assess → respond → audit`, each with status `not_started / in_progress / complete / failed`.
- **Risk profiles**: country risk tier, mineral risk flags, RMAP validity, last audit date.
- **Corrective actions**: severity `low / medium / high / critical`, status `open → remediated → verified → escalated → closed`.
- **CMRT parsing**: extracts smelter list, RMI conformance %, unknown smelters count.

### 3.9 EPR (Extended Producer Responsibility) Module

**Source:** `handlers/epr_handler.go`, `services/epr_obligation_service.go`, `handlers/epr_certificate_handler.go`

- Track EPR obligation per financial year per battery category.
- Fields: obligation_kg, fulfilled via recycling/refurbishment, net obligation, shortfall, ECC (Extended Producer Responsibility Certificate) amount.
- Upload EPR certificates from CPCB-registered recyclers.
- **CPCB Export**: generates CPCB-format reports (`handlers/cpcb_export_handler.go`).

### 3.10 Fleet & Telemetry

**Source:** `handlers/fleet_handlers.go`, `handlers/telemetry_handlers.go`, `services/telemetry_service.go`

- Track batteries deployed in a fleet.
- **IoT telemetry ingestion**: SoH, cycle count, temperature, voltage, current, thermal events via device tokens.
- **SoH history**: time-series of State of Health readings per passport.
- Geolocation history per lifecycle event.

### 3.11 Magic Link Partner Access

**Source:** `handlers/magic_link_handlers.go`, `services/lifecycle.go`

- Issue time-limited, role-scoped magic link tokens to external partners (logistics, technician, recycler).
- Optionally enforce OTP (one-time password) verification.
- Allows partners to perform lifecycle actions or SoH updates without a full account.

### 3.12 Verifiable Credentials & Blockchain Anchoring

**Source:** `services/vc_crypto_service.go`, `services/opentimestamps.go`, `handlers/vc_handlers.go`, `handlers/certificate_anchor_handlers.go`

- **W3C Verifiable Credentials** with Ed25519 DID + LD-Proof signatures for passports.
- **OpenTimestamps** anchoring: SHA-256 hash of certificates committed to the Bitcoin blockchain.
- Certificate types anchored: BIS, UN38.3, IEC_62133, MSDS, DOC, PLI.

### 3.13 Mass Balance

**Source:** `handlers/mass_balance_handlers.go`

- Track material mass balance across production batches (Growth plan feature).

### 3.14 AI Features

**Source:** `handlers/ai_handlers.go`, `services/ai_service.go`, `services/ai_validation.go`

- AI-assisted compliance gap analysis.
- AI call logging and parse caching for regulatory text queries.

### 3.15 Developer Platform

**Source:** `handlers/apikey_handlers.go`, `handlers/outbound_webhook_handlers.go`

- **Scoped API keys**: `role`, `rate_limit_tier`, `expires_at`, last-used tracking.
- **Outbound webhooks**: subscribe to lifecycle events (ACTIVATED, SHIPPED, INSTALLED, RECALLED, RECYCLED).
- **GS1 EPCIS 2.0 export**: JSON-LD document export of lifecycle events mapped to CBV bizStep URNs.
- TALLY integration (referenced in entitlements).

### 3.16 Billing & Monetization

**Source:** `handlers/billing_handlers.go`, `handlers/razorpay_handlers.go`, `services/razorpay_service.go`

- Razorpay payment gateway integration (India).
- Quota system: passport activation slots debited per activated passport.
- Plans: `STARTER` (2 seats, core features), `GROWTH` (10 seats, adds EU compliance, due diligence, DGFT, fleet, telemetry, webhooks, regulatory), `ENTERPRISE` (100 seats, adds SSO, multi-entity, advanced analytics).

### 3.17 Proactive Alerts

**Source:** `services/alerts.go`, `handlers/alert_handlers.go`

- Alert types: `CERTIFICATE_EXPIRY`, `COMPLIANCE_DEGRADED`, `QUOTA_LOW`.
- Severity: `INFO`, `WARNING`, `CRITICAL`.
- Delivered in-app and by email.

---

## 4. Dashboard Navigation Map (from `apps/battery-web/app/dashboard/`)

| Route | Feature |
|---|---|
| `/dashboard/batches` | Batch management |
| `/dashboard/lifecycle` | Passport lifecycle management |
| `/dashboard/compliance` | Compliance dashboard |
| `/dashboard/eu-compliance` | EU-specific compliance (Growth) |
| `/dashboard/carbon-calculator` | Carbon footprint calculator |
| `/dashboard/dgft-claims` | DGFT export claims |
| `/dashboard/mass-balance` | Mass balance tracker (Growth) |
| `/dashboard/due-diligence` | Supplier due diligence (Growth) |
| `/dashboard/fleet` | Fleet management (Growth) |
| `/dashboard/telemetry` | IoT telemetry (Growth) |
| `/dashboard/partners` | Magic link partner management (Growth) |
| `/dashboard/regulatory` | Regulatory rules & deadlines (Growth) |
| `/dashboard/analytics` | Analytics |
| `/dashboard/developer` | API keys & webhooks (Growth) |
| `/dashboard/team` | Team member management |
| `/dashboard/billing` | Billing & quota |
| `/dashboard/settings` | Profile & compliance credentials |
| `/dashboard/templates` | Batch templates (SKUs) |
| `/dashboard/exports` | Export jobs (QR ZIP, labels PDF, CSV) |
| `/dashboard/dispatch` | Dispatch management |

---

*End of Document 1*
