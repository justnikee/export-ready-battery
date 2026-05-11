# 🔋 AnvayaLabs Battery — Complete Developer Onboarding Guide

> **For new developers joining the project.** This document is your single source of truth — read it fully before writing a single line of code.

---

## Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Business Context](#2-business-context)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Core Features (Detailed)](#5-core-features-detailed)
6. [Backend Deep Dive](#6-backend-deep-dive)
7. [Frontend Deep Dive](#7-frontend-deep-dive)
8. [Database Schema](#8-database-schema)
9. [Business Logic & Data Flow](#9-business-logic--data-flow)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Key Files & Docs You Must Know](#11-key-files--docs-you-must-know)
12. [Environment Setup](#12-environment-setup)
13. [Development Workflow](#13-development-workflow)
14. [Testing Strategy](#14-testing-strategy)
15. [Compliance & Regulatory Context](#15-compliance--regulatory-context)

---

## 1. What Is This Project?

**AnvayaLabs Battery** is a **Digital Battery Passport (DBP) platform** for global regulatory compliance. It serves battery manufacturers who need to:

- Generate a unique digital identity (UUID + QR code) for **every individual battery unit** they produce
- Track that battery through its **entire lifecycle** — from factory → shipping → installation → end-of-life recycling
- Comply with strict **government regulations** in the EU and India
- Allow regulators, logistics partners, technicians, and recyclers to **interact with passports** using role-bound access
- Provide **immutable, tamper-proof audit trails** of every action ever taken on a battery

The platform is a **SaaS product** — manufacturers sign up, create an account (tenant), buy a quota of passport credits, and start generating passports for their battery units.

---

## 2. Business Context

### 2.1 The Problem Being Solved

Battery manufacturers globally face two converging regulatory pressures:

| Market    | Regulation                             | Requirement                                                                                                         |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **EU**    | EU Battery Regulation 2023/1542        | Digital Battery Passport (Article 77), Carbon footprint declaration (Article 7), Regulator data access (Article 78) |
| **India** | Battery Aadhaar Initiative / BIS / EPR | Unique battery ID (BPAN), BIS IS 16046 certification, Extended Producer Responsibility registration                 |

Without a platform like this, manufacturers would need to build compliance infrastructure from scratch — a complex, expensive, multi-year engineering effort. AnvayaLabs provides it as a service.

### 2.2 Who Are the Users?

| User Type                | Role                          | What They Do                                             |
| ------------------------ | ----------------------------- | -------------------------------------------------------- |
| **Battery Manufacturer** | Tenant (Owner/Admin/Member)   | Creates batches, generates passports, manages compliance |
| **Logistics Partner**    | External Actor (LOGISTICS)    | Ships batteries, triggered via magic link                |
| **Technician**           | External Actor (TECHNICIAN)   | Installs batteries at customer site, via magic link      |
| **Recycler**             | External Actor (RECYCLER)     | Processes end-of-life batteries, via magic link          |
| **Regulator**            | Article 78 Access (REGULATOR) | Audits full passport data using regulator API key        |
| **End User / Public**    | No auth                       | Scans QR code to verify battery authenticity             |
| **Admin**                | Platform Admin                | Verifies compliance documents, manages blog              |

### 2.3 Revenue Model

- **Subscription tiers**: Free → Starter → Growth → Enterprise
- **Quota-based**: Each plan includes N passport credits; more can be purchased as top-ups
- **Razorpay integration** for Indian market payments
- **Team seats** enforced per plan tier

### 2.4 The Reference Data File

`bis_battery_manufacturers.json` — Contains 40+ verified Indian battery manufacturers with BIS certification (IS 16046). Used for regulatory validation, onboarding verification, and partner discovery. Each entry has: company name, BIS registration number, location, battery product types, website, contact, and specialization.

---

## 3. Tech Stack

| Layer                   | Technology                        | Version | Purpose                                  |
| ----------------------- | --------------------------------- | ------- | ---------------------------------------- |
| **Frontend**            | Next.js                           | 16      | SSR, App Router, React Server Components |
| **Frontend UI**         | React                             | 19      | Component model                          |
| **Frontend Style**      | Tailwind CSS                      | v4      | Utility-first CSS                        |
| **Frontend Components** | Radix UI                          | latest  | Accessible component primitives          |
| **Frontend Charts**     | Recharts                          | latest  | Data visualization                       |
| **Frontend Forms**      | React Hook Form + Zod             | latest  | Form state + schema validation           |
| **Frontend State**      | TanStack Query (React Query)      | latest  | Server state, caching, mutations         |
| **Frontend Animations** | Framer Motion                     | latest  | UI transitions                           |
| **Frontend Icons**      | Lucide React                      | latest  | Icon set                                 |
| **Frontend Toasts**     | Sonner                            | latest  | Notification toasts                      |
| **Frontend HTTP**       | Axios                             | latest  | HTTP client                              |
| **Frontend DB Client**  | @supabase/supabase-js             | latest  | Supabase Storage access from frontend    |
| **Frontend Markdown**   | react-markdown + rehype-highlight | latest  | Docs / blog rendering                    |
| **Frontend Dates**      | date-fns                          | latest  | Date formatting and manipulation         |
| **Frontend Theme**      | next-themes                       | latest  | Dark mode support                        |
| **Frontend Progress**   | nprogress                         | latest  | Page-load progress bar                   |
| **Frontend Flags**      | flag-icons                        | latest  | Country flag icons (analytics)           |
| **Backend Language**    | Go                                | 1.24    | Compiled REST API                        |
| **Backend Router**      | stdlib `http.ServeMux` / Chi      | —       | HTTP routing                             |
| **Database**            | PostgreSQL                        | 16+     | Primary data store (via Supabase)        |
| **DB Host**             | Supabase                          | —       | Managed Postgres + Storage               |
| **File Storage**        | Supabase Storage                  | —       | QR ZIPs, PDFs, certificates              |
| **Auth**                | JWT + OAuth 2.0                   | —       | User auth (Google, Microsoft)            |
| **Email**               | Resend API                        | —       | Transactional emails                     |
| **Payments**            | Razorpay                          | —       | Subscription billing (India)             |
| **QR Generation**       | skip2/go-qrcode                   | —       | 256×256 PNG QR codes                     |
| **PDF Generation**      | jung-kurt/gofpdf                  | —       | Labels, compliance declarations          |
| **Geolocation**         | oschwald/geoip2-golang + MaxMind  | —       | QR scan analytics                        |
| **Hashing**             | BLAKE2b                           | —       | Immutable event hash chain               |
| **Migrations**          | golang-migrate                    | —       | Database schema versioning               |
| **Dev Hot Reload**      | air                               | —       | Go live reload during development        |

---

## 4. Architecture Overview

### 4.1 High-Level System Layers

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Next.js 16 — App Router)             │
│   Pages → Components → State (React Query + Context)        │
└────────────────────────────┬────────────────────────────────┘
                             │  HTTP/REST JSON
┌────────────────────────────▼────────────────────────────────┐
│              Backend REST API (Go 1.24)                     │
│   Handlers → Services → Repository → Database              │
└────────────────────────────┬────────────────────────────────┘
                             │  SQL
┌────────────────────────────▼────────────────────────────────┐
│              PostgreSQL 16 (via Supabase)                   │
│   tenants | batches | passports | passport_events |         │
│   magic_link_tokens | scan_events | telemetry_data | ...    │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Supabase Storage                               │
│   QR code ZIPs | PDF exports | Certificate files           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Backend Clean Architecture

The Go backend follows a strict layered pattern:

```
cmd/server/
  └── main.go               ← Entry point, wires all dependencies

internal/
  ├── handlers/             ← HTTP layer: parse request, call service, return JSON
  ├── services/             ← Business logic: validation, rules enforcement
  ├── repository/           ← Data access: SQL queries abstracted via interfaces
  ├── models/               ← Domain entities (Go structs mirroring DB tables)
  ├── middleware/           ← Auth, rate limiting, CORS, RBAC
  └── db/                   ← Connection pool initialization
```

**Key Design Patterns:**

- **Action-Based State Machine** — No direct status mutations; all passport state changes happen through explicit named actions (ACTIVATE, SHIP, INSTALL, RECYCLE, CLOSE, RECALL)
- **Event Sourcing** — Every lifecycle action creates an immutable audit event in `passport_events`
- **Repository Pattern** — All DB queries go through interfaces; handlers never touch SQL directly
- **Dependency Injection** — All handlers receive their service/repo dependencies on startup

### 4.3 Frontend Architecture (Next.js App Router)

```
frontend/app/
  ├── (marketing)/          ← Public landing, pricing, about, contact — no auth
  ├── (auth)/               ← Login, register, forgot password — no auth
  ├── (dashboard)/          ← Protected user area — requires JWT
  │   ├── dashboard/        ← Main dashboard + dispatch sub-route
  │   ├── batches/          ← Batches list + [id] detail
  │   ├── analytics/        ← Scan analytics page
  │   ├── compliance/       ← Compliance documents & score page
  │   ├── developer/        ← API keys & developer tools
  │   ├── exports/          ← Async export job management
  │   ├── partners/         ← Trusted partners management
  │   ├── rewards/          ← Scan-to-earn rewards & leaderboard
  │   ├── templates/        ← Batch label templates
  │   ├── billing/          ← Subscription & quota management
  │   ├── settings/         ← Tenant settings & data visibility
  │   └── team/             ← Team member management
  ├── (admin)/              ← Admin-only (blog management)
  ├── p/[uuid]/             ← Public passport view (QR target) — no auth
  └── docs/                 ← Documentation hub

frontend/components/
  ├── ui/                   ← Generic reusable UI primitives (button, card, dialog, etc.)
  ├── auth/                 ← Auth-specific forms and layouts
  ├── batches/              ← Batch creation, passport list, CSV upload, templates dialog
  ├── passport/             ← Passport view, telemetry charts, magic link modals
  ├── dashboard/            ← Sidebar, stats cards, charts, compliance score card
  ├── analytics/            ← Country chart, device chart, live scan feed, scan stats
  ├── dispatch/             ← Dispatch skeleton component
  ├── templates/            ← Label template CRUD dialogs and cards
  ├── settings/             ← Data access token & visibility settings
  └── landing/              ← Marketing page sections (hero, features, CTA, etc.)

frontend/context/
  └── auth-context.tsx      ← Global auth state: user, login(), logout(), refreshUser()

frontend/lib/
  ├── api.ts                ← Core API client
  ├── api/                  ← Modular API sub-clients
  │   ├── batches.ts
  │   ├── compliance.ts
  │   ├── epr.ts
  │   └── exports.ts
  ├── auth-api.ts           ← Auth-specific API calls
  ├── supabase.ts           ← Supabase JS client
  ├── i18n/                 ← i18n translation files (en.json, fr.json, de.json)
  └── utils.ts

frontend/hooks/
  └── use-queries.ts        ← TanStack Query hooks (data fetching)

frontend/providers/
  └── query-provider.tsx    ← TanStack Query client provider
```

---

## 5. Core Features (Detailed)

### Feature 1: Digital Battery Passports

**What it does:** Every battery unit gets a permanent UUID-based digital identity.

**How it works:**

- Manufacturer creates a **batch** (a production run with specs)
- Uploads a CSV with serial numbers, or lets the system auto-generate them
- System creates one `passport` row per battery in PostgreSQL
- Each passport has a UUID → becomes the URL of its public verification page: `https://site.com/p/{uuid}`
- A **256×256 PNG QR code** is generated pointing to that URL
- The QR code is what gets physically printed and stuck onto the battery

**Key files:**

- `backend/internal/handlers/batch_handlers.go` — batch creation & CSV upload
- `backend/internal/handlers/passport_handlers.go` — passport retrieval (tier-aware)
- `backend/internal/services/qr_service.go` — QR PNG generation
- `frontend/app/p/[uuid]/page.tsx` — the public passport view page

---

### Feature 2: Lifecycle Management (Action-Based State Machine)

This is the **most critical and complex feature** of the platform. Understand it thoroughly.

**The States:**

```
CREATED → ACTIVE → SHIPPED → IN_SERVICE → RECYCLED → END_OF_LIFE
                                   ↑
                              RECALLED (interrupt from any state)
```

**The Actions (how states change):**

| Action     | Triggered By                 | From State | To State    | Required Evidence                                            |
| ---------- | ---------------------------- | ---------- | ----------- | ------------------------------------------------------------ |
| `ACTIVATE` | SYSTEM / INTERNAL_OPERATOR   | CREATED    | ACTIVE      | None (compliance pre-checked)                                |
| `SHIP`     | INTERNAL_OPERATOR, LOGISTICS | ACTIVE     | SHIPPED     | `shipment_reference`, `shipment_date`                        |
| `INSTALL`  | TECHNICIAN                   | SHIPPED    | IN_SERVICE  | `installation_date`, `installer_id`                          |
| `RECYCLE`  | RECYCLER                     | IN_SERVICE | RECYCLED    | `recycler_epr_id`, `recycling_date`, `certificate_reference` |
| `CLOSE`    | SYSTEM / ADMIN               | RECYCLED   | END_OF_LIFE | None                                                         |
| `RECALL`   | ADMIN                        | Any        | RECALLED    | `recall_reason`, `recall_reference`                          |

**Critical rules:**

1. You **cannot skip states** — a battery can't go from CREATED directly to IN_SERVICE
2. Evidence is **mandatory** for the actions that require it — missing evidence returns HTTP 400
3. Each actor **role** can only perform specific actions — a RECYCLER can't SHIP a battery
4. Every transition creates an **immutable audit event** in `passport_events` — these rows can never be updated or deleted (DB trigger enforces this)
5. Each event gets a **BLAKE2b hash** chained to the previous event — you can verify the entire chain hasn't been tampered with

**Key files:**

- `backend/internal/handlers/lifecycle_handlers.go`
- `backend/internal/services/lifecycle_service.go`
- `backend/internal/models/lifecycle.go`

---

### Feature 3: Magic Links (External Actor Access)

**The problem it solves:** Logistics partners, technicians, and recyclers are not your platform users — they don't have accounts. Yet they need to perform lifecycle actions (SHIP, INSTALL, RECYCLE) on batteries.

**How magic links work:**

1. Manufacturer generates a magic link for a specific passport + action (e.g., "SHIP passport ABC-123")
2. System creates a single-use token bound to: `{passport_id, action, actor_role, expiry}`
3. Token is sent to the external actor (via email/WhatsApp/etc.)
4. External actor visits: `https://site.com/p/{uuid}/action?token={token}`
5. They fill in the evidence fields (shipment reference, installation date, etc.)
6. They submit — the transition happens with their role (`LOGISTICS`, `TECHNICIAN`, `RECYCLER`)
7. **Token is immediately invalidated** — single use only

**Security properties:**

- Token hash stored (BLAKE2b), never the raw token
- Bound to specific action — a SHIP token can't be used to RECALL
- Time-limited (configurable expiry)
- IP address logged on use
- Cannot be replayed after first use

**Key files:**

- `backend/internal/handlers/magic_link_handlers.go`
- `frontend/app/p/[uuid]/action/page.tsx`

---

### Feature 4: Three-Tier Data Access (Article 78 Compliance)

**Why it exists:** EU Battery Regulation Article 78 requires that different actors see different amounts of battery data.

| Tier          | Who Gets It                                 | How to Authenticate                            | What They See                                                         |
| ------------- | ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| **PUBLIC**    | Anyone (QR scan)                            | No auth required                               | UUID, serial, status, basic specs, manufacturer name                  |
| **PARTNER**   | Logistics, technicians, authorized partners | Magic link token                               | + Ownership history, repair events, replacement events, current owner |
| **REGULATOR** | Government regulators                       | `X-Regulator-Key` header with Article 78 token | Everything + Full immutable audit trail                               |

The backend's `GetPassport` handler automatically detects which tier applies based on the incoming request headers and returns the appropriate filtered view.

**Key files:**

- `backend/internal/handlers/passport_handlers.go` (tier detection logic)
- `backend/internal/handlers/data_access_handlers.go` (token management)
- `frontend/components/settings/data-visibility.tsx` (configure what's visible per tier)

---

### Feature 5: Batch Management & CSV Upload

**What it is:** A "batch" represents a production run — e.g., "500 units of Model XR-2000 LFP batteries, manufactured in Jan 2026 for the Indian market."

**Batch lifecycle:**

1. Create batch with specs (chemistry, voltage, capacity, market region, compliance fields)
2. Upload CSV with one row per battery unit (serial number, manufacture date, etc.)
3. System validates the CSV, detects duplicates, reports errors
4. Approved CSV generates N passport rows in the database
5. Batch moves from DRAFT → ACTIVE (after compliance pre-check passes and quota is debited)
6. Download QR ZIP (all N QR codes as PNGs in a ZIP file)
7. Download printable labels PDF (QR + serial on each label)
8. Export batch data as CSV for your ERP system

**BPAN Serial Format (India):**

```
IN - TEN - LFP - 2026 - 00001
 ↑    ↑     ↑     ↑       ↑
Reg  MFR  Chem  Year  Sequence
```

Full format: `{REGION}-{MFR_CODE}-{CHEM}-{YYYY}-{NNNNN}` = 21 characters total

**Key files:**

- `backend/internal/handlers/batch_handlers.go`
- `backend/internal/handlers/upload_handlers.go`
- `backend/internal/services/csv_service.go`
- `backend/internal/services/bpan_service.go`
- `frontend/components/batches/create-batch-dialog.tsx`
- `frontend/components/batches/upload-csv.tsx`

---

### Feature 6: Carbon Footprint Tracking (Article 7 EU Compliance)

**What it is:** EU Battery Regulation Article 7 requires manufacturers to declare the carbon footprint of their batteries.

**How the calculation works:**

- Inputs: battery chemistry (LFP, NMC 622, NMC 811, NCA, LCO, Sodium), capacity (kWh), country of origin, transport mode (ship/rail/truck/air)
- Methodology: JRC (Joint Research Centre) aligned
- Factors sourced from `carbon_factors` DB table (updatable, versioned, sourced from JRC_2024 / IEA_2025)
- Output: Total kgCO2e, breakdown by category (cell chemistry, assembly, transport, energy mix), declaration text
- Result stored on the batch record
- EU compliance PDF generated for submission to regulators

**Key files:**

- `backend/internal/handlers/carbon_handler.go`
- `backend/internal/services/carbon_calculator_service.go`
- `frontend/components/batches/carbon-calculator.tsx`

---

### Feature 7: India-Specific Compliance

India has its own set of regulatory requirements:

| Regulation       | Requirement                                          | Platform Support                                                                                 |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **BIS IS 16046** | Battery Safety Certification                         | Certificate upload + admin verification, `bis_status` field on tenant                            |
| **EPR**          | Extended Producer Responsibility registration        | Certificate upload, `epr_status` tracking, EPR obligation calculator, **EPR certificate ledger** |
| **PLI**          | Production Linked Incentive scheme                   | PLI certificate, domestic value add % (must be ≥40%), DVA calculator                             |
| **BPAN**         | Battery ID standard (India equivalent of EU DBP)     | 21-char serial generation via `internal/serial` package                                          |
| **IEC Code**     | Import/Export Code                                   | Stored on tenant profile, regex-validated (`ValidationService`)                                  |
| **HSN Code**     | Harmonised System of Nomenclature (8507xxxx)         | Validated and stored per passport                                                                |
| **MoRTH**        | Ministry of Road Transport codes                     | `morth_manufacturer_code`, `morth_factory_codes` on tenant                                       |
| **CPCB Form 3**  | Annual EPR return to Central Pollution Control Board | Auto-generated CSV via `CPCBExportService` / `GET /epr/cpcb-export`                              |

Activation of an India-market batch will **fail** if BIS/EPR are not `VERIFIED` and PLI prerequisites aren't met.

**EPR Certificate Ledger:** Manufacturers log recycling certificates issued by CPCB-registered recyclers. Each entry records weight recycled (kg), recycler EPR ID, financial year, and certificate number. The CPCB Form 3 export aggregates these entries per battery category to produce the annual return.

**India Regulatory Validation:** `ValidationService` enforces strict regex patterns for:

- IEC Code: `AAAPL1234C` format
- EPR Registration: `B-29016/2024-25/CPCB` format
- BIS R-Number: `R-41001234` format
- HSN Code: `8507xxxx` (8 digits, chapter 85)

**Key files:**

- `backend/internal/handlers/epr_handler.go`
- `backend/internal/handlers/epr_certificate_handler.go` — EPR certificate ledger CRUD
- `backend/internal/handlers/cpcb_export_handler.go` — CPCB Form 3 CSV download
- `backend/internal/services/activation_compliance.go`
- `backend/internal/services/cpcb_export_service.go`
- `backend/internal/services/validation.go` — India regulatory regex validators
- `backend/internal/compliance/battery/india.go` — India compliance engine
- `frontend/components/batches/dva-calculator.tsx`

---

### Feature 8: Immutable Audit Trail

**Why this matters:** Regulators need proof that the lifecycle history of a battery hasn't been altered. This is achieved through a BLAKE2b cryptographic hash chain.

**How it works:**

1. Every lifecycle action creates a row in `passport_events`
2. Each event stores: `event_hash = BLAKE2b(previous_hash + current_event_data)`
3. A database trigger prevents any `UPDATE` or `DELETE` on `passport_events`
4. To verify integrity: recompute all hashes in sequence and compare — any tampering breaks the chain
5. The `GET /passports/{uuid}/verify-chain` endpoint does this verification

**Key files:**

- `backend/internal/services/event_hash.go`
- `backend/internal/models/models.go` (passport event types)
- `backend/internal/handlers/passport_handlers.go` (verify-chain endpoint)

---

### Feature 9: Device Integration (BMS/IoT Telemetry)

**What it is:** Battery Management Systems (BMS) or IoT sensors can report real-time battery health data directly into the platform.

**How it works:**

- Manufacturer creates a **device token** for a specific passport (or group)
- BMS device authenticates using this token (header: `X-Device-Token`)
- Device POSTs telemetry: `{ soh, voltage, temperature, cycle_count, timestamp }`
- Data stored in `telemetry_data` table
- Dashboard shows State-of-Health trends over time
- Degradation patterns can be analyzed

**Key files:**

- `backend/internal/handlers/telemetry_handlers.go`
- `backend/internal/services/device_token_service.go`
- `frontend/components/passport/telemetry-chart.tsx`

---

### Feature 16: Compliance Engine (Real-Time Checks)

A pluggable compliance engine runs checks on battery specs before batch creation and activation.

**How it works:**

- `internal/compliance/registry.go` — routes `(ProductType, MarketRegion)` pairs to the right `Validator`
- EU validator (`battery/eu.go`) — checks Article 7 carbon fields, EU representative, recycled content
- India validator (`battery/india.go`) — checks BIS/EPR/PLI status, BPAN format, HSN code
- `POST /api/v1/compliance/check` — dry-run endpoint the frontend calls in real-time as users fill in batch specs. Returns a compliance checklist with a score and per-rule pass/fail status
- On `BatchActivated` event (via `internal/events/bus.go`), the compliance engine runs automatically and writes a score + gaps back to the batch record
- The `ComplianceScoreCard` component on the dashboard shows the current compliance score per batch

**Key files:**

- `backend/internal/compliance/registry.go`
- `backend/internal/compliance/battery/eu.go`
- `backend/internal/compliance/battery/india.go`
- `backend/internal/handlers/compliance_handler.go`
- `backend/internal/services/batch_service.go`
- `backend/internal/events/bus.go`
- `frontend/components/dashboard/ComplianceScoreCard.tsx`
- `frontend/app/(dashboard)/compliance/page.tsx`

---

### Feature 17: Product Schema Registry

A DB-backed schema registry drives dynamic batch creation forms and spec validation.

**How it works:**

- `internal/schema/Registry` stores `ProductSchema` records keyed by `(ProductType, Version)`
- Schemas are loaded from the DB on first access and cached; a static seed (`battery_v1.json`) always provides a fallback
- `GET /api/v1/schemas` returns all registered product schemas including `schema_json` so the frontend can render dynamic forms
- `BatchService.ValidateSpecs()` checks that batch specs JSON satisfies the active schema before creation/activation

**Key files:**

- `backend/internal/schema/registry.go`
- `backend/internal/schema/seeds/battery_v1.json`
- `backend/internal/handlers/schema_handler.go`
- `backend/internal/services/batch_service.go`

---

### Feature 18: Label Templates

Manufacturers can create and manage reusable label templates for batch QR code printouts.

- Templates are stored per tenant
- `GET/POST/DELETE /api/v1/templates` — template CRUD
- Templates dialog accessible from the batch detail page
- Supports custom fields, layouts, and branding per template

**Key files:**

- `backend/internal/handlers/template_handlers.go`
- `backend/internal/repository/template.go`
- `frontend/components/batches/templates-dialog.tsx`
- `frontend/components/templates/CreateTemplateDialog.tsx`, `TemplateCard.tsx`
- `frontend/app/(dashboard)/templates/page.tsx`

---

### Feature 10: Export & Reporting

| Export Type            | Format          | Trigger                               |
| ---------------------- | --------------- | ------------------------------------- |
| QR Code batch download | ZIP of PNGs     | Dashboard → Download QRs              |
| Printable labels       | PDF             | Dashboard → Labels                    |
| Batch data             | CSV             | Dashboard → Export CSV                |
| Audit trail            | CSV or PDF      | Dashboard → Audit Export              |
| Carbon declaration     | PDF (Article 7) | Batch detail → Compliance Declaration |
| Compliance report      | PDF             | Batch detail → Compliance Report      |
| Due diligence report   | PDF             | Batch detail → Due Diligence          |
| CPCB Form 3            | CSV             | Compliance page → CPCB Annual Return  |

Large exports use an **async job worker** pattern:

1. Client creates an export job (`POST /export-jobs`)
2. Backend worker processes it and uploads to Supabase Storage
3. Client polls status or gets notified when done
4. Client downloads via signed URL

**Key files:**

- `backend/internal/handlers/export_job_handlers.go`
- `backend/internal/services/export_job_service.go`
- `backend/internal/services/audit_export_service.go` — direct CSV/PDF audit event export
- `backend/internal/services/cpcb_export_service.go` — CPCB Form 3 CSV
- `backend/internal/handlers/cpcb_export_handler.go`

---

### Feature 11: Team Management

- Manufacturer can invite team members via email
- Roles: **OWNER** (full access), **ADMIN** (manage team/docs/settings), **MEMBER** (create batches, passports)
- Seat limits enforced by billing plan
- Invitees receive email with acceptance link (`/accept-invite?token=...`)

---

### Feature 12: Multi-Language Support (i18n)

The public passport view supports **English (EN)**, **French (FR)**, and **German (DE)**.

- Language resolved from URL query param `?lang=de` or browser `Accept-Language` header
- Safety labels, disposal instructions, and compliance notices are fully translated
- Certificate HTML rendered in the selected language

---

### Feature 13: Analytics Dashboard

- **Production stats**: Total batches, passports created, quota used
- **Scan analytics**: Every QR scan is recorded with IP, geolocation (lat/lng via MaxMind GeoIP2), user agent
- **Scan map**: Geographic heatmap of where batteries have been scanned (`react-simple-maps`)
- **Status charts**: Passport status distribution pie chart
- **Production chart**: Passport creation over time (line chart)
- **Recent batches table**: Quick overview of latest activity

---

### Feature 14: API Keys & External Integration

Third-party systems (ERP, MES, WMS) can integrate directly:

- Manufacturer creates API keys with `READ` or `WRITE` scope
- API key sent in `X-API-Key` header
- Rate limiting applied per key tier
- External endpoints: Get passport, Create batch, Create passports, Download labels
- Full OpenAPI spec available at `/api/v1/openapi.yaml`

---

### Feature 15: Scan-to-Earn Rewards

A gamification layer where QR scans earn reward points:

- End users scanning battery QR codes accumulate points
- Leaderboard of top scanners
- Reward history tracked per user
- Intended to incentivize QR scanning for analytics and engagement

---

## 6. Backend Deep Dive

### 6.1 Directory Structure

```
backend/
├── cmd/server/
│   └── main.go                    ← Entry point, all dependency wiring
├── internal/
│   ├── handlers/                  ← HTTP request handlers (36 files)
│   │   ├── handlers.go            ← Handler struct & dependency injection
│   │   ├── auth_handlers.go
│   │   ├── oauth_handler.go
│   │   ├── passport_handlers.go
│   │   ├── batch_handlers.go
│   │   ├── upload_handlers.go
│   │   ├── lifecycle_handlers.go
│   │   ├── magic_link_handlers.go
│   │   ├── carbon_handler.go
│   │   ├── compliance_handler.go  ← Real-time compliance check (dry-run)
│   │   ├── cpcb_export_handler.go ← CPCB Form 3 annual return CSV
│   │   ├── epr_certificate_handler.go ← EPR certificate ledger
│   │   ├── schema_handler.go      ← Product schema registry
│   │   ├── template_handlers.go
│   │   ├── team_handlers.go
│   │   ├── billing_handlers.go
│   │   ├── razorpay_handlers.go
│   │   ├── dashboard_handlers.go
│   │   ├── document_handlers.go
│   │   ├── epr_handler.go
│   │   ├── export_job_handlers.go
│   │   ├── data_access_handlers.go
│   │   ├── telemetry_handlers.go
│   │   ├── scan_handlers.go
│   │   ├── reward_handlers.go
│   │   ├── admin_handlers.go
│   │   ├── bulk_handlers.go
│   │   ├── external_handlers.go
│   │   ├── apikey_handlers.go
│   │   ├── trusted_partner_handlers.go
│   │   └── webhook_handlers.go
│   ├── services/                  ← Business logic
│   │   ├── auth_service.go
│   │   ├── lifecycle.go
│   │   ├── csv_service.go
│   │   ├── qr_service.go
│   │   ├── pdf_service.go
│   │   ├── carbon_calculator.go
│   │   ├── bpan_service.go
│   │   ├── email.go
│   │   ├── data_access_service.go
│   │   ├── telemetry_service.go
│   │   ├── storage_service.go
│   │   ├── export_job_service.go
│   │   ├── activation_compliance.go
│   │   ├── event_hash.go
│   │   ├── epr_obligation_service.go
│   │   ├── audit_export_service.go ← CSV + PDF audit event exports
│   │   ├── batch_service.go        ← Schema + compliance engine wiring
│   │   ├── batch_snapshot.go       ← Immutable batch+tenant data capture
│   │   ├── compliance_declaration_pdf.go
│   │   ├── compliance_report_pdf.go
│   │   ├── cpcb_export_service.go  ← CPCB Form 3 CSV generation
│   │   ├── due_diligence_pdf.go
│   │   ├── geo_service.go          ← GeoIP service (MaxMind)
│   │   ├── label_translations.go   ← i18n label support
│   │   ├── oauth_service.go
│   │   ├── ownership_history.go
│   │   ├── passport_service.go     ← Serial generation via serial package
│   │   ├── rewards.go
│   │   └── validation.go           ← India regulatory regex validators
│   ├── compliance/                 ← Compliance engine (NEW)
│   │   ├── registry.go             ← Routes (ProductType, MarketRegion) → Validator
│   │   ├── validator.go
│   │   ├── result.go
│   │   ├── battery/
│   │   │   ├── eu.go               ← EU Battery Regulation validator
│   │   │   └── india.go            ← India BPAN/BIS/EPR validator
│   │   └── common/
│   │       └── helpers.go
│   ├── events/                     ← In-memory event bus (NEW)
│   │   └── bus.go                  ← Pub/sub: BatchActivated, etc.
│   ├── schema/                     ← DPP product schema registry (NEW)
│   │   ├── registry.go             ← DB-backed + seed fallback schema cache
│   │   ├── validator.go
│   │   └── seeds/
│   │       ├── seeds.go
│   │       └── battery_v1.json     ← Default battery schema seed
│   ├── serial/                     ← Battery serial number generation (NEW)
│   │   ├── generator.go            ← BPAN-V2 Generator interface
│   │   └── configs.go
│   ├── repository/                 ← SQL queries
│   │   ├── interface.go            ← RepositoryInterface (all queries typed)
│   │   ├── repository.go
│   │   ├── mock_repository.go      ← Mock for tests
│   │   ├── passport.go
│   │   ├── batch.go
│   │   ├── tenant.go
│   │   ├── bulk.go
│   │   ├── carbon_factors.go
│   │   ├── data_access.go
│   │   ├── device_tokens.go
│   │   ├── epr_certificate_repository.go
│   │   ├── magic_link.go
│   │   ├── reward.go
│   │   ├── scan.go
│   │   ├── schema_repository.go
│   │   ├── team_repository.go
│   │   ├── telemetry.go
│   │   ├── template.go
│   │   ├── transaction.go
│   │   ├── trusted_domain.go
│   │   └── trusted_partners.go
│   ├── models/                    ← Go structs (domain entities)
│   │   ├── models.go              ← Core domain types (Batch, Passport, Tenant…)
│   │   ├── types.go               ← Shared type definitions
│   │   ├── access_views.go        ← Article 78 tiered access view structs
│   │   ├── apikey.go
│   │   ├── evidence.go            ← Lifecycle evidence structs
│   │   ├── magic_link.go
│   │   ├── schema.go              ← ProductSchema types
│   │   └── team_member.go
│   ├── middleware/
│   │   ├── auth.go                ← JWT validation
│   │   ├── api_key_auth.go        ← API key validation
│   │   ├── device_auth.go         ← BMS device token auth
│   │   └── rate_limiter.go        ← Per-IP rate limiting
│   └── db/
│       └── connection.go          ← PostgreSQL connection pool
├── migrations/                    ← SQL migration files (numbered)
│   ├── 000001_init.up.sql
│   ├── 000001_init.down.sql
│   └── ... (38+ migrations)
└── Makefile                       ← Build, test, migrate commands
```

### 6.2 Services Reference

| Service                       | Key Responsibility                                                               |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `AuthService`                 | JWT generation, validation, refresh, password hashing                            |
| `OAuthService`                | Google/Microsoft OAuth token exchange and profile fetch                          |
| `LifecycleService`            | Action validation, state transitions, evidence enforcement, audit event creation |
| `CSVService`                  | CSV parsing, row validation, duplicate detection, batch passport insert          |
| `QRService`                   | 256×256 PNG QR code generation per UUID                                          |
| `PDFService`                  | Labels PDF generation                                                            |
| `ComplianceDeclarationPDF`    | Article 7 carbon declaration PDF                                                 |
| `ComplianceReportPDF`         | Full compliance report PDF                                                       |
| `DueDiligencePDF`             | Due diligence report PDF                                                         |
| `CarbonCalculatorService`     | JRC-aligned CO₂ calculation with chemistry + transport factors from DB           |
| `BatchService`                | Wires schema registry + compliance engine into batch creation/activation         |
| `BatchSnapshot`               | Captures immutable batch+tenant compliance data at passport creation time        |
| `PassportService`             | Serial number generation delegating to `serial.BPANGenerator`                    |
| `BPANService`                 | Legacy BPAN generation and validation (see also `internal/serial`)               |
| `EmailService`                | Transactional emails (invite, reset, magic link) via Resend API                  |
| `DataAccessService`           | Three-tier access control per Article 78                                         |
| `TelemetryService`            | BMS data ingestion, SoH trend calculation                                        |
| `GeoIPService`                | IP → city/country lookup using MaxMind GeoIP2 database                           |
| `RazorpayService`             | Payment order, signature verification, webhook                                   |
| `EPRObligationService`        | India EPR tonnage-based obligation calculation                                   |
| `CPCBExportService`           | Generates CPCB Form 3 annual return CSV for India regulatory submission          |
| `AuditExportService`          | CSV + PDF exports of passport lifecycle events per batch                         |
| `ExportJobService`            | Async job queue for large exports (QR ZIPs, PDFs, CSVs)                          |
| `ActivationComplianceService` | Pre-activation gate: EU carbon + India PLI/BIS/EPR checks                        |
| `EventHashService`            | BLAKE2b chain computation and verification                                       |
| `ValidationService`           | India-specific regex validators: IEC code, HSN, EPR number, BIS R-number         |
| `OwnershipHistoryService`     | Tracks and updates battery ownership chain                                       |
| `RewardsService`              | Scan-to-earn points accumulation and leaderboard                                 |
| `LabelTranslations`           | i18n translation tables for printable battery labels                             |

### 6.3 Middleware Stack

| Middleware    | Applied To                                       | What It Does                               |
| ------------- | ------------------------------------------------ | ------------------------------------------ |
| `Auth`        | All `/api/v1/*` routes                           | Validates `Authorization: Bearer {jwt}`    |
| `APIKeyAuth`  | `/external/*` routes                             | Validates `X-API-Key` header, checks scope |
| `DeviceAuth`  | `/telemetry/*` routes                            | Validates `X-Device-Token` header          |
| `RateLimiter` | Auth routes: 5 req/min; API: 100 req/min per key | Per-IP rate limiting                       |

> **Note:** CORS and RBAC (`RequireRole`) are now handled inline in the router setup (`cmd/server/main.go`) rather than as separate middleware files.

---

## 7. Frontend Deep Dive

### 7.1 Auth State (Global)

`context/auth-context.tsx` is the root of all auth state:

```typescript
// What it provides
{
  user: Tenant | null,         // Current logged-in user
  login(token, refresh),       // Store JWTs in localStorage
  logout(),                    // Clear tokens, redirect to /login
  refreshUser(),               // Re-fetch /auth/me to sync user data
  updateUser(partial),         // Optimistic partial update
}
```

Auth tokens are stored in **localStorage** and sent as `Authorization: Bearer {token}` on every API call. The `middleware.ts` file in Next.js checks for a token before allowing access to `/dashboard/*` routes.

### 7.2 Data Fetching Pattern (TanStack Query)

All API calls use TanStack Query hooks:

```typescript
// Fetching data
const { data: batches } = useQuery({
  queryKey: ["batches"],
  queryFn: () => api.getBatches(),
});

// Mutations (create/update/delete)
const { mutate: createBatch } = useMutation({
  mutationFn: (data) => api.createBatch(data),
  onSuccess: () => queryClient.invalidateQueries(["batches"]), // auto-refetch
});
```

### 7.3 Key Page → Component Hierarchy

```
/dashboard
  └── DashboardLayout (sidebar + top nav)
      ├── StatsCard × 4 (batches, passports, scans, quota)
      ├── ProductionChart (line chart)
      ├── BatchStatusChart (pie chart)
      ├── ComplianceScoreCard (compliance score per batch)
      ├── QuotaCard (quota usage)
      ├── RecentBatchesTable
      ├── ScanMap (geolocation heatmap)
      └── ActivityFeed

/dashboard/dispatch
  └── DispatchPage (bulk passport dispatch management)

/analytics
  └── AnalyticsPage
      ├── ScanStatsCard × N
      ├── CountryChart (scans by country)
      ├── DeviceChart (scans by device type)
      └── LiveScanFeed

/compliance
  └── CompliancePage (document status, compliance scores, CPCB export)

/templates
  └── TemplatesPage
      ├── TemplateCard × N
      ├── CreateTemplateDialog
      └── DeleteTemplateDialog

/batches
  └── BatchesPage
      ├── CreateBatchDialog (20+ field form)
      ├── BatchesListSkeleton (loading state)
      └── BatchCard × N

/batches/[id]
  └── BatchDetailPage
      ├── BatchInfo (specs, market, compliance status)
      ├── CarbonCalculator (interactive CO₂ calculator)
      ├── BulkActionToolbar (select all → bulk transition)
      ├── PassportList (paginated table)
      ├── TemplatesDialog (select label template)
      └── DownloadLabelsDialog

/developer
  └── DeveloperPage (API keys, device tokens, schema explorer)

/exports
  └── ExportsPage (async export job queue and downloads)

/partners
  └── PartnersPage (trusted partners & domains management)

/rewards
  └── RewardsPage (scan-to-earn leaderboard and history)

/p/[uuid]  ← PUBLIC (no auth)
  └── PassportPage
      ├── CertificateView (QR + serial + specs + status)
      ├── TelemetryChart (SoH over time, if available)
      └── RequestMagicLinkModal (for external actors)

/p/[uuid]/action  ← PUBLIC (magic link)
  └── MagicLinkActionPage
      ├── ActionForm (evidence fields for SHIP/INSTALL/RECYCLE/RECALL)
      └── ActionConfirmation
```

---

## 8. Database Schema

### Core Tables

#### `tenants` — Users / Companies

```sql
- id UUID PK
- company_name, email, password_hash
- plan_type: STARTER | GROWTH | ENTERPRISE
- quota_balance INT

-- EU compliance fields
- eu_authorized_representative_name
- eu_authorized_representative_address, eu_contact_email

-- India compliance fields
- epr_registration_number, bis_r_number, iec_code
- morth_manufacturer_code, morth_factory_codes TEXT[]
- epr_certificate_path, bis_certificate_path, pli_certificate_path
- epr_status, bis_status, pli_status: NOT_UPLOADED | PENDING | VERIFIED | REJECTED

-- Misc
- onboarding_completed BOOL
- oauth_provider, oauth_id (Google/Microsoft)
- data_visibility JSONB
```

#### `batches` — Production Runs

```sql
- id UUID PK, tenant_id UUID FK
- batch_name TEXT
- specs JSONB                  ← chemistry, voltage, capacity, materials, etc.
- market_region: INDIA | EU | GLOBAL
- carbon_footprint FLOAT, recycled_content_pct FLOAT

-- India-specific
- cell_source, domestic_value_add, bill_of_entry_no
- country_of_origin, customs_date

-- Soft delete
- deleted_at TIMESTAMPTZ
```

#### `passports` — Individual Battery Units

```sql
- id UUID PK (this is the QR code target URL UUID)
- batch_id UUID FK, serial_number TEXT

-- Lifecycle
- status: CREATED | ACTIVE | SHIPPED | IN_SERVICE | RECYCLED | END_OF_LIFE | RECALLED
- current_owner_identifier TEXT
- ownership_history JSONB[]
- current_owner_id UUID FK(team_members)

-- Repair/replacement tracking
- repair_events JSONB[], replacement_events JSONB[]
- recycling_date, recycling_status, recycler_epr_id, certificate_reference

-- State of health (IoT/BMS)
- state_of_health FLOAT, last_soh_update_timestamp

-- India compliance
- pli_compliant BOOL, hsn_code TEXT
- bill_of_entry_no, country_of_origin, customs_date
```

#### `passport_events` — Immutable Audit Trail ⚠️

```sql
- id UUID PK
- passport_id UUID FK
- action TEXT                  ← ACTIVATE | SHIP | INSTALL | RECYCLE | CLOSE | RECALL
- event_hash TEXT              ← BLAKE2b of (prev_hash + event_data)
- actor_role TEXT              ← SYSTEM | INTERNAL_OPERATOR | LOGISTICS | TECHNICIAN | RECYCLER | ADMIN
- actor_type: USER | SYSTEM | DEVICE
- actor_id TEXT, actor_ip TEXT
- transition_from_status → transition_to_status
- evidence JSONB               ← shipment_reference, installer_id, etc.
- timestamp TIMESTAMPTZ        ← IMMUTABLE
```

> ⚠️ **Never attempt to UPDATE or DELETE rows from `passport_events`.** A database trigger enforces immutability and will reject such operations.

#### `magic_link_tokens`

```sql
- id UUID PK, passport_id UUID FK
- token_hash TEXT              ← BLAKE2b of raw token (never store raw)
- action TEXT                  ← Bound to one action only
- actor_role TEXT              ← Role assigned to this token
- expires_at TIMESTAMPTZ
- used_at TIMESTAMPTZ          ← Set on first use; token rejected if non-null
- ip_address_used, user_agent_used
```

#### `telemetry_data`

```sql
- id UUID PK, passport_id UUID FK, device_token_id UUID FK
- soh FLOAT                    ← State of health (%)
- voltage FLOAT (V), temperature FLOAT (°C)
- cycle_count INT
- timestamp TIMESTAMPTZ
```

#### `carbon_factors`

```sql
- category: CELL_CHEMISTRY | TRANSPORT | ENERGY_MIX | ASSEMBLY
- subcategory: LFP | NMC_622 | NMC_811 | NCA | LCO | SODIUM | SHIP | RAIL | TRUCK | AIR
- factor_value FLOAT           ← kgCO2e
- source: JRC_2024 | IEA_2025
- valid_from, valid_to TIMESTAMPTZ
```

---

## 9. Business Logic & Data Flow

### 9.1 QR Scan Flow (End-to-End)

```
User scans QR code
      ↓
Browser opens → https://site.com/p/{uuid}
      ↓
Next.js app/p/[uuid]/page.tsx
      ↓
GET /api/v1/passports/{uuid}
  (no auth header → PUBLIC tier)
      ↓
Backend passport_handlers.go
  → Detects PUBLIC tier
  → Queries PostgreSQL
  → Builds filtered public view
  → Returns JSON
      ↓
React renders CertificateView
  (QR code, serial, status, specs, manufacturer)
      ↓
Simultaneously:
  POST /api/v1/scans/record
  → Logs IP, geolocation (MaxMind), user agent
  → Inserts into scan_events
  → Updates scan analytics
```

### 9.2 Lifecycle Transition Flow (SHIP action)

```
Operator clicks "Ship" in dashboard
      ↓
POST /api/v1/passports/{uuid}/transition
{
  "action": "SHIP",
  "actor_context": { "actor_role": "INTERNAL_OPERATOR", "actor_id": "...", "actor_type": "USER" },
  "evidence": { "shipment_reference": "BOL-123", "shipment_date": "2026-02-15" }
}
      ↓
lifecycle_handlers.go → LifecycleService.ApplyTransition()
  Step 1: Fetch passport, verify it's in ACTIVE state
  Step 2: Validate actor_context fields present
  Step 3: Check SHIP requires INTERNAL_OPERATOR or LOGISTICS role ✓
  Step 4: Validate evidence: shipment_reference ✓, shipment_date ✓
  Step 5: Compute new state: ACTIVE → SHIPPED
  Step 6: Build audit event with BLAKE2b hash chained to previous event
  Step 7: Atomic DB transaction:
            INSERT passport_events (new immutable row)
            UPDATE passports SET status='SHIPPED', ownership_history=...
      ↓
HTTP 200 → { success: true, new_status: "SHIPPED", event_id: "..." }
      ↓
Frontend updates UI: status badge → "SHIPPED", shows new audit event
```

### 9.3 Compliance Activation Flow

```
Manufacturer clicks "Activate Batch"
      ↓
POST /api/v1/batches/{id}/activate
      ↓
ActivationComplianceService checks:
  IF market_region == "EU":
    → carbon_footprint declared? (required)
    → recycled_content_pct present? (required)
    → eu_authorized_representative_name filled? (required)
  IF market_region == "INDIA":
    → tenant.bis_status == "VERIFIED"? (required)
    → tenant.epr_status == "VERIFIED"? (required)
    → IF pli_compliant: tenant.pli_status == "VERIFIED" AND domestic_value_add >= 40
    → BPAN format valid on all passports?
  Any check fails → HTTP 400 with specific error message
      ↓
All checks pass → Debit quota (N passports × 1 credit each)
      ↓
Bulk ACTIVATE transition: all passports CREATED → ACTIVE
      ↓
Batch status: DRAFT → ACTIVE
```

---

## 10. API Endpoints Reference

> Full OpenAPI spec: `GET /api/v1/openapi.yaml`

### Authentication (`/api/v1/auth/`)

| Method | Endpoint                | Purpose                        |
| ------ | ----------------------- | ------------------------------ |
| POST   | `/auth/register`        | Create new tenant account      |
| POST   | `/auth/login`           | Login, get JWT + refresh token |
| POST   | `/auth/refresh`         | Refresh expired JWT            |
| POST   | `/auth/forgot-password` | Request password reset email   |
| POST   | `/auth/reset-password`  | Apply password reset           |
| GET    | `/auth/verify-email`    | Verify email address           |
| GET    | `/auth/google`          | Start Google OAuth             |
| GET    | `/auth/microsoft`       | Start Microsoft OAuth          |
| GET    | `/auth/me`              | Get current user profile       |
| PUT    | `/auth/profile`         | Update profile                 |

### Batches (`/api/v1/batches/`)

| Method | Endpoint                               | Purpose                          |
| ------ | -------------------------------------- | -------------------------------- |
| POST   | `/batches`                             | Create batch                     |
| GET    | `/batches`                             | List batches (paginated)         |
| GET    | `/batches/{id}`                        | Get batch detail                 |
| POST   | `/batches/{id}/activate`               | Activate batch (compliance gate) |
| POST   | `/batches/{id}/upload`                 | Upload CSV                       |
| POST   | `/batches/{id}/validate`               | Validate CSV before upload       |
| GET    | `/batches/{id}/download`               | Download QR ZIP                  |
| GET    | `/batches/{id}/labels`                 | Download labels PDF              |
| GET    | `/batches/{id}/export`                 | Export batch as CSV              |
| GET    | `/batches/{id}/compliance-declaration` | Article 7 PDF                    |

### Passports (`/api/v1/passports/`)

| Method | Endpoint                         | Purpose                   |
| ------ | -------------------------------- | ------------------------- |
| GET    | `/passports/{uuid}`              | Get passport (tier-aware) |
| POST   | `/passports/{uuid}/transition`   | Lifecycle transition      |
| GET    | `/passports/{uuid}/transitions`  | Get allowed next actions  |
| GET    | `/passports/{uuid}/events`       | Get audit event history   |
| GET    | `/passports/{uuid}/verify-chain` | Verify BLAKE2b hash chain |
| POST   | `/passports/{uuid}/telemetry`    | Ingest BMS telemetry      |

### Public Endpoints (No Auth)

| Method | Endpoint                       | Purpose                          |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/p/{uuid}`                    | Public passport page (QR target) |
| POST   | `/passport/{uuid}/transition`  | Transition via magic link        |
| GET    | `/passport/{uuid}/action-info` | Get action info for magic link   |
| POST   | `/scans/record`                | Record QR scan with geo          |

### Other Key Endpoints

| Method | Endpoint              | Purpose                                          |
| ------ | --------------------- | ------------------------------------------------ |
| POST   | `/carbon/calculate`   | Calculate CO₂ footprint                          |
| POST   | `/compliance/check`   | Dry-run compliance check (real-time, no DB save) |
| GET    | `/schemas`            | List product schemas (for dynamic forms)         |
| GET    | `/epr/obligation`     | India EPR obligation                             |
| GET    | `/epr/cpcb-export`    | CPCB Form 3 annual return CSV                    |
| POST   | `/epr/certificates`   | Add EPR certificate to ledger                    |
| GET    | `/epr/certificates`   | List EPR certificates                            |
| POST   | `/team/invite`        | Invite team member                               |
| GET    | `/billing/balance`    | Quota balance                                    |
| POST   | `/billing/top-up`     | Purchase more quota                              |
| POST   | `/data-access/tokens` | Create Article 78 token                          |
| POST   | `/export-jobs`        | Create async export job                          |
| POST   | `/api-keys`           | Create API key                                   |
| GET    | `/templates`          | List label templates                             |
| POST   | `/templates`          | Create label template                            |
| GET    | `/health`             | Health check                                     |

---

## 11. Key Files & Docs You Must Know

### Must-Read Documentation

| File                               | Size   | What It Contains                                                                                                                              | Priority                |
| ---------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `README.md`                        | Medium | Project overview, quick start, API reference, setup instructions                                                                              | ⭐⭐⭐ READ FIRST       |
| `docs/README.md`                   | Small  | Current documentation map and canonical doc entry points                                                                                      | ⭐⭐⭐ Navigation       |
| `PROJECT_FULL_DOCUMENTATION.md`    | 56 KB  | Exhaustive documentation: features, tech, API docs, DB schema, migrations, deployment                                                         | ⭐⭐⭐ Reference doc    |
| `design_system.md`                 | 38 KB  | Core design principles: action-based state machine, immutable audit, RBAC, evidence requirements, three-tier access, BPAN format, carbon calc | ⭐⭐⭐ Core concepts    |
| `PASSPORT_LIFECYCLE_TESTING.md`    | Medium | Manual test guide with state diagram, test cases, cURL examples, DB verification queries                                                      | ⭐⭐ For testing        |
| `ENTERPRISE_COMPLIANCE_ROADMAP.md` | Medium | Active compliance roadmap and remaining regulator-facing gaps                                                                                 | ⭐⭐ Regulatory context |
| `PLATFORM_BLUEPRINT.md`            | Medium | Current platform rollout blueprint, completed waves, and remaining blockers                                                                   | ⭐ Reference            |
| `codex_status.md`                  | Small  | Completed features (Phases 1-6), pending items to verify                                                                                      | ⭐ Change tracking      |

### Must-Know Backend Files

| File                                                 | Why It Matters                                          |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `backend/cmd/server/main.go`                         | Entry point — all dependency wiring happens here        |
| `backend/internal/handlers/handlers.go`              | Handler struct definition and dependency injection      |
| `backend/internal/services/lifecycle.go`             | The core state machine — most business-critical code    |
| `backend/internal/handlers/lifecycle_handlers.go`    | HTTP interface for lifecycle transitions                |
| `backend/internal/handlers/passport_handlers.go`     | Three-tier access control implementation                |
| `backend/internal/services/activation_compliance.go` | Pre-activation checks (EU + India)                      |
| `backend/internal/services/batch_service.go`         | Schema + compliance engine wiring for batch ops         |
| `backend/internal/compliance/registry.go`            | Compliance engine router (ProductType × MarketRegion)   |
| `backend/internal/schema/registry.go`                | Product schema registry (drives dynamic forms)          |
| `backend/internal/serial/generator.go`               | BPAN-V2 serial number generation interface              |
| `backend/internal/events/bus.go`                     | In-memory domain event pub/sub                          |
| `backend/internal/repository/interface.go`           | RepositoryInterface — all DB queries typed              |
| `backend/internal/services/bpan_service.go`          | India serial number generation (legacy)                 |
| `backend/internal/services/carbon_calculator.go`     | Article 7 carbon calculation                            |
| `backend/migrations/`                                | All SQL migrations — understand the DB schema evolution |
| `backend/Makefile`                                   | All dev commands: run, build, test, migrate             |

### Must-Know Frontend Files

| File                                                  | Why It Matters                                   |
| ----------------------------------------------------- | ------------------------------------------------ |
| `frontend/context/auth-context.tsx`                   | Global auth state — used everywhere              |
| `frontend/middleware.ts`                              | Route protection logic                           |
| `frontend/app/p/[uuid]/page.tsx`                      | The public passport page (QR target)             |
| `frontend/app/p/[uuid]/action/page.tsx`               | Magic link action page                           |
| `frontend/app/(dashboard)/batches/`                   | Core user workflow (batch management)            |
| `frontend/components/batches/create-batch-dialog.tsx` | Most complex form in the app                     |
| `frontend/lib/api.ts`                                 | Core API client — all HTTP calls go through here |
| `frontend/lib/api/compliance.ts`                      | Compliance check + score API calls               |
| `frontend/lib/api/epr.ts`                             | EPR certificate + CPCB export API calls          |
| `frontend/hooks/use-queries.ts`                       | Centralised TanStack Query hooks                 |
| `frontend/providers/query-provider.tsx`               | TanStack Query client provider                   |
| `frontend/lib/supabase.ts`                            | Supabase JS client (file storage access)         |
| `frontend/lib/i18n/`                                  | i18n translation files (en/fr/de)                |

### Config Files

| File                    | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `backend/.env.example`  | Backend environment variables (copy to `.env`)                |
| `frontend/.env.example` | Frontend environment variables (copy to `.env.local`)         |
| `backend/Makefile`      | Dev workflow commands                                         |
| `mcp.json`              | MCP server config (filesystem, Railway deployment, Puppeteer) |
| `package.json` (root)   | Root scripts: `npm run lint` runs frontend linter             |

---

## 12. Environment Setup

### Prerequisites

```
- Go 1.24+
- Node.js 20+
- PostgreSQL 16+ (or Supabase account)
- golang-migrate CLI
- air (Go hot reload): go install github.com/air-verse/air@latest
```

### Backend Setup

```bash
cd backend

# Copy environment config
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
#          RESEND_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
#          GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET

# Download dependencies
make deps

# Run database migrations
make migrate-up

# Start development server (hot reload)
make dev
# OR: make run (without hot reload)

# Server starts at: http://localhost:8080
# Swagger UI: http://localhost:8080/docs
# Health check: http://localhost:8080/health
```

### Frontend Setup

```bash
cd frontend

# Copy environment config
cp .env.example .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend starts at: http://localhost:3000
```

### Key Environment Variables

| Variable                                     | Required For                                           |
| -------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                               | Everything — primary data store                        |
| `JWT_SECRET`                                 | Authentication (min 32 chars)                          |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | File storage (QR ZIPs, PDFs)                           |
| `RESEND_API_KEY`                             | Email (invites, password reset, magic links)           |
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`    | Payments (India)                                       |
| `GOOGLE_CLIENT_ID/SECRET`                    | Google OAuth login                                     |
| `MICROSOFT_CLIENT_ID/SECRET`                 | Microsoft OAuth login                                  |
| `REGULATOR_API_KEY`                          | Article 78 regulator access                            |
| `QR_BASE_URL`                                | QR code link target (e.g., `https://yourdomain.com/p`) |

---

## 13. Development Workflow

### Makefile Commands (run from `backend/`)

```bash
make run             # Start server (standard)
make dev             # Start server with hot reload (air)
make build           # Compile binary to ../bin/server
make test            # Run all Go tests with verbose output
make deps            # Download and tidy Go modules
make migrate-up      # Apply pending migrations
make migrate-down    # Roll back last migration
make migrate-reset   # Roll back ALL migrations (DANGER: data loss)
make migrate-version # Show current migration version
make migrate-create  # Create new migration file pair
```

### Adding a New Feature — Typical Flow

1. **Create migration** (if DB schema changes): `make migrate-create name=add_my_field`
2. **Update model** in `internal/models/`
3. **Add repository method** in `internal/repository/` (SQL query)
4. **Add service logic** in `internal/services/`
5. **Add handler** in `internal/handlers/`
6. **Register route** in `cmd/server/main.go`
7. **Add frontend API call** in `frontend/lib/api.ts`
8. **Build UI** in `frontend/components/` and `frontend/app/`
9. **Write tests**: Go test file for handler/service, manual test in `testing/`
10. **Run migrations**: `make migrate-up`
11. **Test locally**: `make dev` + `npm run dev`

### Running Tests

```bash
# All backend tests
cd backend && make test

# Specific test file
cd backend && go test ./internal/services/ -run TestCarbonCalculator -v

# Frontend linting
npm run lint
```

---

## 14. Testing Strategy

### Backend Tests (`backend/internal/`)

| Test File                       | What It Tests                                          |
| ------------------------------- | ------------------------------------------------------ |
| `auth_handlers_test.go`         | Registration, login, OAuth flows                       |
| `batch_handlers_test.go`        | Batch creation, CSV upload, activation                 |
| `lifecycle_handlers_test.go`    | Action-based transitions, evidence validation          |
| `lifecycle_test.go`             | State machine correctness                              |
| `lifecycle_role_test.go`        | Role enforcement matrix (who can do what)              |
| `lifecycle_evidence_test.go`    | Evidence validation rules per action                   |
| `magic_link_handlers_test.go`   | Magic link security (single-use, expiry, binding)      |
| `carbon_calculator_test.go`     | JRC carbon calculation accuracy                        |
| `bpan_service_test.go`          | BPAN format generation and validation                  |
| `event_hash_test.go`            | BLAKE2b hash chain verification                        |
| `epr_obligation_test.go`        | India EPR tonnage calculations                         |
| `activation_compliance_test.go` | EU + India pre-activation gate checks                  |
| `webhook_handlers_test.go`      | Razorpay webhook signature verification                |
| `validation_test.go`            | India regulatory regex validators (IEC, HSN, EPR, BIS) |
| `qr_service_test.go`            | QR code PNG generation                                 |
| `schema/registry_test.go`       | Product schema registry cache + fallback               |
| `compliance/registry_test.go`   | Compliance engine validator routing                    |
| `serial/generator_test.go`      | BPAN-V2 serial format generation                       |
| `integration_test.go`           | Full end-to-end flows                                  |

### Manual Test Guides (`testing/`)

| File                                  | Covers                              |
| ------------------------------------- | ----------------------------------- |
| `01-authentication-onboarding.md`     | Auth flows, onboarding              |
| `02-compliance-documents-settings.md` | Document upload, admin verification |
| `03-batch-creation-carbon.md`         | Batch creation, carbon calculation  |
| `04-passport-views-i18n.md`           | Multi-language passport views       |
| `05-data-access-tokens.md`            | Article 78 three-tier access        |
| `06-magic-link-eol.md`                | Magic link lifecycle transitions    |
| `07-audit-export.md`                  | Audit trail exports                 |

Also see: `PASSPORT_LIFECYCLE_TESTING.md` — the most complete manual test guide with cURL examples and database verification queries.

---

## 15. Compliance & Regulatory Context

Understanding the regulations drives understanding the code. Here's the minimum you need to know:

### EU Battery Regulation 2023/1542

| Article        | Requirement                                                   | Platform Implementation                                |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| **Article 7**  | Carbon footprint declaration per battery model                | `carbon_calculator_service.go`, carbon declaration PDF |
| **Article 77** | Digital Battery Passport — unique ID, QR code, lifecycle data | Core UUID passport system, public `/p/{uuid}` page     |
| **Article 78** | Tiered data access for different actors                       | Three-tier PUBLIC/PARTNER/REGULATOR access control     |

### India Battery Aadhaar + BIS + EPR

| Standard         | Requirement                                   | Platform Implementation                                              |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| **BPAN**         | Unique 21-char Battery Passport Number        | `bpan_service.go`, serial auto-generation                            |
| **BIS IS 16046** | Battery safety certification                  | Certificate upload, `bis_status` tracking, admin verification        |
| **EPR**          | Extended Producer Responsibility registration | Certificate upload, `epr_status` tracking, EPR obligation calculator |
| **PLI**          | Production Linked Incentive scheme            | Certificate upload, DVA ≥40% validation, `pli_status` tracking       |

### Compliance Enforcement Points

- **Batch Activation Gate**: `activation_compliance.go` — a batch cannot be activated without all required compliance fields set and certificates verified
- **Real-Time Compliance Check**: `compliance_handler.go` / `POST /compliance/check` — dry-run check called by the frontend as users fill in batch specs; returns per-rule pass/fail + overall score
- **Compliance Engine**: `internal/compliance/registry.go` routes checks to the correct EU or India validator based on `(ProductType, MarketRegion)`
- **Pre-Activation Checks**: Different requirements for EU vs India vs Global batches
- **Evidence Requirements**: Lifecycle transitions require specific evidence fields (enforced in `lifecycle.go`)
- **India Validation**: Strict regex validators for IEC, EPR, BIS R-Number, HSN codes (`validation.go`)
- **Immutable Audit**: `passport_events` table triggers prevent any mutation — regulatory requirement for tamper-evident records
- **CPCB Annual Return**: `cpcb_export_service.go` auto-generates Form 3 CSV from EPR certificate ledger entries

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│  AnvayaLabs Battery — Quick Reference                         │
├─────────────────────────────────────────────────────────────────┤
│  Backend:  http://localhost:8080  (Go 1.24)                    │
│  Frontend: http://localhost:3000  (Next.js 16)                 │
│  Swagger:  http://localhost:8080/docs                          │
│  Health:   http://localhost:8080/health                        │
├─────────────────────────────────────────────────────────────────┤
│  Passport States:                                               │
│  CREATED → ACTIVE → SHIPPED → IN_SERVICE → RECYCLED → EOL      │
│              ↑ Any state can be RECALLED                        │
├─────────────────────────────────────────────────────────────────┤
│  Access Tiers: PUBLIC (no auth) | PARTNER (magic link) |        │
│                REGULATOR (X-Regulator-Key header)              │
├─────────────────────────────────────────────────────────────────┤
│  Markets: EU (Art. 7/77/78) | INDIA (BPAN/BIS/EPR/PLI)         │
├─────────────────────────────────────────────────────────────────┤
│  Key Commands:                                                  │
│    make dev          ← Start Go backend (hot reload)           │
│    make test         ← Run Go tests                            │
│    make migrate-up   ← Apply DB migrations                     │
│    npm run dev       ← Start Next.js frontend                  │
└─────────────────────────────────────────────────────────────────┘
```

---

_This document was last updated to reflect the current codebase state. For the most up-to-date API reference, see `PROJECT_FULL_DOCUMENTATION.md` and `/api/v1/openapi.yaml`._
