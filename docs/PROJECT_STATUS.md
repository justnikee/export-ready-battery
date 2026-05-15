# AnvayaLabs — Project Status & Roadmap

**Last Updated:** 2026-05-14  
**Purpose:** Single-source master document covering what we're building, who it's for, current state, and remaining work.

---

## What We're Building

AnvayaLabs is a dual-product SaaS platform that generates digital product passports with QR codes for regulatory compliance. Two product lines from one codebase:

| Product | Regulation | Key Requirement |
|---------|-----------|----------------|
| **Battery** | EU Battery Regulation 2023/1542 | Digital Battery Passport (Article 77) |
| **Battery** | India Battery Aadhaar / BIS / EPR | Unique ID (BPAN), IS 16046, PLI |
| **Textile** | EU ESPR (Ecodesign for Sustainable Products) | Digital Product Passport, REACH/SVHC |
| **Textile** | India Textile QCOs | Material disclosure, GOTS/GRS/OCS tracking |

**Core capabilities for both product lines:**
- UUID-based digital passports per product unit
- QR code labels with tiered public/partner/regulator views
- Full lifecycle tracking with magic link partner access
- Multi-market compliance validation (EU + India)
- Immutable audit trail with BLAKE2b hash chains
- ERP integration via API keys, team management, billing

---

## Who We're Building For

| User | Product | What They Do |
|------|---------|-------------|
| **Battery manufacturers** | Battery | Register batches, generate passport QR labels, track lifecycle (manufacturing→recycling), comply with BIS/EPR/PLI |
| **Textile mills & garment makers** | Textile | Register lots, track supply chain (fiber→fabric→garment→retail), manage GOTS/GRS/OEKO-TEX certifications, comply with ESPR DPP |
| **Logistics partners** | Both | Scan QR codes at handoff points (shipping, installation, retail receipt) |
| **Recyclers** | Both | Record end-of-life processing via magic links |
| **Regulators** | Both | Access full compliance data via Article 78 (battery) / ESPR (textile) endpoints |
| **Brands & retailers** | Textile | Verify supply chain traceability, fiber composition, chemical compliance |

---

## Architecture — How Separation Works

Battery and textile data never mix. Five layers of isolation:

```
Frontend:  /battery/*  (JWT product_type=BATTERY)   ≠   /textile/*  (JWT product_type=TEXTILE)
              │                                              │
API:       Registry.ValidateBatch(productType, market)  →  battery/eu.go   or  textile/eu.go
              │                                              │
Database:  tenants.product_type discriminator  +  separate profile tables
           battery_tenant_profiles (EPR/BIS/PLI)  ≠  textile_tenant_profiles (facility/fiber/certs)
           product_schemas per product_type  +  compliance routing per (type, market)
```

**Tech stack:** Go 1.24 backend (stdlib ServeMux) + Next.js 16 frontend (App Router) + PostgreSQL 16 + Tauri v2 desktop

---

## Phase Summary

### ✅ Phase 0 — Foundation (Complete)
Product separation architecture, config registry, tenant profiles, flat route cleanup, proxy routing.

### ✅ Phase 1 — Data Layer & Core Models (Complete — 2026-05-14)
Product_type filters on all list queries, textile lifecycle state machine, enhanced compliance validators.

### ⬜ Phase 2 — Core Textile Pages
Textile compliance page + textile lifecycle/supply-chain page.

### ⬜ Phase 3 — Polish & Charts
Dashboard charts (traceability activity, lot status), textile analytics page.

### ⬜ Phase 4 — Regulatory Deepening
ESPR Annex IV textile fields, French AGEC, OCS certification, fiber composition breakdown.

### ⬜ Phase 5 — Cross-Cutting
Test mock fixes, frontend test coverage, deployment hardening.

---

## Detailed Phase Status

### ✅ Phase 0 — Foundation

| Task | Status | Notes |
|------|--------|-------|
| Product config registry (`products.ts`) | ✅ Done | Central config for routing, labels, icons, actions |
| Dynamic `[product]/` routing | ✅ Done | All dashboard subpages switch on product type |
| Flat route cleanup (auth, dashboard dirs) | ✅ Done | Proxy handles login/register/onboarding routing |
| Tenant profile structs (Battery + Textile) | ✅ Done | `BatteryTenantProfile`, `TextileTenantProfile`, `EnsureXProfile()` helpers |
| scanTenant populates profiles directly | ✅ Done | No more flat-field copy, direct DB scan |
| Product switches on all dashboard pages | ✅ Done | Textile pages show UnderDevelopment for battery-only features |
| Compliance nil-safety | ✅ Done | `EnsureBatteryProfile()` calls in validators |
| Backend `go test ./internal/...` passes | ✅ Done | Fixed pre-existing TestDeriveManufacturerCode |
| Frontend `next build` passes | ✅ Done |

### ✅ Phase 1 — Data Layer & Core Models (Completed 2026-05-14)

| Task | Status | Notes |
|------|--------|-------|
| `product_type` filter on `ListBatches` | ✅ Done | SQL: `AND ($4 = '' OR product_type = $4)` |
| `product_type` filter on `GetDashboardStats` | ✅ Done | All 4 dashboard queries filtered |
| `product_type` filter on `ListPassportsByTenant` | ✅ Done | Both count + data queries filtered |
| Handler call sites updated | ✅ Done | Dashboard, bulk_handlers, batch_handlers, EPR handlers |
| Repository interface updated | ✅ Done | `interface.go`, `lifecycle.go` |
| Mock repository signatures updated | ✅ Done | Build passes, m.Called() calls updated |
| Textile lifecycle state machine | ✅ Done | 6 states, 5 actions, transition map, role assignments in `models.go` |
| Textile compliance EU validator enhanced | ✅ Done | 7→13 checkpoints (recycled content, facility type, supply chain tier, lot size, fiber types, chemical substances) |
| Textile compliance India validator enhanced | ✅ Done | 4→8 checkpoints (recycled content, facility type, hazardous substances, certification evidence) |
| `PROJECT_FULL_DOCUMENTATION.md` updated | ✅ Done | 3 new sections (§25-27) + 10 textile gaps in §24 |
| `REMAINING_TASKS.md` updated | ✅ Done | Today's progress documented |

| Task | Status | Notes |
|------|--------|-------|
| Fix test mock expectations | ⚠️ Pending | 8+ test files: `.On("ListBatches", ...)` and `.On("ListPassportsByTenant", ...)` have old signatures missing `productType` param |

### ⬜ Phase 2 — Core Textile Pages

| Task | Priority | Depends On | Notes |
|------|----------|-----------|-------|
| **Textile Compliance page** | HIGH | Phase 1 | Cert upload (GOTS/OCS/GRS/OEKO-TEX), DPP readiness checklist, ESPR tracking, compliance scores. Currently a 151-line stub. |
| **Textile Lifecycle page** | HIGH | Phase 1 | Lot tracking table, stage transitions, magic links for mills/dye houses/recyclers, supply chain map. Currently a 131-line stub. |
| Textile Team page | LOW | Phase 1 | Connect to shared team CRUD (currently 58-line static stub) |

### ⬜ Phase 3 — Polish & Charts

| Task | Priority | Depends On | Notes |
|------|----------|-----------|-------|
| Dashboard traceability chart | MEDIUM | Phase 1 | Lot creation over time line chart |
| Dashboard lot status pie | MEDIUM | Phase 1 | Distribution by production stage |
| Dashboard compliance score card | MEDIUM | Phase 1 | Per-tenant compliance score |
| Analytics page | LOW | Phase 2 | Supply chain origin map, fiber distribution, lot activity timeline |
| Batch/lot detail page | LOW | Phase 1 | Textile-specific lot detail view |

### ⬜ Phase 4 — Regulatory Deepening

| Task | Priority | Depends On |
|------|----------|-----------|
| ESPR Annex IV textile DPP fields | MEDIUM | Phase 1 |
| French AGEC environmental labelling | LOW | Phase 1 |
| OCS certification option | LOW | None |
| Fiber composition breakdown (per-fiber %) | LOW | Phase 1 |
| Microplastic disclosure tracking | LOW | Phase 4 |
| Recyclability scoring | LOW | Phase 4 |

### ⬜ Phase 5 — Cross-Cutting

| Task | Priority | Depends On |
|------|----------|-----------|
| Fix test mock expectations | MEDIUM | Phase 1 |
| Frontend test suite (Vitest + React Testing Library) | MEDIUM | None |
| Deployment hardening (Docker, CI/CD) | LOW | None |
| API versioning strategy | LOW | None |
| Multi-language support (EN, DE, FR) | LOW | None |

---

## QR Code System — Textile Parity Needed

**What works:** QR generates URLs pointing to `/p/{uuid}` for any passport. Public view renders correctly per `template_variant` (TEXTILE_STANDARD shows material profile, certifications, supply chain tier). Label PDFs produce textile-specific layouts.

**What's battery-only:** `BuildQRPayload()` enriches QR URLs with BPAN chemistry codes, carbon per kWh, EPR number. Textile serials get bare `/p/{uuid}` URLs.

**Changes needed for parity:**
1. Extend `QRLabelContext` with textile fields (Certifications, FacilityType, SupplyChainTier, MaterialProfile)
2. Branch enrichment in `drawLabel()` — use `tenant.TextileProfile` when `batch.ProductType == TEXTILE`
3. Update `BuildQRPayload()` to serialize textile fields into URL params

---

## Current Component Inventory

### ✅ Functional (Textile)

| Component | Lines | Purpose |
|-----------|-------|---------|
| Dashboard | 411 | Stats, quick actions, recent lots, quota |
| Batches/Lots | 281 | CRUD list, create lot dialog |
| Templates | 556 | CRUD grid, readiness sidebar |
| Settings | 564 | Profile, Data Sharing, Access Tokens |
| Onboarding | 755 | 4-step: Organization→Supply Chain→Readiness→Launch |
| Create Lot Dialog | 294 | Material profile, lot size, production stage |
| Create Template | 235 | Template form |
| Profile Lib | 100 | Types, options, helpers |

### ⚠️ Stubs (Textile)

| Component | Lines | What's Missing |
|-----------|-------|---------------|
| Lifecycle | 131 | API calls, stage transitions, magic links, supply chain map |
| Compliance | 151 | Cert upload, DPP/ESPR checklists, compliance scores |
| Team | 58 | CRUD endpoint connection |

### 🔲 Placeholders (Textile)

`/textile/dashboard/{analytics, billing, developer, dispatch, exports, partners, rewards}` — all show UnderDevelopment component.

---

## Regulatory Coverage

### EU Regulations

| Regulation | Status |
|------------|--------|
| **ESPR** (EU 2024/1781) | Partial — 7+6 validation checkpoints, Annex IV not yet modeled |
| **EU DPP for Textiles** | Partial — QR and passport view work, DPP-specific data model missing |
| **REACH Annex XVII** | Partial — SVHC declaration + chemical substance list checks, no per-substance limits |
| **EU Textile Labelling** (1007/2011) | Not implemented — no fiber composition % breakdown |
| **French AGEC** | Not implemented |

### India Regulations

| Regulation | Status |
|------------|--------|
| **Textile QCOs** | Partial — 8 validation checkpoints |
| **GOTS / GRS / OEKO-TEX / BSCI** | Implemented — certification options in settings and batch creation |
| **OCS** (Organic Content Standard) | Not yet added |

### Certifications Supported

| Certification | Status |
|--------------|--------|
| GOTS | ✅ |
| GRS | ✅ |
| OEKO-TEX | ✅ |
| BSCI | ✅ |
| OCS | ❌ |

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/PROJECT_FULL_DOCUMENTATION.md` | Complete platform documentation (27 sections) |
| `docs/PROJECT_STATUS.md` | This file — master status and roadmap |
| `DUAL_PRODUCT_ROLLOUT_PLAN.md` | Original dual-product rollout plan |
| `REMAINING_TASKS.md` | Task tracking with recently completed items |
| `AGENTS.md` | Agent guide — build commands, architecture, patterns |
| `frontend/lib/products.ts` | Central product config registry |
| `backend/internal/models/models.go` | Lifecycle state machines (battery + textile) |
| `backend/internal/compliance/textile/` | Textile compliance validators (EU + India) |

---

## Next Steps

1. **Fix test mock expectations** — Update `.On()` calls in 8+ test files (`integration_test.go`, `lifecycle_handlers_test.go`, `magic_link_handlers_test.go`, `lifecycle_*_test.go`) for `ListBatches` and `ListPassportsByTenant`
2. **Textile Compliance page** — Full build from current 151-line stub
3. **Textile Lifecycle page** — Full build from current 131-line stub
4. **QR textile enrichment** — Extend `QRLabelContext`, branch in `drawLabel()`, update `BuildQRPayload()`
5. **Textile dashboard charts** — Traceability activity + lot status pie
