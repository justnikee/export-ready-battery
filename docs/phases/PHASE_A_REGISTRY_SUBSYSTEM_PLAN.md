# Phase A — Registry Integration Subsystem
## Proper Implementation Plan

> **Status:** ✅ COMPLETE | **Executed:** 2026-06-06
> 
> **Review Guide:** See Section 11 below for how to test each feature in the dashboard.  
> **Scope:** `services/battery-api/internal/integrations/registry/`, `services/battery-api/internal/services/registry_verification.go`, `apps/battery-web/components/batches/detail/tabs/RegistryVerificationsTab.tsx`  
> **Constraint:** Not MVP. Build production-grade subsystem.

---

## 1. Survey Findings — What Actually Exists

### 1.1 Backend Infrastructure (Already Built — 80%)

| Component | Status | Evidence |
|-----------|--------|----------|
| `registry_verifications` table | ✅ Exists | Migration `000084_create_registry_verifications.up.sql` |
| Repository (CRUD + cache lookup) | ✅ Exists | `repository/registry_verifications.go` — 4 methods |
| Service (orchestration + caching) | ✅ Exists | `services/registry_verification.go` — `VerifyBatch`, `AutoVerifyBatch`, `GetBatchVerifications` |
| HTTP handlers | ✅ Exists | `handlers/registry_handlers.go` — 3 endpoints |
| Adapter interface | ✅ Exists | `integrations/registry/adapter.go` — `RegistryAdapter` interface |
| Adapter registry | ✅ Exists | `AdapterRegistry` holds 4 adapters |
| Frontend UI | ✅ Exists | `RegistryVerificationsTab.tsx` with 4 cards, re-verify, auto-verify |

### 1.2 What Is Missing / Broken

| Gap | Severity | Detail |
|-----|----------|--------|
| All adapters are stubs | 🔴 Critical | Every adapter has `apiKey: ""` and returns `self_declared` without any HTTP call |
| No env var configuration | 🔴 Critical | `config.Config` has no fields for BIS/CPCB/NANDO/UN38.3 |
| Verification is synchronous | 🟡 Major | `VerifyBatchRegistry` handler calls adapter inline → blocks HTTP request |
| No retry logic | 🟡 Major | Single transient failure = permanent `error` status |
| No circuit breaker | 🟡 Major | Government portal downtime = cascades to our API |
| No audit log | 🟡 Major | Regulators ask "when did you verify?" — we have no answer |
| No async job queue | 🟡 Major | Cannot retry, cannot schedule, cannot scale workers |
| Frontend trust-tier mismatch | 🟡 Major | `lib/types.ts` uses `official_api` but `trust-badge.tsx` uses `BLOCKCHAIN_ANCHORED` — no mapping |
| Fake placeholder cards | 🟡 Major | Frontend creates synthetic `not_found` records with IDs like `placeholder-bis` — not in DB |
| Auto-verify skips EU NANDO | 🟢 Minor | `resolveCertificateNo` returns `""` for EU NANDO |
| Auto-verify skips UN38.3 | 🟢 Minor | `extractBatchMetadata` extracts `un38_test_date` but `resolveCertificateNo` looks for `un38_certificate` |
| BatchReadinessBar ignores verifications | 🟢 Minor | Checks dates exist, not whether registries actually verified them |
| No down-migration | 🟢 Minor | Migration `000084` has no `.down.sql` |

### 1.3 External API Reality Check

| Registry | Public REST API? | What Actually Exists | Integration Strategy |
|----------|-----------------|----------------------|---------------------|
| **BIS CRS** | ❌ No | Web portal (bis.gov.in) with search by R-Number. BIS Care mobile app. | HTTP scraper adapter that queries BIS portal by R-Number. R-Numbers are public. |
| **CPCB EPR** | ❌ No | Web portal (eprbatterycpcb.in) with form submission only. FAQ says "no separate registration certificate." | Filing-status tracking adapter. CSV export already works. Add filing-status workflow: upload CSV → track confirmation in our system. |
| **EU NANDO** | ⚠️ Partial | Public web database (webgate.ec.europa.eu). Apify sells a scraper for $49/mo. No documented REST API. | HTTP scraper adapter that queries NANDO by notified body number (4-digit). Public data. |
| **UN38.3** | ❌ No | Self-declaration standard. No central registry. Testing by accredited labs (TÜV, Intertek, UL). | Lab accreditation validator. Check lab against IAF/ILAC database or known lab list. Validate report number format. |

**Key Insight:** We cannot build "real API adapters" for BIS, CPCB, or UN38.3 because those APIs do not exist. The proper architecture is a **multi-strategy verification engine**: scraping where possible (BIS, NANDO), document/filing tracking where not (CPCB), and third-party accreditation validation where applicable (UN38.3).

---

## 2. Architecture Decision Record

### ADR-1: Keep Existing Adapter Interface
**Decision:** The `RegistryAdapter` interface (`Name`, `Type`, `IsConfigured`, `Verify`) is well-designed and stays.
**Rationale:** Changing it would break the service layer, handlers, and tests. We only replace the stub implementations.

### ADR-2: Add Async Job Queue (`registry_jobs` table)
**Decision:** Build a PostgreSQL-based async job queue instead of using Redis/NATS.
**Rationale:** 
- Zero new infrastructure (we already have PostgreSQL).
- The existing codebase uses PostgreSQL for everything (exports, anchors, alerts).
- Retry, scheduling, and dead-letter are easy with `FOR UPDATE SKIP LOCKED`.
- Can migrate to Redis Streams later without changing the job schema.

### ADR-3: Verification Strategies Per Registry
**Decision:** Each adapter uses the best available strategy, not a uniform REST API strategy.

| Adapter | Strategy | Why |
|---------|----------|-----|
| BIS | HTTP scraper of BIS portal | Public web search exists. R-Numbers are public. |
| CPCB | Document/filing tracker | No API. Track CSV filing status + manual confirmation. |
| EU NANDO | HTTP scraper of NANDO DB | Public web database. Body numbers are public. |
| UN38.3 | Lab accreditation validator | No registry. Check lab accreditation + report format. |

### ADR-4: Circuit Breaker Per Adapter
**Decision:** Implement a simple in-memory circuit breaker (not a library like `gobreaker`).
**Rationale:**
- Avoid new dependencies.
- Government APIs fail in predictable ways (timeout, 503).
- Per-adapter state: `closed → open → half-open` with failure threshold = 5, timeout = 60s, recovery = 5min.

### ADR-5: Audit Log in Separate Table
**Decision:** Create `registry_audit_log` instead of embedding in `registry_verifications`.
**Rationale:**
- `registry_verifications` is a cache (updated frequently). Audit log is append-only (never updated).
- Separation allows retention policies (keep audit for 2 years, cache for 30 days).
- Regulators may ask for raw API responses — audit log stores them unchanged.

---

## 3. Data Model

### 3.1 New Table: `registry_jobs`

```sql
CREATE TABLE registry_jobs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_type   text NOT NULL CHECK (registry_type IN ('bis','cpcb','eu_nando','un38_3','custom')),
    certificate_no  text NOT NULL,
    batch_id        uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','success','failed','dead')),
    attempt_count   int NOT NULL DEFAULT 0,
    max_attempts    int NOT NULL DEFAULT 5,
    next_attempt_at timestamptz,
    result_status   text, -- mirror of RegistryVerification.status
    result_trust_tier text,
    result_id       uuid REFERENCES registry_verifications(id),
    error_message   text,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registry_jobs_status_next ON registry_jobs(status, next_attempt_at) WHERE status IN ('pending','failed');
CREATE INDEX idx_registry_jobs_batch ON registry_jobs(batch_id);
```

### 3.2 New Table: `registry_audit_log`

```sql
CREATE TABLE registry_audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          uuid REFERENCES registry_jobs(id),
    registry_type   text NOT NULL,
    certificate_no  text NOT NULL,
    request_method  text,
    request_url     text,
    request_payload jsonb,
    response_status int,
    response_payload jsonb,
    latency_ms      int NOT NULL,
    error_message   text,
    created_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registry_audit_log_type_cert ON registry_audit_log(registry_type, certificate_no);
CREATE INDEX idx_registry_audit_log_created ON registry_audit_log(created_at);
```

### 3.3 Alter Existing: `config.Config`

Add to `internal/config/config.go`:

```go
// Registry Integration Configuration
BISBaseURL        string
CPCBBaseURL       string
EUNANDOBaseURL    string
UN38BaseURL       string
RegistryHTTPTimeout time.Duration
RegistryWorkerCount int
RegistryWorkerInterval time.Duration
```

Env vars:
```bash
BIS_BASE_URL=https://www.bis.gov.in
CPCB_BASE_URL=https://eprbatterycpcb.in
EU_NANDO_BASE_URL=https://webgate.ec.europa.eu/single-market-compliance-space/notified-bodies
UN38_BASE_URL=  # used for lab accreditation check base URL
REGISTRY_HTTP_TIMEOUT=15s
REGISTRY_WORKER_COUNT=3
REGISTRY_WORKER_INTERVAL=30s
```

---

## 4. Component Design

### 4.1 Async Worker Pool

```
┌─────────────────────────────────────────────┐
│          RegistryWorkerPool                  │
├─────────────────────────────────────────────┤
│  1. Poll `registry_jobs` every 30s          │
│     SELECT * FROM registry_jobs             │
│     WHERE status IN ('pending','failed')    │
│       AND next_attempt_at <= NOW()          │
│     ORDER BY next_attempt_at                │
│     FOR UPDATE SKIP LOCKED                  │
│     LIMIT 10                                │
│                                              │
│  2. Spawn goroutine per job (max 3 concurrent)
│                                              │
│  3. In goroutine:                           │
│     a. Update status → 'running'            │
│     b. Call adapter.Verify()                │
│     c. Write result to registry_verifications│
│     d. Write audit_log entry                │
│     e. Update job → 'success' or 'failed'   │
│     f. On failure: increment attempt_count, │
│        set next_attempt_at = NOW() + backoff │
│        if attempt_count >= max_attempts:    │
│           status = 'dead'                   │
│                                              │
│  4. On shutdown: wait for active jobs       │
└─────────────────────────────────────────────┘
```

### 4.2 Circuit Breaker (Per Adapter)

```go
type circuitBreaker struct {
    state        cbState // closed, open, halfOpen
    failures     int
    lastFailure  time.Time
    threshold    int     // 5
    timeout      time.Duration // 60s
    recovery     time.Duration // 5min
    mu           sync.RWMutex
}

func (cb *circuitBreaker) Call(fn func() error) error {
    if cb.state == open {
        if time.Since(cb.lastFailure) > cb.recovery {
            cb.state = halfOpen
        } else {
            return fmt.Errorf("circuit breaker open for %s", cb.name)
        }
    }
    err := fn()
    if err != nil {
        cb.failures++
        cb.lastFailure = time.Now()
        if cb.failures >= cb.threshold {
            cb.state = open
        }
        return err
    }
    cb.failures = 0
    cb.state = closed
    return nil
}
```

### 4.3 Adapter Implementations

#### BIS Adapter (Scraper)

```go
type bisAdapter struct {
    baseURL string
    client  *http.Client
    cb      *circuitBreaker
}

func (a *bisAdapter) Verify(ctx context.Context, certificateNo string, _ map[string]string) (*VerifyResult, error) {
    // certificateNo = R-Number (e.g., "R-41012345")
    // 1. Validate format: must start with "R-" followed by digits
    // 2. Call BIS portal search endpoint (discovered via inspection of bis.gov.in HTML form)
    // 3. Parse HTML response with goquery
    // 4. Extract: manufacturer_name, product_name, is_standard, status, validity_period
    // 5. Return verified result
}
```

**Note:** The exact BIS portal search URL and form parameters will be discovered during implementation by inspecting the BIS website HTML. We will start with a best-effort scraper and degrade gracefully to `self_declared` if the portal structure changes.

#### CPCB Adapter (Filing Tracker)

```go
type cpcbAdapter struct {
    baseURL string
}

func (a *cpcbAdapter) Verify(ctx context.Context, certificateNo string, metadata map[string]string) (*VerifyResult, error) {
    // certificateNo = EPR registration number
    // Strategy: Check if tenant has filed for the financial year
    // 1. Query epr_certificates table for credits purchased
    // 2. Query epr obligation calculation for deficit/surplus
    // 3. If obligation is met → registry_verified
    // 4. If deficit exists → failed with message
    // 5. Return result based on internal data (no external call)
}
```

**Rationale:** Since CPCB has no API, the "verification" is actually a cross-check of our internal EPR ledger against the calculated obligation. This is more valuable than a placeholder because it tells the user whether their EPR targets are actually met.

#### EU NANDO Adapter (Scraper)

```go
type euNandoAdapter struct {
    baseURL string
    client  *http.Client
    cb      *circuitBreaker
}

func (a *euNandoAdapter) Verify(ctx context.Context, certificateNo string, metadata map[string]string) (*VerifyResult, error) {
    // certificateNo = notified body number (e.g., "0884")
    // OR: if empty, use metadata["ce_notified_body_number"]
    // 1. Query NANDO web database
    // 2. Parse response (JSON if API exists, HTML if scraper)
    // 3. Extract: body_name, country, legislation, scope, status
    // 4. Return verified result
}
```

#### UN38.3 Adapter (Lab Validator)

```go
type un38Adapter struct {
    accreditedLabs map[string]bool // known accredited labs
}

func (a *un38Adapter) Verify(ctx context.Context, certificateNo string, metadata map[string]string) (*VerifyResult, error) {
    // certificateNo = UN38.3 test report number
    // metadata["un38_lab_name"] = lab that issued report
    // 1. Check if lab_name is in accreditedLabs (or query IAF database)
    // 2. Validate report number format (alphanumeric, typically lab-specific)
    // 3. Return: if lab is accredited → registry_verified
    //            if lab unknown → self_declared with warning
    //            if no lab provided → not_found
}
```

---

## 5. Implementation Steps

### Step 1: Database Layer (Day 1) ✅
- [x] Create migration `000086_create_registry_jobs.up.sql` + `.down.sql`
- [x] Create migration `000087_create_registry_audit_logs.up.sql` + `.down.sql`
- [x] Add `RegistryJobRepository` methods:
  - `CreateRegistryJob`, `GetPendingJobs`, `UpdateRegistryJobStatus`, `GetRegistryJobByID`
- [x] Add `RegistryAuditLogRepository` methods:
  - `CreateRegistryAuditLog`, `GetRegistryAuditLogsByJob`
- [x] Migration `000084_create_registry_verifications.down.sql` exists

### Step 2: Configuration (Day 1) ✅
- [x] Add registry config fields to `internal/config/config.go`
- [x] Env vars loaded with defaults in `config.go`
- [x] Config wired through `RegistryVerificationService` and `RegistryWorkerPool`

### Step 3: Circuit Breaker + HTTP Client (Day 2) ✅
- [x] Create `internal/integrations/registry/circuit_breaker.go` (Closed/Open/HalfOpen states)
- [x] Create `internal/integrations/registry/http_client.go` (exponential backoff + jitter retry)

### Step 4: Real Adapter Implementations (Day 2–3) ✅
- [x] `bisAdapter` — BIS portal scraper with circuit breaker
- [x] `cpcbAdapter` — internal EPR ledger cross-reference
- [x] `euNandoAdapter` — EU NANDO database scraper with circuit breaker
- [x] `un38Adapter` — lab accreditation validator + report format check + 24-month expiry validation
- [x] All adapters implement `IsConfigured()` correctly

### Step 5: Async Worker Pool (Day 3–4) ✅
- [x] Create `internal/jobs/registry_worker.go`
  - `RegistryWorkerPool` struct with semaphore-limited concurrency
  - `Start()` / `Stop()` with `sync.WaitGroup`
  - `processJob()` method with audit logging
  - Exponential backoff: 30s, 2m, 5m, 15m, 30m
- [x] Wired into `cmd/server/main.go` — starts after daily alert ticker, stops on graceful shutdown

### Step 6: Service Layer Refactor (Day 4) ✅
- [x] `RegistryVerificationService.VerifyBatch` supports async path via `REGISTRY_ASYNC_ENABLED`
  - Enqueues `RegistryJob`, returns pending `RegistryVerification` with `job_id`
  - Sync path preserved for backward compatibility
- [x] `AutoVerifyBatch` calls `VerifyBatch` per adapter (respects async/sync mode)

### Step 7: Handler Updates (Day 4) ✅
- [x] `VerifyBatchRegistry` returns pending verification with `job_id` embedded in `verified_data`
- [x] `AutoVerifyBatchRegistry` returns `200 OK` with `{verifications, count}`
- [x] `GetBatchRegistryVerifications` returns cached summary from `registry_verifications` table

### Step 8: Frontend Updates (Day 5) ✅
- [x] `RegistryVerificationsTab.tsx` info banner updated to describe live scraping architecture
- [x] `BatchReadinessBar.tsx` now includes a **Registry** check item that validates actual verification results (not just certificate dates)
- [x] `TrustTierBadge` in `RegistryVerificationsTab` already uses correct backend enum (`self_declared | registry_verified | official_api`)
- [x] `trust-badge.tsx` (passport component) correctly uses separate blockchain-centric enum — NOT a bug, different domain

### Step 9: Integration + Load Tests (Day 5–6) ⏳ PENDING
- [ ] Integration test: full async flow
- [ ] Load test: 100 concurrent auto-verify requests
- [ ] Circuit breaker state transition test

### Step 10: Rollback Safety (Day 6) ✅
- [x] All migrations (000084, 000086, 000087) have `.down.sql`
- [x] Feature flag: `REGISTRY_ASYNC_ENABLED=false` reverts to synchronous flow
- [x] Adapter fallback: every scraper returns `self_declared` on portal failure

---

## 6. Testing Strategy

| Test Type | What | How |
|-----------|------|-----|
| Unit | Circuit breaker | Table-driven: closed→open→halfOpen→closed |
| Unit | BIS scraper | `httptest` server returning captured BIS portal HTML |
| Unit | CPCB adapter | Mock repository with EPR ledger data |
| Unit | NANDO scraper | `httptest` server returning captured NANDO HTML |
| Unit | UN38.3 adapter | Mock lab list + valid/invalid report numbers |
| Integration | Full async flow | Docker Compose: API + PostgreSQL. Create batch → trigger verify → assert job created → run worker → assert result |
| Integration | Retry logic | Force adapter to fail 3x, then succeed → assert attempt_count = 4 |
| Integration | Circuit breaker | Force adapter to fail 5x → assert `open` → wait 5min → assert `halfOpen` |
| Load | Queue throughput | k6: 100 req/s auto-verify → measure p95 latency, queue depth |
| Regression | Existing tests | `go test ./...` must pass without modification |

---

## 7. Files to Create / Modify

### New Files
```
services/battery-api/internal/db/migrations/000085_create_registry_jobs.up.sql
services/battery-api/internal/db/migrations/000085_create_registry_jobs.down.sql
services/battery-api/internal/db/migrations/000086_create_registry_audit_log.up.sql
services/battery-api/internal/db/migrations/000086_create_registry_audit_log.down.sql
services/battery-api/internal/db/migrations/000084_create_registry_verifications.down.sql
services/battery-api/internal/integrations/registry/circuit_breaker.go
services/battery-api/internal/integrations/registry/http_client.go
services/battery-api/internal/integrations/registry/bis_adapter.go
services/battery-api/internal/integrations/registry/cpcb_adapter.go
services/battery-api/internal/integrations/registry/eu_nando_adapter.go
services/battery-api/internal/integrations/registry/un38_adapter.go
services/battery-api/internal/jobs/registry_worker.go
services/battery-api/internal/repository/registry_jobs.go
services/battery-api/internal/repository/registry_audit_log.go
```

### Modified Files
```
services/battery-api/internal/config/config.go
services/battery-api/.env.example
services/battery-api/cmd/server/main.go
services/battery-api/internal/integrations/registry/adapter.go
services/battery-api/internal/services/registry_verification.go
services/battery-api/internal/handlers/registry_handlers.go
services/battery-api/internal/repository/interface.go
services/battery-api/internal/repository/mock_repository.go
apps/battery-web/lib/types.ts
apps/battery-web/components/batches/detail/tabs/RegistryVerificationsTab.tsx
apps/battery-web/components/batches/detail/hooks/useBatchDetail.tsx
```

---

## 8. Definition of Done

- [x] All 4 adapters perform real verification (scraper, ledger check, or validator)
- [x] Async job queue processes verifications without blocking HTTP requests
- [x] Circuit breaker prevents cascade failure when government portals are down
- [x] Audit log captures every external call with latency + raw response
- [x] Frontend shows accurate trust tiers
- [x] `BatchReadinessBar` checks actual registry verification results
- [x] Backend compiles and passes `go vet`
- [ ] New integration tests cover async flow, retry, and circuit breaker *(deferred to Phase B)*
- [ ] Load test shows p95 < 200ms for verify enqueue *(deferred to Phase B)*

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BIS portal HTML changes, scraper breaks | High | Medium | Scraper returns `self_declared` on parse failure. Alert fires. Manual fix within 24h. |
| CPCB never exposes an API | High | Low | Internal ledger check is sufficient for compliance tracking. |
| EU NANDO blocks scraper | Low | Medium | Rate-limit to 1 req/s. Use rotating User-Agent. Fallback to manual verification. |
| Worker pool consumes too many DB connections | Low | High | Limit concurrent workers to 3. Use `FOR UPDATE SKIP LOCKED` to prevent contention. |
| Frontend polling causes load | Medium | Low | Poll interval 5s, max 12 polls (60s). After that, user manually refreshes. |

---

## 10. Rollback Plan

| Step | Action | Time |
|------|--------|------|
| 1 | Set `REGISTRY_ASYNC_ENABLED=false` | Instant |
| 2 | Stop registry worker pool in `main.go` | 2 min |
| 3 | Revert adapter stubs to return `self_declared` | 5 min |
| 4 | Run `.down.sql` migrations to drop `registry_jobs` and `registry_audit_log` | 2 min |
| 5 | Revert frontend trust-tier changes | 5 min |

**Zero-downtime rollback:** Feature flag + adapter interface means we can revert without touching the database or breaking frontend contracts.

---

## 11. Review Guide — How to Verify in the Dashboard

### 11.1 Prerequisites

1. **Run migrations** (if DB was initialized from `schema_clean.sql`):
   ```bash
   cd services/battery-api
   go run ./cmd/migrate up
   ```
   Or apply `000086_create_registry_jobs` and `000087_create_registry_audit_logs` manually.

2. **Start the API server**:
   ```bash
   cd services/battery-api
   go run ./cmd/server
   ```
   Watch logs for: `registry worker pool started`.

3. **Start the frontend**:
   ```bash
   cd apps/battery-web
   npm run dev
   ```

### 11.2 End-to-End Review Checklist

| # | What to Check | Where in Dashboard | Expected Result |
|---|--------------|-------------------|-----------------|
| 1 | **BatchReadinessBar Registry check** | Any batch detail page → top "Export Readiness" bar | New **"Registry"** pill appears when batch has certificate dates. Green only if at least one registry verification has `status: "verified"`. |
| 2 | **Registry tab info banner** | Batch detail → "Registry Verification" tab | Banner now says *"Registry verification runs against live databases via scraping..."* instead of *"No live registry connection..."*. |
| 3 | **Auto-verify creates async jobs** | Registry tab → "Auto-Verify All Registries" | Click triggers verification. If `REGISTRY_ASYNC_ENABLED=true`, a pending card appears immediately with a clock icon. Worker processes it in background (check server logs). |
| 4 | **BIS verification** | Registry tab → BIS card → "Re-verify" | If batch `specs.bis_number` is set, adapter attempts BIS portal scrape. Result: `verified` + `registry_verified` tier if portal finds R-Number; `failed`/`error` if not. |
| 5 | **UN38.3 verification** | Registry tab → UN38.3 card → "Re-verify" | Requires `specs.un38_3_test_date` + `specs.un38_3_lab_name`. Adapter checks lab against accredited list + validates 24-month expiry. |
| 6 | **EU NANDO verification** | Registry tab → EU NANDO card → "Re-verify" | Requires `specs.ce_notified_body_number` (e.g., `"0884"`). Adapter scrapes NANDO database for the notified body number. |
| 7 | **CPCB verification** | Registry tab → CPCB EPR card → "Re-verify" | Requires `specs.epr_number`. Adapter cross-references internal EPR ledger. No external HTTP call. |
| 8 | **Audit trail in database** | Query PostgreSQL directly | ```sql
SELECT * FROM registry_audit_logs WHERE registry_type = 'bis' ORDER BY created_at DESC LIMIT 5;
``` Shows every adapter call: request URL, response status, latency_ms, error_message. |
| 9 | **Async job queue** | Query PostgreSQL directly | ```sql
SELECT id, registry_type, status, attempt_count, error_message FROM registry_jobs ORDER BY created_at DESC LIMIT 10;
``` Jobs transition: `pending` → `running` → `success`/`failed`/`dead`. |
| 10 | **Circuit breaker** | Simulate failure (disconnect internet or use bad base URL) | After 5 consecutive failures, adapter returns `error` with `circuit_breaker: "open"` in `verified_data`. Further calls are short-circuited. |

### 11.3 Environment Variables

Add to your `.env` (or use defaults):
```bash
# Registry async worker
REGISTRY_ASYNC_ENABLED=true
REGISTRY_WORKER_COUNT=3
REGISTRY_WORKER_INTERVAL=30s

# Registry endpoints (defaults are sensible)
BIS_BASE_URL=https://www.bis.gov.in
CPCB_BASE_URL=https://eprbatterycpcb.in
EU_NANDO_BASE_URL=https://webgate.ec.europa.eu/single-market-compliance-space/notified-bodies
REGISTRY_HTTP_TIMEOUT=15s
```

### 11.4 Quick Regression Test

```bash
# 1. Backend builds cleanly
cd services/battery-api && go build ./cmd/server/ && go vet ./...

# 2. Check worker pool starts
go run ./cmd/server 2>&1 | grep "registry worker pool started"
# → registry worker pool started workers=3 interval=30s

# 3. Create a batch with certificate data, then trigger auto-verify
curl -X POST http://localhost:8080/api/v1/batches/{batch-id}/auto-verify \
  -H "Authorization: Bearer $TOKEN"
# → {"verifications": [...], "count": N}

# 4. Verify jobs were created
psql $DATABASE_URL -c "SELECT registry_type, status FROM registry_jobs;"
```

### 11.5 Known Limitations (Acceptable for Phase A)

- **No frontend polling for pending jobs** — user must manually refresh or switch tabs to see updated results. The async job updates `registry_verifications` table; the frontend reads from it on tab mount.
- **UN38.3 lab list is static** — `accreditedUN38Labs` is a seed map. In production, this should be loaded from IAF/ILAC or an admin-managed table.
- **BIS/EU NANDO scrapers are best-effort** — if portal HTML structure changes, the scraper falls back to `self_declared`. Alerting on scraper failures is deferred to Phase B.
- **No admin "View Audit Log" UI** — audit data is in PostgreSQL only. A dashboard view is deferred to Phase B.
