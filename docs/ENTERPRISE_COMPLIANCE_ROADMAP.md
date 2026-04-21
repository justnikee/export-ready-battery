# Enterprise Compliance Roadmap

**Created:** 2026-04-21  
**Status:** 🔴 IN PROGRESS — Gaps identified, implementation not started  
**Owner:** Engineering  
**Objective:** Close all remaining compliance gaps to reach enterprise-grade, GS1 EPCIS-aligned, regulator-defensible standard.

---

## Current Baseline (What's Already Done)

| Feature                                                        | Status  | Evidence in Code                                                                                 |
| -------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| Immutable audit log (append-only `passport_events`)            | ✅ Done | Migration `000027` — DB triggers block UPDATE/DELETE                                             |
| BLAKE2b cryptographic hash chain                               | ✅ Done | `lifecycle.go → VerifyPassportAuditChain`                                                        |
| Tamper detection endpoint                                      | ✅ Done | `GET /api/v1/passports/{id}/verify-chain`                                                        |
| Evidence enforcement for SHIP/INSTALL/RECYCLE/RECALL/**CLOSE** | ✅ Done | `models/evidence.go → evidenceRequirementsByAction` (`certificate_reference` required for CLOSE) |
| Role & actor enforcement on all transitions                    | ✅ Done | `lifecycle_handlers.go → buildActorContext`                                                      |
| Action-based state machine (not raw status mutation)           | ✅ Done | `services/lifecycle.go → ApplyTransition`                                                        |
| Outbound webhooks (event notifications to partners)            | ✅ Done | `services/outbound_webhook.go`, migration `000046`                                               |
| `geolocation_history JSONB` column on passports                | ✅ Done | Migration `000012` — column exists, not enforced                                                 |
| Audit CSV/PDF export                                           | ✅ Done | `audit_export_service.go`                                                                        |
| Three-layer data access (Public/Partner/Regulator)             | ✅ Done | `access_views.go`                                                                                |

---

## Gap Summary

| Gap                                                      | Priority  | Effort                                               |
| -------------------------------------------------------- | --------- | ---------------------------------------------------- |
| Reason code/document required for ALL manual transitions | 🔴 High   | Small — backend model + validation                   |
| Document upload API + hash storage in event metadata     | 🔴 High   | Medium — new file upload endpoint + S3/local storage |
| GPS/device metadata capture for INSTALL actions          | 🟡 Medium | Small backend, Medium frontend                       |
| GS1 EPCIS export endpoint                                | 🟡 Medium | Medium — mapping + new endpoint                      |
| Audit chain verification background job                  | 🟡 Medium | Small — cron worker                                  |
| UI: per-event attached proof viewer                      | 🟢 Low    | Medium — frontend only                               |
| Magic link hardening for high-value transitions          | 🟢 Low    | Small                                                |
| Batch-level bulk action from lifecycle table             | 🟢 Low    | Small backend + frontend                             |

---

## Step-by-Step Implementation Plan

---

### Phase 1 — Reason Codes for All Manual Transitions

**Goal:** Every manual admin/operator action must carry a reason code or note. Currently SHIP/INSTALL/RECYCLE/RECALL/CLOSE require evidence (CLOSE already requires `certificate_reference` in `evidenceRequirementsByAction`). Only ACTIVATE has no reason code requirement and is the gap to close.

**Why:** GS1 EPCIS `bizStep` + `disposition` require WHY, not just WHAT. Regulators need a paper trail for every discretionary action.

#### Step 1.1 — Backend: Add optional `reason_code` and `admin_note` to transition request model

**File:** `backend/internal/services/lifecycle.go`

Add to `TransitionRequest` struct:

```go
ReasonCode string `json:"reason_code,omitempty"` // e.g. "MANUAL_OVERRIDE", "BATCH_QC_PASS"
AdminNote  string `json:"admin_note,omitempty"`  // free-text, max 500 chars
```

Store both in `event.Metadata` when present.

#### Step 1.2 — Backend: Require reason_code for ACTIVATE when actor_role is ADMIN

**File:** `backend/internal/models/evidence.go`

Add a new validation function `ValidateReasonCode(action, actorRole, reasonCode)` that returns an error if the combination requires a reason code but none was provided. For the current gap, enforce: `action == ACTIVATE && actorRole == ADMIN && reasonCode == ""` → error. (CLOSE is already enforced by the existing `evidenceRequirementsByAction` requiring `certificate_reference`.)

#### Step 1.3 — Backend: Store reason_code in passport_events metadata

**File:** `backend/internal/services/lifecycle.go → ApplyTransition`

Before inserting the event, merge `reason_code` and `admin_note` into `event.Metadata` map.

#### Step 1.4 — Frontend: Show reason_code field in bulk action modal

**File:** `frontend/app/(dashboard)/lifecycle/page.tsx`

Add an optional "Reason / Note" `<textarea>` in the bulk action confirmation modal for ACTIVATE (required) and CLOSE (optional — CLOSE already requires a certificate reference via evidence). Pass the value through to the API request body.

**Acceptance criteria:**

- `POST /api/v1/passports/{id}/transition` with `action: ACTIVATE` by an ADMIN role without `reason_code` → `400 Bad Request` (CLOSE is already blocked by the existing `certificate_reference` evidence requirement)
- `reason_code` appears in `passport_events.metadata` for the event
- Bulk transitions pass the same reason_code to all events in the batch

---

### Phase 2 — Document Upload + Hash Attachment to Events

**Goal:** Allow attaching a file (BoL, Certificate of Destruction, inspection photo) to any lifecycle event. Hash the file and store the hash in `event.metadata.document_hash`. Optionally store the file itself.

**Why:** Full chain-of-custody requires cryptographic proof of physical documents. EU Battery Regulation Art. 10 requires traceability of recycling certificates.

#### Step 2.1 — Backend: New file upload endpoint

**New file:** `backend/internal/handlers/document_handlers.go`

```
POST /api/v1/documents/upload
  - Auth: JWT required
  - Content-Type: multipart/form-data
  - Body: file (max 10MB), passport_id (UUID), label (string)
  - Returns: { document_id, sha256_hash, filename, size_bytes, uploaded_at }
```

- Compute `SHA-256` of the file bytes server-side (never trust client-provided hash)
- **Security — MIME allowlist:** Detect content type by sniffing file bytes with `http.DetectContentType`, not the client `Content-Type` header. Allowlist: `application/pdf`, `image/jpeg`, `image/png`, `image/tiff`. Reject all others with `415 Unsupported Media Type`.
- **Security — filename sanitization:** Use `document_id` (UUID) as the storage filename, e.g. `{tenant_id}/{document_id}`. Never use the user-supplied `filename` in the storage path (prevents path traversal). The original `filename` is stored only in the `passport_documents` DB row.
- **Security — orphaned file cleanup:** If the DB insert fails after the file is written, delete the uploaded file before returning the error to prevent orphaned storage.
- Store file to local `/uploads/documents/{tenant_id}/{document_id}` or S3 key
- Insert a row into a new `passport_documents` table (Step 2.2)
- Return the hash to caller

#### Step 2.2 — Backend: New DB migration `000047_create_passport_documents.up.sql`

```sql
CREATE TABLE IF NOT EXISTS passport_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    passport_id     UUID NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
    event_id        UUID REFERENCES passport_events(id),  -- linked event (nullable until attached)
    filename        TEXT NOT NULL,
    content_type    TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL,
    sha256_hash     TEXT NOT NULL,
    storage_path    TEXT NOT NULL,  -- local path or S3 key
    label           TEXT,           -- e.g. "Bill of Lading", "Recycling Certificate"
    uploaded_by     TEXT NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passport_documents_passport_id ON passport_documents(passport_id);
CREATE INDEX IF NOT EXISTS idx_passport_documents_event_id ON passport_documents(event_id);
```

#### Step 2.3 — Backend: Link document to event at transition time

**File:** `backend/internal/handlers/lifecycle_handlers.go → TransitionPassport`

Accept optional `document_id` in the transition request body. After the event is created:

1. Validate `document_id` belongs to the same tenant and passport
2. `UPDATE passport_documents SET event_id = $1 WHERE id = $2`
3. Merge `{ "document_id": "...", "document_hash": "...", "document_label": "..." }` into `event.Metadata`

This way the document hash is baked into the immutable event record.

#### Step 2.4 — Backend: Download endpoint for attached documents

```
GET /api/v1/documents/{document_id}
  - Auth: JWT (tenant-scoped)
  - Returns: file stream with original Content-Type
```

#### Step 2.5 — Frontend: Document upload in transition modals

**File:** `frontend/app/(dashboard)/lifecycle/page.tsx`

In the SHIP, INSTALL, RECYCLE, RECALL action modals, add:

- A file picker input ("Attach supporting document — optional")
- On file select: call `POST /api/v1/documents/upload`, display the returned filename + hash preview
- Store returned `document_id` in component state
- Include `document_id` in the transition request body

**Acceptance criteria:**

- File uploads are rejected if > 10MB
- SHA-256 hash stored in DB matches a client-side recomputed hash on download
- `passport_events.metadata` contains `document_hash` for events with attachments
- The document can be retrieved via `GET /api/v1/documents/{id}` by any user in the same tenant

---

### Phase 3 — GPS / Device Metadata Capture for Field Actions

**Goal:** For INSTALL (and optionally SHIP), capture the actor's GPS coordinates and device fingerprint and store them in `event.metadata` and `passports.geolocation_history`.

**Why:** `geolocation_history JSONB` already exists (migration `000012`) but is never populated. GS1 EPCIS `readPoint` requires a physical location for custody transfer events.

#### Step 3.1 — Frontend: Request Geolocation API in transition modal

**File:** `frontend/app/(dashboard)/lifecycle/page.tsx`

When the selected action is `INSTALL` or `SHIP`, after the user clicks "Confirm":

1. Call `navigator.geolocation.getCurrentPosition(...)` before submitting
2. If permission granted: attach `{ lat, lng, accuracy }` to the request body
3. If denied: show a non-blocking warning ("Location not captured — audit record will note this") and proceed without it

#### Step 3.2 — Backend: Accept and store location in transition request

**File:** `backend/internal/services/lifecycle.go → TransitionRequest`

Add:

```go
Location *GeoPoint `json:"location,omitempty"`
```

```go
type GeoPoint struct {
    Lat      float64 `json:"lat"`
    Lng      float64 `json:"lng"`
    Accuracy float64 `json:"accuracy_meters"`
}
```

**File:** `backend/internal/services/lifecycle.go → ApplyTransition`

If `req.Location != nil`:

1. Merge `{ "lat": ..., "lng": ..., "accuracy_meters": ... }` into `event.Metadata`
2. Append `{ lat, lng, timestamp, actor }` to `passports.geolocation_history` JSONB array

> **GDPR Note:** GPS coordinates stored alongside actor identity and a timestamp constitute personal data under GDPR Art. 4(1). Ensure `geolocation_history` access is scoped to Regulator-tier only (enforced by the existing `access_views.go` three-layer model). Define a retention period for geolocation entries in the privacy policy. Do not store GPS data for OPERATOR-role actors without explicit consent.

#### ~~Step 3.3 — Backend: Reverse geocode to human-readable location~~ ⛔ CUT

> **Removed from scope.** `assets/GeoLite2-City.mmdb` is a MaxMind IP-address → city database. It **cannot** reverse-geocode GPS coordinates (lat/lng → city/country). This step is technically impossible as written.
>
> **Deferred enhancement:** If human-readable location names are needed in future, integrate [Nominatim](https://nominatim.openstreetmap.org/) (free, self-hostable) or a third-party geocoding API. For now, raw `lat`/`lng` in metadata is sufficient for EPCIS `readPoint`.

**Acceptance criteria:**

- INSTALL transition with location → `passport_events.metadata` has `lat`, `lng`
- `passports.geolocation_history` is appended with the new location entry
- Transition succeeds even if geolocation is not provided (location capture is best-effort for INSTALL, not a hard blocker)

---

### Phase 4 — GS1 EPCIS Export Endpoint

**Goal:** Provide a standards-compliant JSON-LD export of a passport's full event history in GS1 EPCIS 2.0 format. Required for interoperability with trade partners, customs systems, and EU DPP infrastructure.

**Why:** EU Battery Regulation and GS1 Digital Link mandate EPCIS-compatible event streams for supply chain handoffs.

#### Step 4.1 — Backend: EPCIS mapping layer

**New file:** `backend/internal/services/epcis_export.go`

Implement `BuildEPCISDocument(passportID, events []*PassportEvent) *EPCISDocument`

Map ExportReady fields → EPCIS 2.0 concepts:

| ExportReady field                             | EPCIS 2.0 field                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `passport_events.action`                      | `bizStep` (e.g. `urn:epcglobal:cbv:bizstep:commissioning`)                                                                                                                                                                                                               |
| `passport_events.status_from → status_to`     | `disposition`                                                                                                                                                                                                                                                            |
| `passport_events.actor`                       | `bizTransactionList` or `sourceList`                                                                                                                                                                                                                                     |
| `passport_events.actor_role`                  | `sourceList[type]`                                                                                                                                                                                                                                                       |
| `passport_events.created_at`                  | `eventTime`                                                                                                                                                                                                                                                              |
| `passport_events.ip_address`                  | `readPoint` (IP-based fallback)                                                                                                                                                                                                                                          |
| `passport_events.metadata.lat/lng`            | `readPoint` (preferred)                                                                                                                                                                                                                                                  |
| `passport_events.metadata.shipment_reference` | `bizTransactionList[urn:epcglobal:cbv:btt:bol]`                                                                                                                                                                                                                          |
| `passports.bpan`                              | EPC identifier: use `urn:epc:id:giai:{bpan}` (GIAI — Global Individual Asset Identifier) if `bpan` is not a GS1-registered GTIN. If a GS1 Company Prefix is available, prefer `urn:epc:id:sgtin:...` or GS1 Digital Link URI `https://id.gs1.org/01/{gtin}/21/{serial}`. |
| `(all events)`                                | Required `type` field: `ObjectEvent` for SHIP/INSTALL/RECALL/RECYCLE; `TransactionEvent` for ACTIVATE/CLOSE                                                                                                                                                              |
| `passports.bpan` (as EPC)                     | Required `epcList[0]` field in every `ObjectEvent`                                                                                                                                                                                                                       |
| `passport_events.hash`                        | `ilmd.auditHash` (extension)                                                                                                                                                                                                                                             |

#### Step 4.2 — Backend: New export endpoint

**File:** `backend/cmd/server/main.go` (register route)

```
GET /api/v1/passports/{id}/epcis
  - Auth: JWT or regulator key
  - Returns: application/ld+json, GS1 EPCIS 2.0 EventList
  - Query params: ?format=json-ld (default) | ?format=xml
```

> **JSON-LD context:** The response `@context` field must be set to the official GS1 URL: `https://ref.gs1.org/standards/epcis/epcis-context.jsonld`. Do not use a local copy — validators will reject non-canonical context URLs.

#### Step 4.3 — Frontend: "Export EPCIS" button in passport detail view

Add a download button in the passport detail page / audit tab that calls the EPCIS endpoint and downloads the file as `passport_{id}_epcis.jsonld`.

**Acceptance criteria:**

- EPCIS export validates against GS1 EPCIS 2.0 JSON-LD schema
- `@context` is exactly `https://ref.gs1.org/standards/epcis/epcis-context.jsonld`
- All events for the passport appear in chronological order
- Each event has a valid `type` field (`ObjectEvent` or `TransactionEvent`)
- Each `ObjectEvent` has a non-empty `epcList` containing the passport EPC identifier
- `bizStep` values are valid CBV (Core Business Vocabulary) URNs
- Hash field from the audit chain appears in `ilmd` extension block

---

### Phase 5 — Audit Chain Background Verification Job

**Goal:** Run a scheduled background job that verifies the BLAKE2b hash chain for all passports and alerts on any broken chain. Currently, chain verification only happens on-demand via the `/verify-chain` endpoint.

**Why:** A broken chain that goes undetected for weeks is worse than no chain. Automated monitoring is required for a regulator-defensible system.

#### Step 5.1 — Backend: Worker command for chain verification

**New file:** `backend/cmd/worker/verify_chains.go`

```go
// Runs as a scheduled job (e.g. nightly via cron or a ticker)
// 1. Fetches all distinct passport_ids from passport_events (paginated, 1000/batch)
// 2. Calls LifecycleService.VerifyPassportAuditChain for each
// 3. On failure: inserts a row into a new `audit_chain_alerts` table
//    — Skip insert if an unresolved alert already exists for this passport_id (deduplication:
//      SELECT 1 FROM audit_chain_alerts WHERE passport_id = $1 AND resolved_at IS NULL)
// 4. Logs summary: N checked, M failed
```

#### Step 5.2 — Backend: New DB migration `000048_create_audit_chain_alerts.up.sql`

```sql
CREATE TABLE IF NOT EXISTS audit_chain_alerts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    passport_id        UUID NOT NULL REFERENCES passports(id),
    detected_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_count        INTEGER NOT NULL,
    broken_at_event_id UUID REFERENCES passport_events(id),
    resolved_at        TIMESTAMPTZ,
    notes              TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_chain_alerts_passport_id ON audit_chain_alerts(passport_id);
CREATE INDEX IF NOT EXISTS idx_audit_chain_alerts_tenant_id   ON audit_chain_alerts(tenant_id);
```

> **Cleanup:** Add a scheduled cleanup (can run in the same worker ticker) to delete resolved alerts older than 90 days: `DELETE FROM audit_chain_alerts WHERE resolved_at IS NOT NULL AND resolved_at < NOW() - INTERVAL '90 days'`

#### Step 5.3 — Backend: Register verification job in worker

**File:** `backend/cmd/worker/main.go`

Register a ticker (every 6 hours or via cron expression) to call `VerifyAllChains()`. Alternatively wire it as a Go cron using `time.NewTicker`.

#### Step 5.4 — Optional: Admin dashboard alert banner

**File:** `frontend/app/(dashboard)/settings/page.tsx` or a global layout component

If `GET /api/v1/admin/audit-chain-alerts` returns any unresolved alerts, show a warning banner to ADMIN-role users.

**Acceptance criteria:**

- Worker runs without blocking the HTTP server
- A tampered event causes a chain alert row to be inserted within the next job cycle
- Alert is dismissed when the passport is re-verified after remediation
- Job logs a structured JSON summary per run

---

### Phase 6 — Per-Event Proof Viewer in Admin Dashboard

**Goal:** In the passport detail or lifecycle audit tab, show every attached document, GPS pin, and reason code inline with each event row.

**Why:** Auditors must be able to see and download proofs without leaving the dashboard.

#### Step 6.1 — Frontend: Fetch and display documents per event

**File:** `frontend/app/(dashboard)/passports/[id]/page.tsx` — ⚠️ **This file does not exist yet. Must be created**, not modified. Locate existing passport detail rendering logic before implementing.

- Add `GET /api/v1/passports/{id}/documents` endpoint (list all docs for a passport with their `event_id`)
- In the event timeline/table, show a paperclip icon for events that have an attached document
- Click → modal with: filename, label, SHA-256 hash, upload time, download button

#### Step 6.2 — Frontend: Show GPS location per event

For events that have `lat`/`lng` in metadata, show a location chip (e.g. "📍 48.8566°N 2.3522°E") next to the event row. Clicking it opens `https://www.openstreetmap.org/?mlat={lat}&mlon={lng}&zoom=13` in a new tab. Do not add a map embed library dependency — an outbound link is sufficient and avoids a third-party script.

#### Step 6.3 — Frontend: Show reason code per event

For events with `reason_code` in metadata, display it as a badge (e.g. `MANUAL_OVERRIDE`) inline in the event row.

#### Step 6.4 — Backend: Documents list endpoint

```
GET /api/v1/passports/{id}/documents
  - Auth: JWT (tenant-scoped)
  - Returns: [{ document_id, filename, label, sha256_hash, size_bytes, event_id, uploaded_at }]
```

---

### Phase 7 — Magic Link Security Hardening (for High-Value Actions)

**Goal:** Magic links (used for SHIP/INSTALL/RECYCLE by external partners) are single-use and action-bound, which is good. But for high-value transitions (RECYCLE, RECALL), add a second verification step.

**Why:** A stolen or leaked magic link URL currently gives complete authority to execute an irreversible action. RECALL especially needs stronger controls.

#### Step 7.1 — Backend: Add `requires_otp` flag to magic link model

**File:** `backend/internal/models/magic_link.go` (or equivalent)

For actions `RECYCLE` and `RECALL`, set `requires_otp = true` when generating the magic link. The recipient must also provide a 6-digit OTP (sent to their registered email) before the transition is accepted.

#### Step 7.2 — Backend: OTP generation and validation

- On magic link use attempt: if `requires_otp = true`, generate a 6-digit OTP, email it to the actor, and return `HTTP 202 Pending OTP`
- On OTP submission: validate within 10-minute window, then proceed with transition
- OTP is single-use and stored hashed (HMAC-SHA256) in a short-lived `magic_link_otp` table
- **Security — attempt limiting:** Track failed OTP attempts in the `magic_link_otp` row. After **5 failed attempts**, invalidate the OTP and set `used_at = NOW()` to prevent brute force. The user must request a new magic link.
- **Security — resend rate limiting:** Max **3 resend requests** per magic link token, with a **60-second cooldown** between resend attempts (store `last_resent_at` on the magic link row). Return `429 Too Many Requests` on violation.
- **Cleanup:** Add a scheduled job (can piggyback the worker ticker) to purge expired OTP rows: `DELETE FROM magic_link_otp WHERE created_at < NOW() - INTERVAL '30 minutes'`. Prevents unbounded table growth.

#### Step 7.3 — Frontend: OTP input step in magic link redemption flow

**File:** `frontend/app/magic/[token]/page.tsx` — ⚠️ **This file does not exist yet. Must be created**, not modified. The existing magic link UI is in `frontend/components/passport/request-magic-link-modal.tsx` (request side only). This page is the new redemption/landing page for recipients.

If the server returns `202 Pending OTP`, show an OTP input screen instead of auto-processing. On submit, send `POST /api/v1/magic-links/{token}/confirm-otp`.

**Acceptance criteria:**

- RECYCLE/RECALL via magic link requires OTP
- OTP expires after 10 minutes
- Used OTP cannot be replayed
- 5 consecutive wrong OTP attempts invalidate the OTP and require a new magic link
- OTP resend is rate-limited to max 3 per token, 60-second cooldown
- ACTIVATE/SHIP magic links are unaffected (single-step as before)

---

### Phase 8 — Batch-Level Bulk Action (Deferred Backend Feature)

**Goal:** Allow bulk lifecycle transitions filtered by `batch_id` without the frontend having to fetch all passport IDs first.

**Why:** Fetching 10,000+ passport IDs from the frontend just to re-send them to the backend is wasteful and brittle. A server-side `batch_id` filter is cleaner.

#### Step 8.1 — Backend: Add `batch_id` filter to BulkTransitionRequest

**File:** `backend/internal/handlers/lifecycle_handlers.go → BulkTransitionRequest`

```go
type BulkLifecycleTransitionRequest struct {
    PassportIDs []uuid.UUID  `json:"passport_ids,omitempty"`  // existing: explicit list
    BatchID     *uuid.UUID   `json:"batch_id,omitempty"`       // new: server-side filter
    Action      string       `json:"action"`
    Evidence    Evidence     `json:"evidence,omitempty"`
    ReasonCode  string       `json:"reason_code,omitempty"`
}
```

Validation: must provide either `passport_ids` OR `batch_id`, not both.

#### Step 8.2 — Backend: Repository method for batch-scoped ID fetch

**File:** `backend/internal/repository/passport.go`

Add `GetPassportIDsByBatch(ctx, batchID, tenantID) ([]uuid.UUID, error)` — returns all non-terminal passport IDs in the batch.

#### Step 8.3 — Frontend: Remove frontend fetch-all-IDs loop when batch context is known

**File:** `frontend/app/(dashboard)/lifecycle/page.tsx`

When `selectAllMode` is true AND there is an active `batchFilter`, pass `batch_id` directly instead of fetching all IDs. This removes the multi-page prefetch loop.

**Acceptance criteria:**

- `POST /api/v1/passports/bulk/transition` with `batch_id` activates all passports in that batch in one request
- Still respects the 500-per-DB-transaction limit internally
- Returns same `{ succeeded, failed, errors[] }` response shape

---

## Implementation Order (Recommended)

| Priority | Phase                            | Reason                                                         |
| -------- | -------------------------------- | -------------------------------------------------------------- |
| 1        | Phase 1 — Reason codes           | Smallest change, highest compliance value, no new infra needed |
| 2        | Phase 5 — Chain verification job | Protects existing investment in BLAKE2b chain                  |
| 3        | Phase 2 — Document upload        | Required for RECYCLE certificate compliance (EU Art. 10)       |
| 4        | Phase 3 — GPS capture            | Completes the geolocation infrastructure already in the schema |
| 5        | Phase 8 — Batch bulk action      | Developer experience + performance                             |
| 6        | Phase 4 — EPCIS export           | Required before EU 2027 mandate, good to ship early            |
| 7        | Phase 6 — Proof viewer UI        | Useful for auditors, frontend-only work                        |
| 8        | Phase 7 — Magic link OTP         | Hardening, lower urgency than the above                        |

---

## File Index (Files to Create or Modify)

### New Files

| File                                                                       | Phase |
| -------------------------------------------------------------------------- | ----- |
| `backend/internal/handlers/document_handlers.go`                           | 2     |
| `backend/internal/services/epcis_export.go`                                | 4     |
| `backend/cmd/worker/verify_chains.go`                                      | 5     |
| `backend/internal/db/migrations/000047_create_passport_documents.up.sql`   | 2     |
| `backend/internal/db/migrations/000047_create_passport_documents.down.sql` | 2     |
| `backend/internal/db/migrations/000048_create_audit_chain_alerts.up.sql`   | 5     |
| `backend/internal/db/migrations/000048_create_audit_chain_alerts.down.sql` | 5     |
| `frontend/app/(dashboard)/passports/[id]/page.tsx`                         | 6     |
| `frontend/app/magic/[token]/page.tsx`                                      | 7     |

### Modified Files

| File                                               | Phase      | Change                                                                              |
| -------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `backend/internal/services/lifecycle.go`           | 1, 3       | Add `ReasonCode`, `AdminNote`, `Location` to `TransitionRequest`; store in metadata |
| `backend/internal/models/evidence.go`              | 1          | Add `ValidateReasonCode()` function                                                 |
| `backend/internal/handlers/lifecycle_handlers.go`  | 1, 2, 3    | Parse new fields; link document to event                                            |
| `backend/cmd/server/main.go`                       | 2, 4, 5, 6 | Register new routes                                                                 |
| `backend/cmd/worker/main.go`                       | 5          | Register chain verification ticker                                                  |
| `frontend/app/(dashboard)/lifecycle/page.tsx`      | 1, 3, 8    | Reason code textarea; GPS capture; batch_id bulk                                    |
| `frontend/app/(dashboard)/passports/[id]/page.tsx` | 6          | **CREATE** — does not exist; passport detail/audit tab with proof viewer            |
| `frontend/app/magic/[token]/page.tsx`              | 7          | **CREATE** — does not exist; magic link redemption page with OTP step               |

---

## Definition of Done

A phase is considered **complete** when:

1. Backend changes compile and all existing tests pass (`go test ./...`)
2. New behaviour is covered by at least one unit test
3. OpenAPI spec (`backend/api/openapi.yaml`) is updated to reflect new request/response shapes
4. Frontend TypeScript compiles with no new errors (`tsc --noEmit`)
5. The change is manually verified against the test plan in `docs/MANUAL_TEST_PLAN.md`
