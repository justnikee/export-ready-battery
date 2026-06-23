# Battery Critical Blockers — Remediation Plan

**Goal:** Fix the 6 critical blockers (plus security hardening) without breaking existing functionality.
**Approach:** Database-first, then API, then frontend. Every step is independently reversible.

---

## Execution Order

```
Phase 0 ── Safety Net & Baseline
Phase 1 ── Database Integrity (most critical)
Phase 2 ── Security Hardening (quick wins)
Phase 3 ── Backend Architecture (rule engine, thresholds)
Phase 4 ── Frontend Infrastructure (i18n, bulk import)
Phase 5 ── Data Model Expansion (BOM, W3C VC scaffold)
```

**Why this order?**
- Phase 1 must happen first because later phases may insert data that depends on audit-trail integrity.
- Phase 2 is pure backend middleware — zero API contract changes.
- Phase 3 changes compliance scoring logic; we want the audit trail solid before touching it.
- Phase 4 adds new UI features without modifying existing flows.
- Phase 5 is additive schema work (new tables/columns) — safest to do last.

---

## Phase 0 — Safety Net (1 day)

**Before we touch anything:**

1. **Verify all existing tests pass**
   ```bash
   cd services/battery-api && go test ./...
   cd apps/battery-web && npm test
   ```

2. **Create a `baseline` tag** so we can always revert:
   ```bash
   git tag pre-remediation-baseline
   ```

3. **Add `core.ProtectAdmin` middleware** (if not present) to prevent accidental deletion of admin/system tenants during migrations.

4. **Document current compliance scores** for a few test batches so we can verify Phase 3 doesn't silently change scoring.

---

## Phase 1 — Fix Audit Trail Cascade Delete (2–3 days)

**Blocker:** `ON DELETE CASCADE` on `passport_events.passport_id` destroys the audit trail when a passport is deleted.

**Strategy:** Soft-delete passports + safety-net FK change. No existing query will see deleted passports, but events survive forever.

### Step 1.1 — Migration: Add `deleted_at` to `passports`

```sql
-- migrations/00X_add_passport_soft_delete.up.sql
ALTER TABLE passports ADD COLUMN deleted_at timestamptz;
CREATE INDEX idx_passports_deleted_at ON passports(deleted_at) WHERE deleted_at IS NOT NULL;

-- Change FK constraint from CASCADE to SET NULL (safety net)
ALTER TABLE passport_events DROP CONSTRAINT passport_events_passport_id_fkey;
ALTER TABLE passport_events ADD CONSTRAINT passport_events_passport_id_fkey
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL;
```

**Rollback:**
```sql
-- migrations/00X_add_passport_soft_delete.down.sql
ALTER TABLE passport_events DROP CONSTRAINT passport_events_passport_id_fkey;
ALTER TABLE passport_events ADD CONSTRAINT passport_events_passport_id_fkey
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE;
ALTER TABLE passports DROP COLUMN deleted_at;
```

### Step 1.2 — Repository: Implement Soft Delete

**Files:**
- `services/battery-api/internal/repository/passport.go` — change `DeletePassport` to:
  ```go
  func (r *PassportRepository) DeletePassport(ctx context.Context, id uuid.UUID) error {
      _, err := r.db.Exec(ctx,
          "UPDATE passports SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
          id)
      return err
  }
  ```

- Update **all** `passports` SELECT queries in the repository to add:
  ```sql
  AND deleted_at IS NULL
  ```
  Check files: `passport.go`, `batch.go`, `lifecycle.go`, `alerts.go`, etc.

### Step 1.3 — Handler: Return 404 for soft-deleted passports

No code change needed if repository already filters `deleted_at IS NULL`. The existing `sql.ErrNoRows` → 404 path handles it.

### Step 1.4 — Test

- Unit test: create passport → create event → delete passport → assert event still exists in DB
- Unit test: query deleted passport → expect 404
- Integration test: verify hash chain still works for orphaned events

**Backward compatibility:** ✅ 100%. Existing API responses unchanged. Only the DB survives deletion.

---

## Phase 2 — Security Hardening (1 day)

These are one-line fixes with zero breaking changes.

### Step 2.1 — Fix Rate-Limit Header Bug

**File:** `services/battery-api/internal/middleware/ratelimit.go`

**Change:**
```go
// BEFORE (broken)
w.Header().Set("X-RateLimit-Limit", string(rune(limit)))

// AFTER (fixed)
w.Header().Set("X-RateLimit-Limit", strconv.Itoa(limit))
```

**Test:** Assert header equals `"250"`, not `"ú"`.

### Step 2.2 — Secure Auth Cookie

**File:** `services/battery-api/internal/handlers/auth_handlers.go`

**Change:** Where the `auth_token` cookie is set, add:
```go
http.SetCookie(w, &http.Cookie{
    Name:     "auth_token",
    Value:    token,
    Path:     "/",
    HttpOnly: true,
    Secure:   true,        // require HTTPS
    SameSite: http.SameSiteStrictMode,
    MaxAge:   86400,
})
```

**Note:** `Secure: true` means local HTTP dev will stop working. Add an env flag:
```go
secure := os.Getenv("ENV") == "production" // or use existing config
```

**Backward compatibility:** ✅ Cookie format unchanged; clients that previously read `document.cookie` via JS will lose access (this is the intended security improvement).

### Step 2.3 — Add Request Body Size Limit

**File:** `services/battery-api/cmd/server/main.go`

**Change:** Wrap the router with `http.MaxBytesReader`:
```go
const maxBodyBytes = 1 << 20 // 1 MB

handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
    router.ServeHTTP(w, r)
})
```

Or add per-route limits on JSON endpoints only.

**Backward compatibility:** ✅ Any legitimate request under 1 MB is unaffected.

### Step 2.4 — Add Security Headers Middleware

**New file:** `services/battery-api/internal/middleware/security.go`

```go
func SecurityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("X-Content-Type-Options", "nosniff")
        w.Header().Set("X-Frame-Options", "DENY")
        w.Header().Set("X-XSS-Protection", "1; mode=block")
        w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
        w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
        next.ServeHTTP(w, r)
    })
}
```

**Wire it** in `cmd/server/main.go` as the outermost middleware.

**Note:** For local dev, HSTS can be disabled via env var. CSP is omitted for now because it requires auditing all inline scripts/styles.

**Backward compatibility:** ✅ Headers are additive; they don't break API contracts.

---

## Phase 3 — Compliance Engine Refactor (1 week)

### Step 3.1 — Database-Driven Rule Engine (v1)

**New migration:**
```sql
CREATE TABLE compliance_rules (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type  text NOT NULL,      -- 'battery', 'textile'
    market_region text NOT NULL,      -- 'india', 'eu', 'global'
    rule_key      text NOT NULL,      -- 'recycled_cobalt_min_pct'
    rule_type     text NOT NULL,      -- 'threshold', 'required_field', 'format_regex'
    threshold_value numeric,          -- for threshold rules
    error_message text NOT NULL,
    required      boolean NOT NULL DEFAULT true,
    effective_from timestamptz NOT NULL DEFAULT NOW(),
    effective_until timestamptz,      -- NULL means active indefinitely
    version       int NOT NULL DEFAULT 1,
    created_at    timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_compliance_rules_unique_active
ON compliance_rules(product_type, market_region, rule_key, version)
WHERE effective_until IS NULL;
```

**Seed script:** Insert rows that mirror current hard-coded constants from `compliance/battery/eu.go` and `india.go`.

**Repository:** New `repository/compliance_rules.go` with `GetActiveRules(ctx, product, market)`.

**Validator update:** In `compliance/battery/eu.go`, at the top of `Validate()`:
```go
rules, err := repo.GetActiveRules(ctx, "battery", "eu")
if err != nil || len(rules) == 0 {
    // fallback to hard-coded defaults (preserves backward compat)
    return defaultEUValidate(batch)
}
// apply DB rules
```

**Backward compatibility:** ✅ Fallback to hard-coded rules if DB table is empty or query fails.

### Step 3.2 — Hard Threshold Enforcement

**File:** `services/battery-api/internal/compliance/battery/eu.go`

**Change:** Replace soft warnings with actual validation failures for:
- Recycled cobalt < regulatory minimum
- Recycled lithium < regulatory minimum
- Recycled nickel < regulatory minimum

Use the new DB-driven rule values, but if DB is empty, fall back to the current constants cast as hard failures.

**Test:** Update `compliance/battery/eu_test.go` — assert `Result.IsValid == false` when thresholds are missed.

### Step 3.3 — Per-Market Scorecard

**File:** `services/battery-api/internal/compliance/score.go`

**Change:** Replace `Aggregate()` arithmetic mean with a structured response:
```go
type Scorecard struct {
    Overall    float64            `json:"overall"`
    PerMarket  map[string]MarketScore `json:"per_market"`
}
type MarketScore struct {
    Score float64   `json:"score"`
    Valid bool      `json:"valid"`
    Gaps  []string  `json:"gaps"`
}
```

**API contract:** Add `?format=scorecard` query param or a new field `scorecard` alongside existing `score` so old clients aren't broken.

**Backward compatibility:** ✅ Old `score` field remains present. New `scorecard` is additive.

---

## Phase 4 — Frontend Infrastructure (1 week)

### Step 4.1 — i18n Scaffold (`next-intl`)

**Install:**
```bash
cd apps/battery-web
npm install next-intl
```

**Files to create/modify:**
1. `apps/battery-web/messages/en.json` — extract top 20 dashboard strings (sidebar, batch list, actions)
2. `apps/battery-web/messages/de.json` — German translations (start with DeepL, mark as `draft`)
3. `apps/battery-web/i18n/config.ts` — locale config
4. `apps/battery-web/middleware.ts` — `next-intl` middleware with `localePrefix: 'as-needed'`
5. `apps/battery-web/app/layout.tsx` — wrap children with `NextIntlClientProvider`
6. `apps/battery-web/components/dashboard/sidebar.tsx` — replace hard-coded strings with `useTranslations()`

**Strategy:** Start with **sidebar + top navigation only**. Do NOT attempt to translate all 2,000+ strings in one go. Every subsequent PR can translate one page at a time.

**Backward compatibility:** ✅ `localePrefix: 'as-needed'` means `/` still serves English. No URL changes for existing users.

### Step 4.2 — CSV Bulk Batch Import

**Backend:**
- New endpoint: `POST /api/v1/batches/bulk-import`
- Handler: `services/battery-api/internal/handlers/bulk_handlers.go` (already exists — extend it)
- Accept multipart/form-data CSV
- Use `encoding/csv` to parse
- Map headers to `BatchSpec` fields via a column-mapping config
- Validate each row using existing `BatchSpec` validation
- Return:
  ```json
  {
    "total": 500,
    "created": 498,
    "failed": 2,
    "errors": [
      {"row": 47, "reason": "invalid chemistry: 'LiPoX'"},
      {"row": 203, "reason": "missing nominal_voltage"}
    ]
  }
  ```
- Wrap in a DB transaction — all-or-nothing per request, or chunk in batches of 100.

**Frontend:**
- New component: `apps/battery-web/components/batches/bulk-import-dialog.tsx`
- Upload CSV → show preview of first 5 rows → confirm → show progress → show result report
- Download template CSV with correct headers

**Test:**
- Backend: 500-row CSV import in < 5 seconds
- Backend: malformed CSV returns precise row-level errors
- Frontend: user can download template, upload, and see results

**Backward compatibility:** ✅ New endpoint + new dialog. Existing single-batch flow untouched.

---

## Phase 5 — Data Model Expansion (1 week)

### Step 5.1 — Nested Component / BOM Schema

**Decision:** Use JSONB column instead of rigid relational tables. Battery BOMs are hierarchical (pack → module → cell) with variable depth. JSONB is more flexible and faster to iterate on.

**Migration:**
```sql
ALTER TABLE batch_specs ADD COLUMN components jsonb DEFAULT '[]';
```

**Model update:** `services/battery-api/internal/models/models.go`
```go
type Component struct {
    ID              string  `json:"id"`
    Name            string  `json:"name"`            // "Cell Pack A"
    ComponentType   string  `json:"component_type"`  // "cell", "module", "pack"
    ParentID        *string `json:"parent_id,omitempty"`
    Chemistry       string  `json:"chemistry,omitempty"`
    RecycledCobalt  float64 `json:"recycled_cobalt_pct,omitempty"`
    RecycledLithium float64 `json:"recycled_lithium_pct,omitempty"`
    RecycledNickel  float64 `json:"recycled_nickel_pct,omitempty"`
    WeightKg        float64 `json:"weight_kg,omitempty"`
    Quantity        int     `json:"quantity,omitempty"`
    SupplierID      *string `json:"supplier_id,omitempty"`
}
```

**Validation:** Add a recursive validator that checks:
- All cells have chemistry declared
- Recycled content is reported at the cell level
- Parent IDs form a valid tree (no cycles)

**Frontend:**
- Add a "Components / BOM" step to the batch creation wizard
- Simple tree UI: add cell → add module → assign cells to module
- Can start with a flat list (cell entries only) for MVP

**Backward compatibility:** ✅ `components` is optional. Existing batches without it are still valid.

### Step 5.2 — W3C Verifiable Credentials Scaffold

This is a large feature. For now, scaffold the data model so future work can build on it.

**Migration:**
```sql
CREATE TABLE passport_vcs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id uuid NOT NULL REFERENCES passports(id),
    vc_type     text NOT NULL, -- 'BatteryPassportCredential'
    issuer_did  text NOT NULL,
    credential_subject jsonb NOT NULL,
    proof       jsonb NOT NULL, -- cryptographic proof
    created_at  timestamptz NOT NULL DEFAULT NOW()
);
```

**Handler stub:** `POST /api/v1/passports/{id}/vc` — generates a VC payload from passport data (no real signing yet).

**Backward compatibility:** ✅ New table, new endpoint. Nothing existing changes.

---

## Rollback Strategy (Per Phase)

| Phase | Rollback | Time to Rollback |
|-------|----------|-----------------|
| Phase 0 | `git reset --hard pre-remediation-baseline` | Instant |
| Phase 1 | Run `.down.sql` migration + revert repository commit | 5 min |
| Phase 2 | Revert handler/middleware commits | 2 min |
| Phase 3 | Delete seeded rules from DB; validators auto-fallback to hard-coded constants | 5 min |
| Phase 4 | Remove `next-intl` middleware; unmount bulk-import dialog | 10 min |
| Phase 5 | `ALTER TABLE batch_specs DROP COLUMN components; DROP TABLE passport_vcs;` | 2 min |

---

## Testing Checklist Before Each Push

- [ ] `go test ./...` passes in `services/battery-api`
- [ ] `npm run build` passes in `apps/battery-web`
- [ ] At least one integration test covers the new/changed endpoint
- [ ] Compliance scores for a known test batch match pre-remediation baseline (Phase 3 only)
- [ ] Passport deletion still returns 404, but events table retains rows (Phase 1 only)
- [ ] Auth login still works in browser (Phase 2 only)
- [ ] CSV bulk import succeeds with 500-row test file in < 5s (Phase 4 only)

---

## Recommended Sprint Schedule

| Week | Focus | Deliverable |
|------|-------|-------------|
| Week 1 | Phase 0 + Phase 1 + Phase 2 | Soft delete, cookie fix, headers, rate-limit fix, MaxBytesReader |
| Week 2 | Phase 3 | DB rule engine seeded, hard thresholds enforced, per-market scorecard |
| Week 3 | Phase 4 | `next-intl` scaffold (sidebar + nav), CSV bulk import backend + frontend |
| Week 4 | Phase 5 | BOM JSONB column, component validator, batch wizard step, VC table scaffold |

**Total: 4 weeks** to move from "Not Ready for Regulatory Submission" to "Minimum Viable Regulatory State."

---

## What We Are NOT Doing (Out of Scope)

- Asymmetric digital signatures on audit trails (P1 — important but not a regulatory blocker)
- Persistent event bus / Redis Streams (P1 — reliability improvement)
- GS1 Digital Link QR codes (P1 — interoperability)
- Supplier portal (P2)
- ERP connectors (P2)
- IoT / BMS protocols (P2)
- Data residency / GDPR endpoints (P2)
- Prometheus / OpenTelemetry (P2)

These can be tackled in a follow-up 8-week enterprise-hardening sprint.
