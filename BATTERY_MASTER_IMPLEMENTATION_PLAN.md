# Battery Platform — Master Implementation Plan
## From "70% Functional" to "Production-Ready Regulatory Platform"

> **Date:** 2026-06-06  
> **Scope:** `apps/battery-*`, `services/battery-api`  
> **Status:** Foundation is solid. Missing parts are **architectural**, not cosmetic.  
> **Goal:** Close the gaps that block 2027 regulatory deadlines (EU Battery Passport, OECD Due Diligence, India EPR live filing).

---

## Executive Summary

The battery codebase has **strong bones**: the web app and API are feature-rich, the schema engine is product-agnostic, and the India EPR module is a genuine competitive moat. However, five architectural domains are **half-baked or entirely missing**. These are not bugs you fix in an afternoon — they require **proper subsystem design**.

| Domain | Current State | Why It's Half-Baked | Regulatory Risk |
|--------|--------------|---------------------|-----------------|
| **Registry Integrations** | 4 adapters, all stubs returning `self_declared` | No HTTP client, no retry logic, no async queue, no cache | Cannot verify certificates against BIS/CPCB/EU NANDO |
| **Due Diligence Engine** | PDF renderer only | No risk model, no CMRT/OECD workflow, no supplier scoring | EU Art. 48–52 mandatory Aug 2027 |
| **Mobile App** | Empty Expo scaffold | No auth, no API client, no QR scanning, no offline sync | Field technicians cannot update lifecycle |
| **Desktop App** | Thin Tauri shell with page stubs | No offline storage, no local QR print, no factory-floor sync | Factory floors need offline-capable QR printing |
| **Regulatory Intelligence** | ✅ Complete (`75dce58`) | RSS/scraper ingestion, rule-based classifier, tenant alerts, notification bell + dashboard | Customers miss regulatory changes (e.g. Omnibus delays) |
| **Carbon / LCA** | Static JRC factors | No supplier primary data ingestion, no dynamic LCA | Art. 7 requires supplier-specific footprints by 2025–27 |
| **Event Architecture** | Monolithic synchronous Go binary | No pub/sub, no real-time compliance updates, no webhook reliability | Cannot scale telemetry ingestion independently |

This plan treats each domain as a **subsystem** with its own data model, API contract, and rollout phase. We do not recommend "just fixing" the stubs. We recommend building the **proper infrastructure** around them.

---

## Phase A — Registry Integration Subsystem (4 weeks)

### A.1 The Problem

`services/battery-api/internal/integrations/registry/adapter.go` contains four adapters (BIS, CPCB, EU NANDO, UN38.3). Every `Verify()` method does this:

```go
if !a.IsConfigured() {
    return self_declared  // ← ALWAYS this branch in production
}
// TODO: implement real API
```

This is not a "missing API key" problem. It is an **architecture problem**:
- No async verification queue (regulatory APIs are slow / rate-limited)
- No result caching (same cert verified N times)
- No retry / circuit-breaker (government APIs go down)
- No audit trail of *when* a cert was last verified
- UI shows "verified" badges that mean nothing

### A.2 Proper Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Registry Subsystem                       │
├─────────────────────────────────────────────────────────────┤
│  Async Queue (PostgreSQL `registry_jobs` table)             │
│   ├─ enqueue on certificate upload / batch create           │
│   ├─ worker pool (3 goroutines) polls `pending` jobs        │
│   ├─ exponential backoff on 429/5xx                         │
│   └─ dead-letter queue after 5 retries                      │
│                                                              │
│  Adapter Interface (existing — keep it)                     │
│   ├─ HTTP client with timeout (10s)                         │
│   ├─ structured logging of every request/response           │
│   └─ env-configured base URLs + API keys                    │
│                                                              │
│  Result Cache (`registry_verification_results` table)       │
│   ├─ PK = (registry_type, certificate_no, verified_at)      │
│   ├─ TTL = 7 days (configurable per adapter)                │
│   └─ serves read-heavy UI tabs without API calls            │
│                                                              │
│  Audit Ledger (`registry_audit_log` table)                  │
│   ├─ who triggered the check                                │
│   ├─ raw API response (JSONB)                               │
│   └─ hash chain for tamper evidence                         │
└─────────────────────────────────────────────────────────────┘
```

### A.3 Data Model Additions

```sql
-- Async job queue for registry checks
CREATE TABLE registry_jobs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_type   text NOT NULL,      -- 'bis', 'cpcb', 'eu_nando', 'un38.3'
    certificate_no  text NOT NULL,
    batch_id        uuid REFERENCES batches(id) ON DELETE CASCADE,
    tenant_id       uuid NOT NULL,
    status          text NOT NULL DEFAULT 'pending', -- pending, running, success, failed, dead
    attempt_count   int NOT NULL DEFAULT 0,
    next_attempt_at timestamptz,
    result_id       uuid,
    error_message   text,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_registry_jobs_status_next ON registry_jobs(status, next_attempt_at) WHERE status IN ('pending', 'failed');

-- Cached verification results
CREATE TABLE registry_verification_results (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_type   text NOT NULL,
    certificate_no  text NOT NULL,
    trust_tier      text NOT NULL,      -- self_declared, third_party, official_api
    status          text NOT NULL,      -- verified, not_found, expired, error
    verified_data   jsonb,
    raw_response    jsonb,
    expires_at      timestamptz NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_reg_results_unique ON registry_verification_results(registry_type, certificate_no) WHERE expires_at > NOW();

-- Audit trail
CREATE TABLE registry_audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          uuid REFERENCES registry_jobs(id),
    registry_type   text NOT NULL,
    certificate_no  text NOT NULL,
    request_payload jsonb,
    response_payload jsonb,
    latency_ms      int,
    created_at      timestamptz NOT NULL DEFAULT NOW()
);
```

### A.4 Implementation Steps

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Create tables + migrations; build `RegistryJobRepository` + worker pool | Jobs enqueue and process |
| 2 | Implement real HTTP adapters for BIS (public CRS lookup) and CPCB (EPR credit API docs) | Adapters hit real endpoints in staging |
| 3 | Add circuit-breaker (fail-fast after 3 errors), caching layer, dead-letter UI | Resilient subsystem |
| 4 | Wire async verification into batch creation + certificate upload flows; update UI badges to show "pending / verified / self-declared" | End-to-end flow |

### A.5 Why This Is The Right Way

- **Government APIs are unreliable.** Calling them synchronously during an HTTP request will timeout and frustrate users.
- **Certificates don't change often.** Caching avoids rate limits and improves UX.
- **Regulators will ask "when did you last verify?"** The audit log answers that.

---

## Phase B — Due Diligence Engine (6 weeks)

### B.1 The Problem

Current due diligence = `due_diligence_pdf.go`. It renders a beautiful PDF with batch data, but:
- No **supplier risk scoring** (OECD Step 2/3)
- No **CMRT/CRT template** import or validation
- No **country-risk flags** (conflict minerals, child labor)
- No **corrective action workflow** (supplier fails audit → what happens?)
- No **mine-to-smelter** chain of custody tracking

This is the **largest EU compliance gap**. Art. 48–52 requires a *management system*, not a PDF.

### B.2 Proper Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Due Diligence Subsystem                       │
├─────────────────────────────────────────────────────────────┤
│  1. SUPPLIER RISK PROFILE                                    │
│     ├─ Country risk tier (1–4) from Basel AML + USGS       │
│     ├─ Mineral-type risk flag (Li, Co, Ni, graphite)       │
│     ├─ Audit history (RMAP, third-party)                   │
│     └─ Automated score 0–100                               │
│                                                              │
│  2. OECD WORKFLOW ENGINE (5-step state machine)            │
│     Step 1: Policy → Step 2: Identify → Step 3: Assess     │
│     Step 4: Respond → Step 5: Audit                        │
│     Each step has checklists, evidence attachments,        │
│     and sign-off timestamps.                                │
│                                                              │
│  3. CMRT / CRT IMPORTER                                    │
│     ├─ Parse Excel templates (SmelterRef, MineralConcentrate)
│     ├─ Validate against RMI smelter reference list         │
│     ├─ Flag unknown / uncertified smelters                 │
│     └─ Store per-supplier, per-reporting-year              │
│                                                              │
│  4. CORRECTIVE ACTION TRACKING                             │
│     ├─ Non-conformance detected → auto-create CA ticket    │
│     ├─ Supplier uploads remediation evidence               │
│     ├─ Review + close workflow                             │
│     └─ Escalate to alternative supplier if unresolved      │
└─────────────────────────────────────────────────────────────┘
```

### B.3 Data Model Additions

```sql
-- Supplier risk profiles (auto-computed + manual override)
CREATE TABLE supplier_risk_profiles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    overall_score       int NOT NULL DEFAULT 0, -- 0–100, lower is better
    country_risk_tier   int NOT NULL DEFAULT 1, -- 1=low, 4=extreme
    mineral_risk_flags  text[] NOT NULL DEFAULT '{}', -- ['cobalt', 'lithium']
    rmap_valid          boolean,
    last_audit_date     date,
    next_audit_due      date,
    computed_at         timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(supplier_id)
);

-- OECD Step tracking per supplier
CREATE TABLE due_diligence_assessments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    batch_id            uuid REFERENCES batches(id) ON DELETE SET NULL,
    step                text NOT NULL CHECK (step IN ('policy','identify','assess','respond','audit')),
    status              text NOT NULL DEFAULT 'not_started', -- not_started, in_progress, complete, failed
    evidence_docs       uuid[] NOT NULL DEFAULT '{}',
    completed_by        uuid REFERENCES users(id),
    completed_at        timestamptz,
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT NOW(),
    updated_at          timestamptz NOT NULL DEFAULT NOW()
);

-- CMRT / Smelter data
CREATE TABLE supplier_cmrt_reports (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    reporting_year      int NOT NULL,
    file_url            text NOT NULL,
    smelters            jsonb NOT NULL DEFAULT '[]', -- [{name, country, mineral, rmi_status}]
    unknown_smelters    int NOT NULL DEFAULT 0,
    rmi_conformant_pct  int,
    parsed_at           timestamptz,
    created_at          timestamptz NOT NULL DEFAULT NOW()
);

-- Corrective actions
CREATE TABLE corrective_actions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    assessment_id       uuid REFERENCES due_diligence_assessments(id),
    title               text NOT NULL,
    description         text NOT NULL,
    severity            text NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    status              text NOT NULL DEFAULT 'open', -- open, remediated, verified, escalated, closed
    due_date            date NOT NULL,
    remediated_at       timestamptz,
    verified_by         uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT NOW()
);
```

### B.4 Implementation Steps

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Create tables; build country-risk seed data (Basel + USGS); `SupplierRiskProfile` calculator | Risk scores compute for existing suppliers |
| 2 | Build OECD 5-step state machine API (`POST /suppliers/{id}/dd-assessments`, transitions) | Can create and advance assessments |
| 3 | CMRT Excel parser (`github.com/xuri/excelize/v2`); RMI smelter reference list importer | Upload CMRT → parsed smelters + flags |
| 4 | Corrective action CRUD + workflow (create from failed assessment, due-date alerts, close loop) | Full CA lifecycle |
| 5 | Integrate DD score into batch compliance validator; update PDF to include risk summary | PDF now shows real risk data |
| 6 | Frontend: Supplier risk cards, DD step wizard, CMRT upload dialog, CA dashboard | UX for the entire flow |

### B.5 Why This Is The Right Way

- **OECD guidance is a *process*, not a document.** The PDF is output; the workflow is the product.
- **CMRT is the industry standard.** Without it, customers manually transcribe Excel sheets into your system.
- **Risk scoring must be automated.** Manual risk assessment does not scale to 200+ suppliers.

---

## Phase C — Mobile App (6 weeks)

### C.1 The Problem

`apps/battery-mobile/App.tsx` is a 30-line Expo scaffold with a title and subtitle. It has:
- No navigation
- No API client
- No auth
- No QR scanner
- No offline storage

Field technicians, recyclers, and logistics partners **cannot use the platform** without a mobile app.

### C.2 Proper Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Mobile Subsystem (Expo)                     │
├─────────────────────────────────────────────────────────────┤
│  Stack: Expo SDK 52 + React Navigation + React Query        │
│                                                              │
│  Modules:                                                    │
│   1. AUTH    ── Magic-link login, JWT refresh, biometric   │
│   2. SCAN    ── `expo-camera` QR scan → passport lookup    │
│   3. PASSPORT ── Read-only view (public + tiered)          │
│   4. LIFECYCLE ── Transition actions (dispatch, recycle)   │
│   5. OFFLINE  ── SQLite (`expo-sqlite`) queue for actions  │
│   6. SYNC    ── Background sync when connectivity returns  │
└─────────────────────────────────────────────────────────────┘
```

### C.3 API Contracts (Mobile-Specific)

```
POST /auth/mobile-login          → returns JWT + refresh token
POST /auth/refresh               → rotates JWT
GET  /passports/{uuid}/public    → lightweight public payload (no auth)
POST /passports/{uuid}/lifecycle → submit transition (returns job ID)
GET  /jobs/{id}                  → poll async lifecycle job status
```

### C.4 Offline-First Design

```typescript
// lib/offline-queue.ts
interface PendingAction {
  id: string;
  type: 'lifecycle_transition' | 'soh_update' | 'repair_log';
  payload: object;
  retryCount: number;
  createdAt: number;
}

// Queue writes to SQLite immediately.
// Background sync task (expo-task-manager) flushes queue every 60s when online.
// If sync fails, retry with exponential backoff.
// User sees "3 changes pending sync" badge.
```

### C.5 Implementation Steps

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Project setup: folder structure, navigation, auth context, API client with refresh | Login flow works |
| 2 | QR scanner module (`expo-camera`); scan → decode BPAN → fetch public passport | Scanning works end-to-end |
| 3 | Passport detail view (public tier); offline SQLite caching of last 50 scanned | Works offline for recent scans |
| 4 | Lifecycle transition UI (dispatch to recycler, mark retired, SOH update); local queue | Actions queued locally |
| 5 | Background sync (`expo-background-fetch`); conflict resolution (server wins) | Queue flushes automatically |
| 6 | Polish: push notifications for scan results, deep linking, biometrics | Production-ready build |

### C.6 Why This Is The Right Way

- **Factory floors and recycling yards have poor connectivity.** Offline-first is not a nice-to-have; it's required.
- **QR scanning is the primary mobile use case.** Everything else is secondary.
- **Sharing the web codebase via WebView is lazy.** A native Expo app gives camera, SQLite, and background tasks.

---

## Phase D — Desktop App (4 weeks)

### D.1 The Problem

`apps/battery-desktop` is a Tauri shell with React pages. It has routes but many pages are thin wrappers around API calls. There is **no offline capability**, **no local printer integration**, and **no factory-floor value proposition**.

### D.2 Proper Architecture

The desktop app should **not** be a clone of the web app. It should serve **one primary persona**: the factory-floor operator who needs to:
1. Print QR labels on a Zebra/TSC thermal printer via USB
2. Work offline when the LAN drops
3. Bulk-generate passports from a local CSV
4. Sync with central when connection returns

```
┌─────────────────────────────────────────────────────────────┐
│              Desktop Subsystem (Tauri + Rust)                │
├─────────────────────────────────────────────────────────────┤
│  Frontend: React (same design system as web)                │
│  Backend: Tauri Rust commands for:                          │
│   ├─ USB printer detection & ZPL generation                │
│   ├─ Local SQLite db (batches, passports, print jobs)      │
│   ├─ File system CSV import                                │
│   ├─ Background sync daemon                                │
│   └─ Secure credential store (keyring)                     │
│                                                              │
│  Mode: Online (syncs continuously) OR Offline (queues)     │
└─────────────────────────────────────────────────────────────┘
```

### D.3 Tauri Commands (Rust)

```rust
// src-tauri/src/printer.rs
#[tauri::command]
async fn detect_usb_printers() -> Vec<PrinterInfo> { ... }

#[tauri::command]
async fn print_zpl(label: ZplPayload) -> Result<PrintJobId, PrintError> { ... }

// src-tauri/src/sync.rs
#[tauri::command]
async fn sync_now(app_handle: AppHandle) -> SyncResult { ... }

#[tauri::command]
async fn import_csv(path: String) -> CsvImportResult { ... }
```

### D.4 Implementation Steps

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Set up Tauri Rust project structure; local SQLite schema (mirrors core tables) | Builds and runs |
| 2 | USB printer detection (Windows/Linux); ZPL template engine for QR labels | Prints test labels to Zebra |
| 3 | Offline SQLite sync: two-way replication with conflict resolution (server wins) | Disconnect LAN → still works |
| 4 | CSV bulk import UI + local queue; settings for printer selection; packaging | Factory-floor ready installer |

### D.5 Why This Is The Right Way

- **Web apps cannot talk to USB printers.** Tauri Rust commands can.
- **Factory floors don't trust cloud-only.** Local queue + sync gives operators control.
- **If desktop just wraps the web app, delete it.** The value is offline + hardware integration.

---

## Phase E — Regulatory Intelligence Module (4 weeks) ✅ COMPLETE

### E.1 The Problem

There is no system watching regulatory changes. Customers find out about new rules from WhatsApp groups. The platform has `alerts.go` for certificate expiry, but **nothing for policy changes**.

### E.2 Proper Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           Regulatory Intelligence Subsystem                  │
├─────────────────────────────────────────────────────────────┤
│  Ingestion Layer                                             │
│   ├─ EU Official Journal RSS / API                          │
│   ├─ MoEF&CC notification scraper                           │
│   ├─ CPCB circular scraper                                  │
│   ├─ ECHA SVHC list (monthly XML)                           │
│   └─ Manual admin entry for urgent alerts                   │
│                                                              │
│  Classification Engine                                       │
│   ├─ NLP tagging (product_type, market_region, urgency)     │
│   ├─ Rule matching against tenant's active markets          │
│   └─ Deadline extraction (parse "by 18 February 2027")      │
│                                                              │
│  Delivery Layer                                              │
│   ├─ In-app notification bell                               │
│   ├─ Email digest (weekly / urgent)                         │
│   ├─ SMS for P0 deadlines (configurable)                    │
│   └─ Webhook for enterprise customers                       │
│                                                              │
│  Tenant Impact Dashboard                                     │
│   ├─ "This affects your India EPR workflow"                 │
│   ├─ Auto-suggest compliance rule updates                   │
│   └─ Deadline countdown timers                              │
└─────────────────────────────────────────────────────────────┘
```

### E.3 Data Model Additions

```sql
CREATE TABLE regulatory_sources (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,      -- "EU Official Journal"
    url         text NOT NULL,
    source_type text NOT NULL,      -- rss, api, scraper, manual
    fetch_cron  text NOT NULL DEFAULT '0 6 * * *', -- daily at 6am
    last_fetched_at timestamptz,
    last_etag   text,
    is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE regulatory_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       uuid NOT NULL REFERENCES regulatory_sources(id),
    external_id     text NOT NULL,      -- RSS guid, URL, etc.
    title           text NOT NULL,
    summary         text,
    url             text,
    published_at    timestamptz NOT NULL,
    product_types   text[] NOT NULL DEFAULT '{}', -- ['battery', 'textile']
    market_regions  text[] NOT NULL DEFAULT '{}', -- ['india', 'eu']
    urgency         text NOT NULL DEFAULT 'normal', -- low, normal, high, critical
    deadline_date   date,
    ai_tags         jsonb,              -- NLP output
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

CREATE TABLE tenant_regulatory_alerts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id         uuid NOT NULL REFERENCES regulatory_items(id),
    is_read         boolean NOT NULL DEFAULT false,
    dismissed_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT NOW()
);
```

### E.4 Implementation Steps

| Week | Task | Deliverable | Status |
|------|------|-------------|--------|
| 1 | Source abstraction + RSS fetcher; MoEF/CPCB scrapers | Daily ingestion running | ✅ Done — stdlib XML RSS + regex scraper |
| 2 | NLP classification: tag product/region/urgency/deadline | Auto-classified items | ✅ Done — rule-based classifier (OpenAI deferred) |
| 3 | Tenant alert matching; in-app notification bell | Users see personalized alerts | ✅ Done — unified bell with legacy + regulatory alerts |
| 4 | Admin dashboard for manual alert entry; deadline countdown | Full delivery layer | ✅ Done — regulatory dashboard with feed/alerts/sources tabs |

**Completed in commit `75dce58` (2026-06-06).**

**What was built:**
- Migration `000092`: `regulatory_sources`, `regulatory_items`, `tenant_regulatory_alerts`
- Go ingestion engine: RSS fetcher (stdlib `encoding/xml`), regex HTML scraper, rule-based classifier
- Background worker: 6h ticker, auto-seeds EU OJ / ECHA SVHC / MoEF&CC sources
- Handlers: sources CRUD, items list with filters, tenant alerts read/dismiss, force-fetch, unread count
- React: unified notification bell (legacy + regulatory alerts), regulatory dashboard page (feed / my alerts / sources)
- Nav: "Regulatory" added to Compliance sidebar group

**Deferred to future:**
- Email digest sender (weekly/urgent)
- SMS for P0 deadlines
- Webhook delivery for enterprise customers
- OpenAI API NLP (rule-based is fast and deterministic; swap later)
- Real MoEF/CPCB scraper selectors (seeded with placeholder regex)

### E.5 Why This Is The Right Way

- **Regulatory change is the #1 customer anxiety.** Automating this creates massive stickiness.
- **Manual monitoring does not scale.** A scraper + NLP pipeline catches 90% of changes automatically.
- **Competitors don't have this.** It is a genuine differentiator.

---

## Phase F — Dynamic Carbon / LCA (4 weeks)

### F.1 The Problem

`carbon_calculator.go` uses static JRC emission factors. It cannot accept **supplier-specific primary data** (actual electricity bills, transport manifests, chemical invoices). By 2025–27, EU auditors will demand primary data, not defaults.

### F.2 Proper Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Dynamic LCA Subsystem                           │
├─────────────────────────────────────────────────────────────┤
│  1. UPSTREAM DATA COLLECTION API                             │
│     Suppliers submit via portal:                            │
│       ├─ Energy consumption (kWh) + grid mix certificate    │
│       ├─ Material inputs (kg) + supplier invoices           │
│       ├─ Transport (ton-km) + mode (sea/road/rail)          │
│       └─ Waste output (kg) + disposal method                │
│                                                              │
│  2. ACTIVITY DATA STORE (`supplier_activity_data`)          │
│     Versioned, auditable, per-supplier-per-quarter          │
│                                                              │
│  3. CALCULATION ENGINE v2                                    │
│     ├─ Fallback to JRC static factors if no primary data    │
│     ├─ Blend primary + secondary data with uncertainty      │
│     ├─ Monte Carlo simulation for confidence intervals      │
│     └─ A–G performance class recalculation                  │
│                                                              │
│  4. AUDIT TRAIL                                              │
│     Every factor tagged with source + confidence level      │
└─────────────────────────────────────────────────────────────┘
```

### F.3 Data Model Additions

```sql
CREATE TABLE supplier_activity_data (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id     uuid NOT NULL REFERENCES suppliers(id),
    reporting_period text NOT NULL,     -- "2025-Q2"
    activity_type   text NOT NULL,      -- energy, material, transport, waste
    activity_data   jsonb NOT NULL,     -- {kwh: 5000, grid_mix: "india_grid"}
    evidence_files  uuid[] NOT NULL DEFAULT '{}',
    submitted_by    uuid REFERENCES users(id),
    submitted_at    timestamptz NOT NULL DEFAULT NOW(),
    reviewed_at     timestamptz,
    reviewed_by     uuid REFERENCES users(id),
    status          text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    UNIQUE(supplier_id, reporting_period, activity_type)
);

CREATE TABLE carbon_calculations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id        uuid NOT NULL REFERENCES batches(id),
    calculation_type text NOT NULL DEFAULT 'static', -- static, blended, primary
    total_kg_co2eq  numeric NOT NULL,
    per_kwh_kg_co2eq numeric,
    confidence_interval_95 jsonb, -- {lower, upper}
    factor_sources  jsonb NOT NULL, -- audit trail of every factor used
    calculated_at   timestamptz NOT NULL DEFAULT NOW()
);
```

### F.4 Implementation Steps

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Supplier portal: activity data upload forms (energy, transport, materials) | Suppliers can submit data |
| 2 | Activity data review workflow (approve/reject with comments) | QA on supplier submissions |
| 3 | Calculation engine v2: blend primary + JRC factors; uncertainty propagation | Carbon result shows confidence interval |
| 4 | Recalculate existing batches with blended data; update passport PDF | Improved accuracy on live data |

---

## Phase G — Event-Driven Architecture (4 weeks)

### G.1 The Problem

The backend is a single Go binary. Compliance checks, export jobs, registry verification, and telemetry ingestion all compete for the same HTTP handlers and DB connections. There is **no pub/sub**, no decoupling, and no independent scaling.

### G.2 Proper Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Event Bus Subsystem                             │
├─────────────────────────────────────────────────────────────┤
│  Transport: PostgreSQL LISTEN/NOTIFY (v1) → Redis Streams   │
│             or NATS (v2 when scale demands)                 │
│                                                              │
│  Events:                                                     │
│   ├─ batch.created                                          │
│   ├─ batch.compliance_checked                               │
│   ├─ passport.lifecycle_changed                             │
│   ├─ supplier.document_uploaded                             │
│   ├─ registry.verification_completed                        │
│   └─ carbon.calculation_completed                           │
│                                                              │
│  Consumers:                                                  │
│   ├─ ComplianceWorker ── listens → runs validators          │
│   ├─ ExportWorker ── listens → generates ZIP/PDF            │
│   ├─ AlertWorker ── listens → sends notifications           │
│   ├─ RegistryWorker ── listens → queues verification        │
│   └─ WebhookWorker ── listens → dispatches to partners      │
│                                                              │
│  Idempotency: event_id deduplication (7-day window)         │
└─────────────────────────────────────────────────────────────┘
```

### G.3 Implementation Steps

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | `EventBus` interface + PostgreSQL NOTIFY implementation; `Event` schema | Events publish and subscribe |
| 2 | Refactor compliance check from sync handler to async consumer | `/batches` POST returns instantly; compliance runs in background |
| 3 | Refactor export jobs, registry checks, alerts to event consumers | All background work is event-driven |
| 4 | Webhook delivery worker with retry + dead-letter; monitoring dashboard | Partners receive reliable webhooks |

---

## Cross-Cutting Concerns

### 1. GDPR / DPDP Erasure Workflows

Add to `services/battery-api`:
```
POST /data-request/export          → initiates tenant data export job
POST /data-request/erasure         → soft-delete tenant + anonymize passports
GET  /data-request/status/{id}     → track progress
```

The erasure workflow must:
1. Mark tenant `deleted_at`
2. Anonymize passport_events (remove PII, keep structural data)
3. Delete auth tokens
4. Archive audit logs to cold storage
5. Notify admin when complete

### 2. Data Residency

Add `data_residency` column to `tenants` (`india`, `eu`, `global`).
- India tenants: data stays in India region
- EU tenants: data stays in EU region
- Implement via separate DB read replicas or sharding layer

### 3. Testing Strategy

Every phase must include:
- **Contract tests:** Pact or hand-rolled consumer-driven contract tests between web/mobile/desktop and API
- **Integration tests:** Docker Compose stack with PostgreSQL + Redis + API; run on CI
- **Load tests:** k6 scenarios for batch creation (100/min), passport lookup (1000/min)
- **Compliance regression:** Known test batch must score identically before/after each refactor

---

## Execution Roadmap

### Recommended Order (Dependencies)

```
Month 1 ── Phase A (Registry Subsystem) ──────────────────────
Month 1 ── Phase G v1 (Event Bus scaffold) ───────────────────
           │
Month 2 ── Phase B (Due Diligence Engine) ────────────────────
Month 2 ── Phase C Weeks 1–2 (Mobile Auth + Scan) ───────────
           │
Month 3 ── Phase C Weeks 3–6 (Mobile Offline + Sync) ─────────
Month 3 ── Phase D (Desktop Offline + Print) ─────────────────
           │
Month 4 ── Phase E (Regulatory Intelligence) ─────────────────
Month 4 ── Phase F (Dynamic Carbon) ──────────────────────────
Month 4 ── Phase G v2 (Full async migration) ─────────────────
```

**Why this order?**
1. **Event Bus first** because Phases B, C, D, and E all produce/consume events.
2. **Registry next** because it is the smallest scoped subsystem and unblocks trust claims.
3. **Due Diligence parallel with Mobile** — different teams can own each.
4. **Regulatory Intelligence last** because it is additive (does not block other features).

### Team Assignment (Suggested)

| Squad | Focus | Size |
|-------|-------|------|
| Platform | Event Bus + Registry + DevOps | 2 backend engineers |
| Compliance | Due Diligence + Dynamic Carbon | 2 backend + 1 data |
| Mobile | Expo app (iOS + Android) | 2 React Native engineers |
| Desktop | Tauri + Rust printer integration | 1 Rust + 1 frontend |
| Web / UX | Regulatory Intelligence UI + polish | 2 frontend engineers |

### Definition of Done (Per Phase)

- [ ] All new tables have migrations + rollback scripts
- [ ] API changes have OpenAPI spec updates
- [ ] Frontend changes have Storybook stories (where applicable)
- [ ] Integration tests pass in CI
- [ ] Load test shows <200ms p95 for reads, <2s for async job enqueue
- [ ] Security review: no new secrets in code, auth on all new endpoints
- [ ] Documentation: `docs/` updated with subsystem architecture

---

## Success Metrics (6 Months)

| Metric | Baseline | Target |
|--------|----------|--------|
| Registry verifications (real API) | 0% | 80% of BIS/CPCB certs |
| Due diligence assessments | 0 | 100+ suppliers with OECD workflow |
| Mobile app feature parity | 0% | QR scan + lifecycle + offline sync |
| Desktop offline capability | No | Yes (factory-floor ready) |
| Regulatory alerts per month | 0 | 15+ auto-classified |
| Async job throughput | ~10/min | 500/min |
| Carbon calculations with primary data | 0% | 25% of batches |

---

## Out of Scope (Intentionally)

- Blockchain anchoring beyond current OpenTimestamps (sufficient for MVP)
- ERP connectors (SAP, Oracle) — partner integration, not core
- IoT BMS protocols (CAN bus, MQTT) — future telemetry layer
- Textile DPP expansion — separate product line
- Multi-region active-active deployment — infrastructure, not product

---

## Conclusion

The battery platform does **not** need more features. It needs **proper subsystems** in the five domains where stubs currently exist. This plan treats each domain as a first-class architectural component with its own data model, API contract, and operational characteristics.

**The highest ROI investments, in order:**
1. **Registry Subsystem** — removes the "self-declared" trust gap immediately
2. **Due Diligence Engine** — mandatory for EU market access by Aug 2027
3. **Mobile App** — unlocks field technicians and recyclers as users
4. **Event Bus** — makes everything else scalable and observable
5. **Regulatory Intelligence** — creates a moat no competitor has

Execute in 4-month sprints. Measure subsystem metrics, not just "features shipped."
