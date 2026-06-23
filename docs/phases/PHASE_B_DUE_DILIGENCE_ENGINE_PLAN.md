# Phase B — Due Diligence Engine
## Updated Plan (Reality-Aligned)

> **Status:** 🟡 ~95% COMPLETE | **Load tests + minor hardening remaining**
> 
> **Branch:** `feat/textile-foundation`
> **Hard deadline:** August 2027 (EU Battery Regulation Art. 48–52)

---

## 1. What Actually Exists (Verified in Codebase)

### 1.1 Database — 100% Implemented

| Migration | Table | Status |
|-----------|-------|--------|
| `000088_create_supplier_risk_profiles.up.sql` | `supplier_risk_profiles` | ✅ Full schema + indexes |
| `000089_create_due_diligence_assessments.up.sql` | `due_diligence_assessments` | ✅ Full schema + indexes |
| `000090_create_supplier_cmrt_reports.up.sql` | `supplier_cmrt_reports` | ✅ Full schema + indexes |
| `000091_create_corrective_actions.up.sql` | `corrective_actions` | ✅ Full schema + indexes |

### 1.2 Backend Services — ~95% Implemented

| Planned Service | Actual File | Status |
|-----------------|-------------|--------|
| `SupplierRiskCalculator` | `internal/compliance/supplier/risk_calculator.go` | ✅ 332 lines, computes 0–100 score |
| RMI smelter seed list | `internal/compliance/supplier/rmi_smelters.go` | ✅ 308 smelters |
| `CMRTImporter` | `internal/compliance/supplier/cmrt_importer.go` | ✅ Parses Excel, validates against RMI list + unit tests |
| `DueDiligenceAssessmentService` | Not standalone | ⚠️ Handlers use repository directly — functional |
| `CorrectiveActionService` | Not standalone | ⚠️ Handlers use repository directly — functional |

### 1.3 HTTP Handlers — ~95% Implemented

| Endpoint | Handler | Status |
|----------|---------|--------|
| `GET /api/v1/suppliers/{id}/risk-profile` | `GetSupplierRiskProfile` | ✅ |
| `POST /api/v1/suppliers/{id}/dd-assessments` | `CreateDueDiligenceAssessment` | ✅ |
| `GET /api/v1/suppliers/{id}/dd-assessments` | `ListDueDiligenceAssessments` | ✅ |
| `POST /api/v1/dd-assessments/{id}/transition` | `TransitionDueDiligenceAssessment` | ✅ |
| `POST /api/v1/dd-assessments/{id}/evidence` | `UploadEvidence` | ✅ |
| `POST /api/v1/suppliers/{id}/cmrt-upload` | `UploadCMRT` | ✅ NEW |
| `GET /api/v1/suppliers/{id}/cmrt-reports` | `ListCMRTReports` | ✅ NEW |
| `GET /api/v1/corrective-actions` | `ListCorrectiveActions` | ✅ |
| `POST /api/v1/corrective-actions` | `CreateCorrectiveAction` | ✅ |
| `PUT /api/v1/corrective-actions/{id}/status` | `UpdateCorrectiveActionStatus` | ✅ |

### 1.4 Frontend — ~95% Implemented

| Component | File | Status |
|-----------|------|--------|
| Supplier detail risk card | `components/settings/suppliers-tab.tsx` | ✅ |
| OECD step wizard | `components/due-diligence/oecd-wizard-dialog.tsx` | ✅ 331 lines |
| Corrective Actions dashboard | `components/due-diligence/corrective-actions-dashboard.tsx` | ✅ 305 lines |
| DD page | `app/dashboard/due-diligence/page.tsx` | ✅ |
| CMRT upload dialog | `components/due-diligence/cmrt-upload-dialog.tsx` | ✅ NEW |
| CMRT button on supplier card | `components/settings/suppliers-tab.tsx` | ✅ NEW |
| BatchReadinessBar DD check | `components/batches/detail/BatchReadinessBar.tsx` | ✅ NEW |

### 1.5 React Query Hooks — 100% Implemented

All hooks present including new CMRT hooks:
- `useSupplierRisk`, `useDueDiligenceAssessments`, `useCreateDDAssessment`, `useTransitionDDAssessment`, `useUploadEvidence`
- `useCorrectiveActions`, `useCreateCorrectiveAction`, `useUpdateCAStatus`
- `useSupplierCMRTReports`, `useUploadCMRT` ✅ NEW

### 1.6 PDF Generation — 100% Implemented

`internal/services/due_diligence_pdf.go` (578 lines) includes risk summary, supply chain, certifications.

### 1.7 BOM / Compliance Integration — 100% Implemented

`internal/compliance/battery/eu.go` already loads `SupplierRiskProfile`s during `ValidateBatch` and flags:
- OverallScore > 70 → ERROR
- OverallScore > 40 → WARNING
- RMAPValid == false → ERROR
- NextAuditDue < now → ERROR
- Missing profile → ERROR

### 1.8 Tests — Implemented

| Test | File | Status |
|------|------|--------|
| CMRT importer unit tests | `cmrt_importer_test.go` | ✅ 4 tests passing |
| Async registry integration tests | `handlers/integration_test.go` | ✅ 3 tests passing |
| Circuit breaker unit tests | `circuit_breaker_test.go` | ✅ 9 tests passing |
| Worker retry/backoff tests | `jobs/registry_worker_test.go` | ✅ 6 tests passing |

---

## 2. Remaining Work (Minor)

### 2.1 Load & Performance Tests
- [ ] k6 load test for CMRT upload endpoint (10 concurrent uploads)
- [ ] k6 load test for registry verify enqueue (p95 < 200ms)

### 2.2 Hardening (Optional)
- [ ] Admin "View Audit Log" UI (deferred)
- [ ] BIS/EU NANDO scraper failure alerting (deferred)
- [ ] Fuzzy matching for smelter names in CMRT parser (deferred)

---

## 3. Implementation Order (Completed)

1. ✅ CMRT Backend — importer service + handler + route
2. ✅ CMRT Frontend — upload dialog + hook + API integration
3. ✅ BOM Integration — EU validator already checks supplier risk
4. ✅ BatchReadinessBar — DD readiness check added
5. ✅ Tests — unit + integration coverage

---

## 4. API Contract (Updated)

```
GET  /api/v1/suppliers/{id}/risk-profile              ✅
POST /api/v1/suppliers/{id}/dd-assessments            ✅
GET  /api/v1/suppliers/{id}/dd-assessments            ✅
POST /api/v1/dd-assessments/{id}/transition           ✅
POST /api/v1/dd-assessments/{id}/attach-evidence      ✅
POST /api/v1/suppliers/{id}/cmrt-upload               ✅
GET  /api/v1/suppliers/{id}/cmrt-reports              ✅
GET  /api/v1/corrective-actions                       ✅
POST /api/v1/corrective-actions                       ✅
PUT  /api/v1/corrective-actions/{id}/status           ✅
```

---

## 5. Success Criteria

- [x] `go test ./...` passes
- [x] `go build ./...` passes
- [x] Frontend `tsc --noEmit` has no new errors in modified files
- [x] Supplier risk score computes automatically
- [x] OECD assessment can be created and advanced through all 5 steps
- [x] CMRT Excel upload parses smelters and flags unknowns
- [x] Corrective action lifecycle works end-to-end
- [x] Due diligence PDF includes risk summary section
- [x] Batch readiness bar shows DD readiness
- [x] EU validator checks supplier risk profiles on batch compliance

---

## 6. Deferred from Phase A (Addressed Here)

- [x] Integration tests for async registry flow, retry, circuit breaker
- [ ] Admin "View Audit Log" UI (deferred to admin dashboard)
- [ ] BIS/EU NANDO scraper failure alerting (deferred to observability)
