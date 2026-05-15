# Remaining Tasks — Dual Product Rollout

**Generated:** 2026-05-14  
**Plan reference:** `DUAL_PRODUCT_ROLLOUT_PLAN.md`

## Today's Progress (2026-05-14)

- ✅ **PROJECT_FULL_DOCUMENTATION.md** — Added 3 new sections: Dual-Product Architecture (§25), Textile Regulatory Landscape (§26), Textile Dashboard Blueprint (§27)
- ✅ **Product isolation — data layer** — Added `product_type` filters to `ListBatches`, `GetDashboardStats`, `ListPassportsByTenant` (repository + interface + mock signatures updated)
- ✅ **Textile lifecycle state machine** — Added textile status constants, action constants, `TextileTransitionMap`, `TextileAllowedRolesByAction`, `TextileTransitionActionOrder` in `models.go`
- ✅ **Textile compliance checkpoints** — EU validator: 7→13 checks (recycled content, facility type, supply chain tier, lot size, fiber types, chemical substances); India validator: 4→8 checks
- ⚠️ **Test mock expectations** — `ListBatches` and `ListPassportsByTenant` mock expectations in test files still use old signatures (8+ test files affected). Need follow-up pass.

## Recently Completed

- ✅ Frontend flat route cleanup: deleted `(auth)/`, `(dashboard)/`, `accept-invite/`, `onboarding/` dirs
- ✅ Proxy: added `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/accept-invite` to `flatProtectedPrefixes`
- ✅ `PublicHeader`: login link changed from `/battery/login` to `/login` (proxy handles routing)
- ✅ Tenant DTO normalization: `BatteryTenantProfile` + `TextileTenantProfile` Go structs, profile pointer fields on `Tenant`, `EnsureXProfile()` helpers, 22 consumers migrated to profile access
- ✅ scanTenant: scans directly into `bp`/`tp` profiles, no longer populates flat Tenant fields
- ✅ Full `go test ./internal/...` passes (pre-existing `TestDeriveManufacturerCode` bug fixed)
- ✅ `[product]/dashboard/page.tsx` switches between `BatteryDashboardPage` / `TextileDashboardPage`
- ✅ All dashboard subpages have product switches (battery-specific pages show textile "under development" placeholder)
- ✅ Textile team page component + product switch
- ✅ Compliance validators: nil-safety with `EnsureBatteryProfile()` call
- ✅ Frontend Next.js build passes cleanly

---

## High Priority

### 1. Tenant struct final cleanup

- ✅ Update `scanTenant` in repository to scan directly into `bp`/`tp` instead of flat fields + copy
- ✅ Remove copy-back logic in `EnsureBatteryProfile`/`EnsureTextileProfile` (kept as safety net for tests)
- Remove flat battery/textile fields from `Tenant` struct (still present for backward compat — safe to remove once all tests use profiles)
- Update all test struct literals to populate `BatteryProfile` / `TextileProfile`

### 2. Textile roles (Phase 5.4)

- ✅ Team page UI: `frontend/app/[product]/dashboard/team/` now switches between battery/textile team pages
- ✅ All remaining dashboard subpages have product switches with textile under-development placeholders
- Add textile role constants to `backend/internal/models/types.go`
- Update RBAC middleware for textile-specific roles
- Validate role visibility and permission boundaries with integration tests

### 3. Full `go test` pass

- ✅ Full `go test ./cmd/... ./internal/...` passes
- ✅ Pre-existing bug: `TestDeriveManufacturerCode` fixed in both `services` and `serial` packages
- ✅ Compliance validators: nil-pointer safety added with `EnsureBatteryProfile()`

---

## Medium Priority

### 4. Product-aware DTO validation tests (Phase 1.3)

- Add request/response validation tests for product-aware DTOs
- Make product mismatch and unknown product errors explicit in API responses

### 5. Registry-driven configs (Phase 3.2)

- Make sidebar navigation registry-driven (`frontend/lib/products.ts`)
- Make dashboard cards/widgets registry-driven (battery widgets still battery-local)
- Make onboarding step definitions registry-driven
- Make page metadata/breadcrumbs registry-driven where product wording differs

### 6. Battery config in registry (Phase 4.2)

- Define battery onboarding steps in registry
- Define battery lifecycle language and roles in registry
- Define battery template labels and passport presentation config

### 7. Textile-specific metrics and terminology (Phase 5.2)

- Replace battery metrics with textile metrics: water usage, chemical compliance, fiber recyclability
- Update sidebar terminology: `Lifecycle` → `Supply Chain`, `Batches` → `Collections` if desired

### 8. Textile onboarding form fields (Phase 5.1)

- Add textile onboarding step config to registry
- Add remaining form fields: factory/mill location, fiber types, supply-chain tier, certifications, primary market regions

### 9. Template-driven variant selection (Immediate Next)

- Replace current variant registry baseline with batch-template-driven passport presentation selection
- Richer textile schema/template combinations should choose variants explicitly, not just product/market defaults

### 10. Deploy migration checklist

- Convert repaired migration tooling + live textile API smoke flow into durable pre-deploy checklist
- Catch missing migrations like `000054` before runtime

---

## Lower Priority (QA + Hardening)

### 11. End-to-end validation (Phase 7.1)

- Battery: login → onboarding → create batch → generate passport → export
- Invite flow works under product routes
- OAuth callback completes and lands on correct product dashboard
- Reset/forgot/verify email all stay within correct product namespace
- Shared pages behave consistently under both product slugs

### 12. Cross-product protections (Phase 7.2)

- Confirm battery tenant cannot stay inside `/textile/*` (JWT claim enforcement deployed)
- Confirm textile tenant cannot stay inside `/battery/*` (JWT claim enforcement deployed)

### 13. Remaining hardcoded cleanup (Phase 3.3)

- Remove remaining product-specific hardcoded links from shared headers, docs headers, sidebars, utility components
- Finalize callback, accept-invite, reset-password, forgot-password, verify-email flows with product-aware routes

### 14. Textile lifecycle page completion

- `frontend/components/textile/textile-lifecycle-page.tsx` is a placeholder stub (131 lines)
- Needs supply-chain event tracking, material traceability UI

### 15. Production readiness (Phase 7.4)

- Add observability for login failures, route mismatches, product mismatch redirects, passport generation failures
- Add smoke-test checklist for both products after each deployment
- Document migrations, seed data, and product registries for future developers
- Confirm rollback path for new profile tables and product type columns

### 16. UpdateProfileRequest decomposition

- `UpdateProfileRequest` still has flat battery+textile fields
- Could be split into product-specific request types, or left flat since it's the API contract

---

## Non-blocking / Deferred

- Electronics support (enum exists, no implementation)
- Temporary compatibility redirects in proxy (can stay as safety net)
