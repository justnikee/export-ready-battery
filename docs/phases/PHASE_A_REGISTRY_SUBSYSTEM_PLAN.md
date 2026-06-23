# Phase A — Registry Integration Subsystem
## Updated Plan (Reality-Aligned)

> **Status:** ✅ COMPLETE
> 
> **Scope:** `services/battery-api/internal/integrations/registry/`, `services/battery-api/internal/services/registry_verification.go`, `apps/battery-web/components/batches/detail/tabs/RegistryVerificationsTab.tsx`

---

## 1. What Actually Exists (Verified in Codebase)

### 1.1 Backend — 100% Implemented

| Component | Status | Evidence |
|-----------|--------|----------|
| `registry_verifications` table | ✅ Exists | Migration `000084` + `.down.sql` |
| `registry_jobs` table | ✅ Exists | Migration `000086` + `.down.sql` |
| `registry_audit_log` table | ✅ Exists | Migration `000087` + `.down.sql` |
| Config (BIS/CPCB/EU NANDO/UN38 URLs, worker settings) | ✅ Exists | `internal/config/config.go` |
| Circuit breaker | ✅ Real impl | `circuit_breaker.go` — 3-state + unit tests |
| HTTP client | ✅ Real impl | `http_client.go` — timeouts, pooling |
| BIS adapter | ✅ Live scraper | `bis_adapter.go` — scrapes BIS portal |
| CPCB adapter | ✅ Ledger check | `cpcb_adapter.go` — cross-references EPR data |
| EU NANDO adapter | ✅ Live scraper | `eu_nando_adapter.go` — scrapes NANDO DB |
| UN38.3 adapter | ✅ Lab validator | `un38_adapter.go` — lab accreditation + 24mo expiry |
| Async worker pool | ✅ Real impl | `internal/jobs/registry_worker.go` — semaphore-based |
| Repositories | ✅ Real impl | `registry_jobs.go`, `registry_audit_log.go` |
| Service layer | ✅ Dual path | `registry_verification.go` — async + sync |
| Handlers | ✅ Wired | `registry_handlers.go` — 3 endpoints |
| Server lifecycle | ✅ Wired | `cmd/server/main.go` |

### 1.2 Frontend — 100% Implemented

| Component | Status | Evidence |
|-----------|--------|----------|
| `RegistryVerificationsTab.tsx` | ✅ Real | Info banner, pending cards, re-verify, auto-verify |
| `BatchReadinessBar.tsx` | ✅ Real | Registry check validates `status === "verified"` |
| `types.ts` trust tiers | ✅ Correct | `self_declared \| registry_verified \| official_api` |
| `useBatchDetail.tsx` | ✅ Integrated | Dedicated state + fetcher for verifications |

### 1.3 Tests — Implemented

| Test | File | Status |
|------|------|--------|
| Circuit breaker unit tests | `circuit_breaker_test.go` | ✅ 9 tests passing |
| Async flow integration tests | `handlers/integration_test.go` | ✅ 3 tests passing |
| Worker retry/backoff tests | `jobs/registry_worker_test.go` | ✅ 6 tests passing |

---

## 2. Definition of Done

- [x] All 4 adapters perform real verification
- [x] Async job queue processes verifications without blocking HTTP
- [x] Circuit breaker prevents cascade failure
- [x] Audit log captures every external call
- [x] Frontend shows accurate trust tiers
- [x] `BatchReadinessBar` checks actual registry verification results
- [x] Backend compiles and passes `go vet`
- [x] Circuit breaker has unit test coverage
- [x] Async registry flow has integration test coverage
- [x] Worker retry/backoff logic has test coverage

---

## 3. Known Limitations (Acceptable)

- **Load test** (100 concurrent auto-verify, p95 < 200ms) — deferred to infrastructure testing suite
- **Admin "View Audit Log" UI** — deferred to admin dashboard backlog
- **BIS/EU NANDO scraper failure alerting** — deferred to observability sprint
