# AnvayaLabs DPP — Full Implementation Execution Plan

> **Version:** 1.0  
> **Date:** 2026-05-14  
> **Based on:** `PROJECT_FULL_DOCUMENTATION.md` audit  
> **Goal:** Transform the audit into an actionable, sequenced execution plan with exact file paths, dependencies, and effort estimates.

---

## Execution Philosophy

1. **Fix leaks before building walls.** Data leakage bugs (hardcoded `product_type`, missing filters) must be fixed first or textile work will corrupt battery data.
2. **Backend before frontend.** Validators, schemas, and serial formats must exist before UI can use them.
3. **Horizontal slices over vertical silos.** Complete one flow end-to-end (e.g., "textile lot creation → activation → public passport") rather than building all validators in isolation.
4. **Tests with every PR.** Every change must include or update tests. No exceptions.

---

## Phase 0: Stop the Bleeding (Week 1)

**Goal:** Fix data leakage and hardcoded battery assumptions that affect production today.

| # | Task | File(s) | Effort | Risk | Test Impact |
|---|------|---------|--------|------|-------------|
| 0.1 | **Fix `create-batch-dialog.tsx` hardcoded `product_type`** | `frontend/components/batches/create-batch-dialog.tsx:584` | 30 min | Low | Update component test |
| 0.2 | **Add `product_type` filter to `useBatches`** | `frontend/hooks/use-queries.ts:22` | 1 hr | Low | New hook test |
| 0.3 | **Fix `useTemplates` to filter by `product_type`** | `frontend/hooks/use-queries.ts` (similar pattern) | 30 min | Low | New hook test |
| 0.4 | **Fix public passport default to `"BATTERY"`** | `frontend/app/p/[uuid]/page.tsx:92` | 30 min | Low | Update page test |
| 0.5 | **Fix `DashboardSidebar` product labeling** | `frontend/components/dashboard/DashboardSidebar.tsx:44-88` | 2 hrs | Medium | New component test |
| 0.6 | **Add `product_type` guard to India batch creation** | `backend/internal/handlers/batch_handlers.go:110-221` | 2 hrs | Medium | Update handler test |
| 0.7 | **Add `product_type` guard to `AutoGeneratePassports`** | `backend/internal/handlers/upload_handlers.go:274-441` | 1 hr | Medium | Update handler test |
| 0.8 | **Fix `passport-view.tsx` battery bias** | `frontend/components/passport/passport-view.tsx` | 3 hrs | Medium | New component test |
| 0.9 | **Fix `battery-onboarding-page.tsx` hardcoded `/batches` link** | `frontend/components/onboarding/battery-onboarding-page.tsx:697` | 15 min | Low | Manual check |

**Deliverable:** A PR titled `fix: eliminate battery-only hardcodes and data leakage` with all above fixes + tests.

**Dependencies:** None. Can start immediately.

---

## Phase 1: Textile Foundation (Weeks 2–5)

**Goal:** Textile users can create a lot, activate it, and view a public passport without errors.

### 1.1 Backend — Serials & Schema

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 1.1 | **Design textile serial format** | New: `docs/TEXTILE_SERIAL_FORMAT.md` | 2 hrs | Propose `TE-YYYY-NNNN` or India-specific traceability code. Get sign-off. |
| 1.2 | **Add textile serial config** | `backend/internal/serial/configs.go:35-63` | 1 hr | Register `{TEXTILE, India/EU/Global}` formats. |
| 1.3 | **Remove battery-only guard from `BPANGenerator.Generate`** | `backend/internal/serial/generator.go:62-65` | 30 min | Delegate to format registry instead of hardcoded battery check. |
| 1.4 | **Expand `textile_v1.json` schema** | `backend/internal/schema/seeds/textile_v1.json` | 4 hrs | Add: `fiber_composition`, `gsm`, `dye_process`, `water_usage_liters`, `energy_usage_kwh`, `supplier_tier`, `labor_compliance`, `chemical_compliance_zdhc`. |
| 1.5 | **Add `DisplayConfig` for textile schema** | `backend/internal/schema/seeds/seeds.go:80-93` | 2 hrs | Field-level access control (PUBLIC / PARTNER / OWNER). |
| 1.6 | **Add `TEXTILE_INDIA` passport template variant** | `backend/internal/models/types.go:32-48`, `frontend/lib/passport-template-config.ts` | 2 hrs | India-specific textile view with facility info, fiber composition, QCO badges. |
| 1.7 | **Add structured textile fields to `BatchSpec`** | `backend/internal/models/models.go:255-294` | 2 hrs | Add typed fields to `BatchSpec` struct (not just JSONB). |

### 1.2 Backend — Data Model Cleanup

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 1.8 | **Move battery-specific `Batch` columns to `specs` JSONB** | `backend/internal/models/models.go:229-252`, migration `000XXX_batch_product_agnostic.up.sql` | 6 hrs | Move: `CellSource`, `BillOfEntryNo`, `CountryOfOrigin`, `CustomsDate`, `HSNCode`, `BISNumber`, `EPRNumber`, `DVASource`, `AuditedDomesticValueAdd`, `PLICertificateURL` into `specs`. This is schema debt elimination. |
| 1.9 | **Update repository layer for moved fields** | `backend/internal/repository/batch.go`, `repository/tenant.go` | 4 hrs | Update SQL queries to read from `specs` instead of columns. |
| 1.10 | **Update activation compliance for new spec paths** | `backend/internal/services/activation_compliance.go` | 2 hrs | Read `specs.cell_source` instead of `batch.CellSource`. |
| 1.11 | **Update compliance validators for new spec paths** | `backend/internal/compliance/battery/india.go`, `battery/eu.go` | 3 hrs | Same pattern. |

### 1.3 Frontend — Lot Creation & Core Pages

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 1.12 | **Build expanded textile lot creation dialog** | `frontend/components/textile/create-textile-lot-dialog.tsx` | 16 hrs | Market region (India/EU/Global), fiber composition, GSM, dye process, water/energy, supplier tier, certifications (GOTS/GRS/OEKO-TEX/BSCI), template save. Target ~800 lines. |
| 1.13 | **Build `TextileCompliancePage`** | `frontend/components/textile/textile-compliance-page.tsx` | 8 hrs | Certificate upload UI, compliance scoring display, India QCO/EU ESPR status cards. |
| 1.14 | **Build `TextileLifecyclePage`** | `frontend/components/textile/textile-lifecycle-page.tsx` | 6 hrs | Lot tracking, production stage transitions, quality test log. |
| 1.15 | **Add textile-specific dashboard widgets** | `frontend/components/dashboard/textile-dashboard-page.tsx` | 4 hrs | Recent lots, compliance status, quick actions. |
| 1.16 | **Fix `batch-details-page.tsx` for textile** | `frontend/components/batches/batch-details-page.tsx` | 4 hrs | Conditional rendering: show battery fields for battery, textile fields for textile. |

**Deliverable:** PRs grouped by backend (`feat: textile serials, schema, and data model`) and frontend (`feat: textile lot creation and dashboard pages`).

**Dependencies:** Phase 0 must merge first. 1.8 (Batch column migration) is the riskiest — needs careful migration testing.

---

## Phase 2: Textile Compliance Engine (Weeks 6–11)

**Goal:** Real regulatory validation for textile India and EU markets.

### 2.1 India Textile Compliance

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 2.1 | **Research India textile regulations** | New: `docs/INDIA_TEXTILE_COMPLIANCE.md` | 4 hrs | QCO (Quality Control Order), BIS textile standards (IS 17243, IS 16322), facility audit requirements, fiber labeling rules, ZDHC India guidelines. |
| 2.2 | **Implement India textile validator** | `backend/internal/compliance/textile/india.go` | 8 hrs | Tenant: facility registration, BIS textile cert. Batch: fiber composition %, GSM, dye process, chemical compliance (ZDHC MRSL), labor compliance (SA8000/BSCI). Water/energy disclosure. |
| 2.3 | **Add India textile certificate upload** | `backend/internal/repository/tenant.go:334-411` | 4 hrs | Extend `UpdateCertificatePath` to handle textile tenant profiles. |
| 2.4 | **Add India textile activation fields** | `backend/internal/services/activation_compliance.go:74-81` | 2 hrs | Require `fiber_composition`, `manufacturer`, `country_of_origin`, `production_stage` for textile. |

### 2.2 EU ESPR Compliance

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 2.5 | **Research EU ESPR requirements** | New: `docs/EU_ESPR_COMPLIANCE.md` | 4 hrs | Durability, recyclability, microplastic compliance, repairability index, fiber origin traceability, PEF (Product Environmental Footprint), DPP disclosure requirements. |
| 2.6 | **Implement EU ESPR validator** | `backend/internal/compliance/textile/eu.go` | 10 hrs | Tenant: EU AR (if non-EU manufacturer). Batch: durability metrics, recyclability score, microplastic compliance (synthetic fiber shedding), repairability index, fiber origin traceability, REACH/SVHC declaration. |
| 2.7 | **Add EU ESPR attribute scoring** | `backend/internal/services/compliance_score.go` or new `textile_compliance_score.go` | 6 hrs | Similar to battery's 56-attribute EU score, but for ESPR. |
| 2.8 | **Wire textile GLOBAL aggregation** | `backend/internal/compliance/registry.go` (already works) | 1 hr | Verify India + EU textile validators aggregate correctly. |

### 2.3 Carbon & Traceability

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 2.9 | **Design textile carbon methodology** | New: `docs/TEXTILE_CARBON_METHODOLOGY.md` | 4 hrs | Fiber production (cotton, polyester, wool, viscose), spinning, weaving/knitting, dyeing/finishing, cut-make-trim, transport. |
| 2.10 | **Create `textile_carbon_factors` table** | Migration `000XXX_textile_carbon_factors.up.sql` | 3 hrs | Per-fiber, per-process, per-region factors. |
| 2.11 | **Build textile carbon calculator service** | `backend/internal/services/textile_carbon_service.go` | 8 hrs | Calculate footprint from lot specs. |
| 2.12 | **Build textile carbon calculator UI** | `frontend/components/textile/carbon-calculator.tsx` | 6 hrs | Input fiber types, quantities, processes; display result. |
| 2.13 | **Add supply chain provenance tracking** | `backend/internal/models/models.go:BatchSpec.SupplyChainProvenance` | 4 hrs | Extend for textile tiers (fiber supplier → mill → dye house → CMT → brand). |

**Deliverable:** Backend PR (`feat: textile India and EU compliance validators`) + Frontend PR (`feat: textile carbon calculator and compliance scoring`).

**Dependencies:** Phase 1 must merge. 2.1 and 2.5 (regulatory research) can happen in parallel with Phase 1.

---

## Phase 3: Textile Lifecycle & Advanced Features (Weeks 12–15)

**Goal:** Full textile lifecycle tracking and remaining dashboard pages.

### 3.1 Lifecycle Engine

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 3.1 | **Wire textile lifecycle states to `TransitionMap`** | `backend/internal/models/models.go:605-630` | 4 hrs | Add transitions: `RAW_MATERIAL → IN_PRODUCTION → FINISHED → SHIPPED → IN_USE → RECYCLED`. |
| 3.2 | **Add textile evidence requirements** | `backend/internal/models/evidence.go:40-46` | 3 hrs | `FINISHED` → quality test report, composition cert. `SHIPPED` → shipping manifest. `IN_USE` → care instructions. `RECYCLED` → fiber recovery certificate. |
| 3.3 | **Add textile-specific lifecycle actions** | `backend/internal/handlers/lifecycle_handlers.go` | 4 hrs | `MARK_FINISHED`, `MARK_SHIPPED`, `LOG_REPAIR`, `MARK_RECYCLED`. |
| 3.4 | **Add textile quality metric history** | Migration `000XXX_textile_quality_history.up.sql` | 3 hrs | Colorfastness, shrinkage, pilling, seam strength. |
| 3.5 | **Add textile supply chain roles** | `backend/internal/models/models.go` (roles enum), `trusted_domains` table | 3 hrs | `MILL`, `DYE_HOUSE`, `CUT_SEW`, `BRAND`, `RETAILER`, `RECYCLER`. |

### 3.2 Remaining Dashboard Pages

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 3.6 | **Analytics page** | `frontend/app/[product]/dashboard/analytics/page.tsx` + `components/analytics/textile-analytics-page.tsx` | 8 hrs | Production trends, compliance scoring over time, fiber usage breakdown. |
| 3.7 | **Billing page** | `frontend/app/[product]/dashboard/billing/page.tsx` + `components/billing/textile-billing-page.tsx` | 4 hrs | Quota purchase, invoice history. Mostly shared logic. |
| 3.8 | **Dispatch page** | `frontend/app/[product]/dashboard/dispatch/page.tsx` + `components/dispatch/textile-dispatch-page.tsx` | 6 hrs | Shipping manifest generation, partner dispatch tracking. |
| 3.9 | **Exports page** | `frontend/app/[product]/dashboard/exports/page.tsx` + `components/exports/textile-exports-page.tsx` | 4 hrs | CSV/PDF export of lot data, compliance declarations. |
| 3.10 | **Partners page** | `frontend/app/[product]/dashboard/partners/page.tsx` + `components/partners/textile-partners-page.tsx` | 6 hrs | Mill/brand/recycler partner management. |
| 3.11 | **Rewards page** | `frontend/app/[product]/dashboard/rewards/page.tsx` + `components/rewards/textile-rewards-page.tsx` | 4 hrs | Sustainability score rewards, partner incentives. |
| 3.12 | **Developer / API Keys page** | `frontend/app/[product]/dashboard/developer/page.tsx` | 2 hrs | Mostly shared with battery. |

**Deliverable:** Backend PR (`feat: textile lifecycle engine and supply chain roles`) + Frontend PR (`feat: textile dashboard advanced pages`).

**Dependencies:** Phase 2 must merge.

---

## Phase 4: Quality & Documentation (Weeks 16–17)

**Goal:** Tests, documentation, and manual validation.

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 4.1 | **Write manual test plan: textile onboarding** | `testing/09-textile-onboarding.md` | 4 hrs |
| 4.2 | **Write manual test plan: textile lot creation** | `testing/10-textile-lot-creation.md` | 4 hrs |
| 4.3 | **Write manual test plan: textile compliance & activation** | `testing/11-textile-compliance-activation.md` | 4 hrs |
| 4.4 | **Write manual test plan: textile lifecycle & public passport** | `testing/12-textile-lifecycle-passport.md` | 4 hrs |
| 4.5 | **Write user-facing textile onboarding guide** | `docs/TEXTILE_ONBOARDING_GUIDE.md` | 4 hrs |
| 4.6 | **Write user-facing textile compliance guide** | `docs/TEXTILE_COMPLIANCE_GUIDE.md` | 4 hrs |
| 4.7 | **Add Playwright E2E: battery critical flow** | `frontend/e2e/battery-critical-flow.spec.ts` | 8 hrs |
| 4.8 | **Add Playwright E2E: textile critical flow** | `frontend/e2e/textile-critical-flow.spec.ts` | 8 hrs |
| 4.9 | **Update `DEVELOPER_ONBOARDING.md`** | `docs/DEVELOPER_ONBOARDING.md` | 2 hrs |
| 4.10 | **Update `DEMO_READINESS_AUDIT.md`** | `docs/DEMO_READINESS_AUDIT.md` | 2 hrs |

**Deliverable:** Documentation PR (`docs: textile testing plans and user guides`) + E2E PR (`test: Playwright critical flows`).

---

## Phase 5: Battery Hardening (Parallel Track, Weeks 6–12)

**Goal:** Address remaining battery gaps while textile work continues. This track runs in parallel with Phases 2–3.

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 5.1 | **EPR certificate upload + validation** | `backend/internal/repository/tenant.go`, `frontend/components/settings/battery-compliance-page.tsx` | 6 hrs | Upload PDF, store path, validate format. |
| 5.2 | **BIS certificate upload + validation** | Same files | 6 hrs | Same pattern. |
| 5.3 | **Performance & durability validation (Annex IV)** | `backend/internal/compliance/battery/eu.go` | 4 hrs | Validate `expected_lifetime_cycles` and `warranty_months` against battery category minimums. |
| 5.4 | **Advanced carbon calculator** | `backend/internal/services/carbon_service.go`, `frontend/components/batches/carbon-calculator.tsx` | 8 hrs | Grid mix selection, transport mode, cell format (cylindrical/prismatic/pouch). |
| 5.5 | **Removability & replaceability tracking** | `backend/internal/models/models.go:BatchSpec`, migration | 4 hrs | Add `removable_and_replaceable` boolean, `separate_collection` boolean. |
| 5.6 | **Battery passport EU consortium format export** | `backend/internal/services/pdf_service.go` | 8 hrs | JSON export matching EU Battery Passport consortium standard. |
| 5.7 | **CBAM integration research** | New: `docs/CBAM_INTEGRATION_RESEARCH.md` | 4 hrs | Carbon Border Adjustment Mechanism for EU export. |

**Deliverable:** PRs as each feature completes. No single mega-PR.

---

## Dependency Graph

```
Phase 0 (Stop the Bleeding)
    │
    ├─→ Phase 1 (Textile Foundation)
    │       │
    │       ├─→ Phase 2 (Textile Compliance)
    │       │       │
    │       │       ├─→ Phase 3 (Textile Lifecycle & Advanced)
    │       │       │       │
    │       │       │       └─→ Phase 4 (Quality & Documentation)
    │       │       │
    │       └─→ Phase 5 (Battery Hardening) ──→ (parallel, no hard deps)
    │
    └─→ Phase 5 can also start from Phase 0 directly
```

---

## Resource Estimates

### Total Effort

| Phase | Backend (hrs) | Frontend (hrs) | QA/Docs (hrs) | Total (hrs) | Weeks (2 devs) |
|-------|:-------------:|:--------------:|:-------------:|:-----------:|:--------------:|
| Phase 0 | 8 | 10 | 2 | 20 | 1 |
| Phase 1 | 34 | 42 | 4 | 80 | 3–4 |
| Phase 2 | 51 | 12 | 8 | 71 | 4–5 |
| Phase 3 | 21 | 40 | 4 | 65 | 3–4 |
| Phase 4 | 0 | 16 | 40 | 56 | 2–3 |
| Phase 5 | 36 | 8 | 4 | 48 | 3–4 (parallel) |
| **TOTAL** | **150** | **128** | **62** | **340** | **16–20** |

### Team Composition Recommendation

| Role | Responsibility | Phase Focus |
|------|----------------|-------------|
| **Backend Engineer** | Go, PostgreSQL, compliance logic | Phases 0, 1, 2, 3, 5 |
| **Frontend Engineer** | Next.js 16, React 19, Tailwind v4 | Phases 0, 1, 3, 4 |
| **Compliance Analyst** | India/EU regulation research, validator rules | Phases 2.1, 2.5 (can be external consultant) |
| **QA Engineer** | Manual testing, Playwright E2E, documentation | Phases 4, plus regression testing each PR |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Phase 1.8 (Batch column migration) corrupts production data** | Medium | High | Write migration with `UPDATE` to move column data into `specs` JSONB. Run on staging first. Backup before deploy. |
| **Textile regulatory research is incomplete** | Medium | High | Engage external India textile compliance consultant (BIS/QCO expert) and EU ESPR advisor. |
| **React 19 + new testing libraries cause instability** | Low | Medium | Pin exact versions. Run full `npm run build` + `npm run test` on every frontend PR. |
| **Scope creep: adding 3rd product during textile work** | Medium | Medium | Explicitly defer `ELECTRONICS` or other products until Phase 4. Gate new product requests. |
| **Performance: 2,300-line components are hard to test** | High | Low | Accept that component tests for mega-components are expensive. Prioritize extracting pure functions into `lib/` and testing those. |

---

## Definition of Done (Per Phase)

### Phase 0
- [ ] All hardcoded `product_type: "BATTERY"` removed from frontend
- [ ] `useBatches` and `useTemplates` filter by `product_type`
- [ ] `DashboardSidebar` shows "Lots" for textile, "Batches" for battery
- [ ] India batch creation only enforces battery PLI/DVA/HSN for battery products
- [ ] All changes have passing tests (`go test ./...`, `npm run test`, `npm run build`)

### Phase 1
- [ ] Textile serial auto-generation works end-to-end
- [ ] `textile_v1.json` schema has ≥10 structured fields with `DisplayConfig`
- [ ] Textile lot creation dialog has market region, fiber composition, GSM, dye process, certifications
- [ ] Textile dashboard shows recent lots and compliance status
- [ ] Public passport page renders textile-specific view (`TEXTILE_INDIA` or `TEXTILE_STANDARD`)
- [ ] `Batch` table has no battery-specific columns (all in `specs` JSONB)

### Phase 2
- [ ] India textile validator checks ≥8 hard rules (facility, BIS, fiber composition, chemical, labor)
- [ ] EU ESPR validator checks ≥8 hard rules (durability, recyclability, microplastics, repairability, REACH)
- [ ] Textile carbon calculator produces realistic kg CO2e per garment
- [ ] Textile GLOBAL batch aggregates India + EU scores
- [ ] Activation gate requires textile-specific fields for textile products

### Phase 3
- [ ] Textile lifecycle states are fully wired (`RAW_MATERIAL` → `RECYCLED`)
- [ ] All 8 `UnderDevelopment` dashboard pages have real textile implementations
- [ ] Textile supply chain roles (MILL, DYE_HOUSE, CUT_SEW, BRAND) work in partner management
- [ ] Quality metric history tracks colorfastness, shrinkage, pilling

### Phase 4
- [ ] 4 manual test plans for textile exist and pass
- [ ] 2 Playwright E2E tests pass (battery + textile critical flows)
- [ ] User-facing textile onboarding and compliance guides published
- [ ] All docs updated to reflect dual-product support

### Phase 5
- [ ] EPR/BIS certificate upload works for battery tenants
- [ ] EU Annex IV durability minimums validated per battery category
- [ ] Advanced carbon calculator supports grid mix and transport mode
- [ ] EU Battery Passport consortium JSON export available

---

## Appendix: Quick-Reference File Index

### Backend Files to Touch (in order)
1. `backend/internal/models/models.go` — structs, lifecycle states
2. `backend/internal/models/types.go` — template variants, product types
3. `backend/internal/models/evidence.go` — evidence requirements
4. `backend/internal/compliance/textile/india.go` — India validator
5. `backend/internal/compliance/textile/eu.go` — EU validator
6. `backend/internal/services/activation_compliance.go` — activation gate
7. `backend/internal/services/lifecycle.go` — state machine
8. `backend/internal/serial/configs.go` — serial formats
9. `backend/internal/serial/generator.go` — serial generation
10. `backend/internal/schema/seeds/textile_v1.json` — textile schema
11. `backend/internal/schema/seeds/seeds.go` — schema registration
12. `backend/internal/handlers/batch_handlers.go` — batch CRUD
13. `backend/internal/handlers/upload_handlers.go` — auto-generate
14. `backend/internal/repository/tenant.go` — profile persistence
15. `backend/internal/repository/batch.go` — batch queries

### Frontend Files to Touch (in order)
1. `frontend/components/batches/create-batch-dialog.tsx` — fix hardcode
2. `frontend/hooks/use-queries.ts` — add product filter
3. `frontend/components/dashboard/DashboardSidebar.tsx` — product labels
4. `frontend/app/p/[uuid]/page.tsx` — remove battery default
5. `frontend/components/passport/passport-view.tsx` — textile branching
6. `frontend/components/textile/create-textile-lot-dialog.tsx` — expand
7. `frontend/components/textile/textile-compliance-page.tsx` — build
8. `frontend/components/textile/textile-lifecycle-page.tsx` — build
9. `frontend/components/dashboard/textile-dashboard-page.tsx` — enhance
10. `frontend/lib/passport-template-config.ts` — add TEXTILE_INDIA

---

*This plan should be treated as a living document. Update task statuses, actual hours, and blockers weekly.*
