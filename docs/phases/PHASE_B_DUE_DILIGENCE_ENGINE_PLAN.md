# Phase B — Due Diligence Engine

## Context

**Branch:** `feat/textile-foundation` (continuing from Phase A commit `424cc0a`)
**Hard deadline:** August 2027 (EU Battery Regulation Art. 48–52)
**Duration:** 6 weeks (compressed to what we can execute now)

## B.1 The Problem

Current due diligence = `due_diligence_pdf.go`. It renders a beautiful PDF with batch data, but:
- No **supplier risk scoring** (OECD Step 2/3)
- No **CMRT/CRT template** import or validation
- No **country-risk flags** (conflict minerals, child labor)
- No **corrective action workflow** (supplier fails audit → what happens?)
- No **mine-to-smelter** chain of custody tracking

This is the **largest EU compliance gap**. Art. 48–52 requires a *management system*, not a PDF.

## B.2 Architecture

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

## B.3 Data Model

```sql
-- Supplier risk profiles (auto-computed + manual override)
CREATE TABLE supplier_risk_profiles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    overall_score       int NOT NULL DEFAULT 0, -- 0–100, lower is better
    country_risk_tier   int NOT NULL DEFAULT 1, -- 1=low, 4=extreme
    mineral_risk_flags  text[] NOT NULL DEFAULT '{}', -- ['cobalt', 'lithium']
    rmap_valid          boolean,
    last_audit_date     date,
    next_audit_due      date,
    computed_at         timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(supplier_id, tenant_id)
);

-- OECD Step tracking per supplier
CREATE TABLE due_diligence_assessments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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

## B.4 Implementation Tasks

### Week 1 — Foundation & Risk Scoring
- [ ] Migration 088: `supplier_risk_profiles` table
- [ ] Migration 089: `due_diligence_assessments` table
- [ ] Migration 090: `supplier_cmrt_reports` table
- [ ] Migration 091: `corrective_actions` table
- [ ] Seed data: `country_risk_tiers` (Basel AML + USGS conflict mineral data)
- [ ] Model structs: `SupplierRiskProfile`, `DueDiligenceAssessment`, `SupplierCMRTReport`, `CorrectiveAction`
- [ ] Repository layer: CRUD for all 4 tables
- [ ] Service: `SupplierRiskCalculator` — compute score from country + mineral + documents
- [ ] Handler: `GET /api/v1/suppliers/{id}/risk-profile`
- [ ] Update `RepositoryInterface` + mock repository + all fake repos

### Week 2 — OECD State Machine
- [ ] Service: `DueDiligenceAssessmentService` with 5-step transitions
- [ ] Rules: step N cannot start until step N-1 is `complete`
- [ ] Handler: `POST /api/v1/suppliers/{id}/dd-assessments` (create)
- [ ] Handler: `GET /api/v1/suppliers/{id}/dd-assessments` (list)
- [ ] Handler: `POST /api/v1/dd-assessments/{id}/transition` (advance step)
- [ ] Handler: `POST /api/v1/dd-assessments/{id}/attach-evidence`
- [ ] Auto-create assessment on supplier invite (Step 1: Policy)

### Week 3 — CMRT Excel Parser
- [ ] Add `github.com/xuri/excelize/v2` dependency
- [ ] Service: `CMRTImporter` — parse Standard CMRT v6.x Excel
- [ ] Extract: Smelter Name, Country, Mineral, SmelterRef, RMI status
- [ ] Handler: `POST /api/v1/suppliers/{id}/cmrt-upload` (multipart)
- [ ] Validate against static RMI conformant smelter list (seed JSON)
- [ ] Flag unknown smelters, compute RMI conformant %
- [ ] Store parsed result in `supplier_cmrt_reports`

### Week 4 — Corrective Action Workflow
- [ ] Service: `CorrectiveActionService`
- [ ] Auto-create CA when assessment step = `failed` or CMRT has unknown smelters
- [ ] Handler: `POST /api/v1/corrective-actions` (manual create)
- [ ] Handler: `GET /api/v1/corrective-actions` (tenant-scoped list)
- [ ] Handler: `PUT /api/v1/corrective-actions/{id}/status`
- [ ] Handler: `POST /api/v1/corrective-actions/{id}/attach-evidence`
- [ ] Due-date alert logic (deferred to daily alert ticker)

### Week 5 — Integration
- [ ] Extend EUValidator to check supplier risk profiles on batch compliance
- [ ] Add compliance rule: `supplier_risk_max_score`
- [ ] Update `due_diligence_pdf.go` to include:
  - Supplier risk score summary
  - OECD step completion status
  - CMRT smelter summary (conformant %)
  - Open corrective actions
- [ ] Update `BatchReadinessBar` to show DD readiness

### Week 6 — Frontend
- [ ] Supplier detail page: Risk card with score + country tier + mineral flags
- [ ] OECD Step wizard: 5-step visual progress with evidence upload
- [ ] CMRT upload dialog: drag-drop Excel → parsed smelter table
- [ ] Corrective Actions dashboard: table with status, severity, due date

## B.5 API Contract

```
GET  /api/v1/suppliers/{id}/risk-profile
POST /api/v1/suppliers/{id}/dd-assessments
GET  /api/v1/suppliers/{id}/dd-assessments
POST /api/v1/dd-assessments/{id}/transition
POST /api/v1/dd-assessments/{id}/attach-evidence
POST /api/v1/suppliers/{id}/cmrt-upload
GET  /api/v1/suppliers/{id}/cmrt-reports
GET  /api/v1/corrective-actions
POST /api/v1/corrective-actions
PUT  /api/v1/corrective-actions/{id}/status
```

## B.6 Deferred from Phase A (addressed here)
- [ ] Integration tests for async registry flow, retry, circuit breaker
- [ ] Admin "View Audit Log" UI
- [ ] BIS/EU NANDO scraper failure alerting

## B.7 Success Criteria
- [ ] `go test ./...` passes
- [ ] `go build ./...` passes
- [ ] Frontend `tsc --noEmit` has no new errors
- [ ] Supplier risk score computes automatically on supplier creation/update
- [ ] OECD assessment can be created and advanced through all 5 steps
- [ ] CMRT Excel upload parses smelters and flags unknowns
- [ ] Corrective action lifecycle works end-to-end
- [ ] Due diligence PDF includes risk summary section
