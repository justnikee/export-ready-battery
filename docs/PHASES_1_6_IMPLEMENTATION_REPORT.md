# ExportReady Passport Lifecycle - Phases 1-6 Implementation Report
Last updated: 2026-02-08

This report summarizes all changes implemented across Phases 1-6 (state model lockdown through evidence and magic-link hardening). It is intended to be a single, regulator-defensible record of what was done, what changed in models and APIs, and what can break if clients or data do not comply.

---

## Scope

- Phases 1-6 lifecycle enforcement (backend, DB, API, frontend).
- Migration hygiene changes that affect replayability or schema stability.

Authoritative sources:
- `design_system.md`
- `how_pass_transition_should_be.md`

---

## Phase 1 - State Model Lockdown

Canonical statuses enforced:
`CREATED -> ACTIVE -> SHIPPED -> IN_SERVICE -> RECYCLED -> END_OF_LIFE`, with interrupt state `RECALLED`.

Key changes:
- Removed/forbidden lifecycle states in code and DB constraints: `RETURN_REQUESTED`, `RETURNED`, `IN_USE`.
- Canonical lifecycle constraints applied to `passports.status`.
- Legacy status normalization in migration to map non-canonical values to safe canonical states.
- OpenAPI and frontend constants aligned to canonical status set.

DB changes:
- `000026_passport_state_lockdown.up.sql`:
  - Normalizes legacy statuses in `passports` and `passport_events`.
  - Enforces canonical `passports.status` check constraint.
- `000012_enterprise_lifecycle.up.sql` and `.down.sql` updated:
  - Removes `RETURN_REQUESTED`/`RETURNED` from constraints and comments.
  - Updates `lifecycle_timestamps` comment to canonical semantics.
- `000004_add_dual_mode.up.sql` adjusted to use `NOT VALID` constraint (avoid breaking legacy rows).

Breaking behavior:
- Any request or DB write using forbidden statuses is rejected.
- Old status aliases are no longer accepted by API or DB constraints.

---

## Phase 2 - Action-Based Transitions

Canonical actions:
`ACTIVATE`, `SHIP`, `INSTALL`, `RECYCLE`, `CLOSE`, `RECALL`

Key changes:
- Introduced `TransitionAction` enum and canonical action -> state mapping.
- All transitions now happen via action intent, not direct status mutation.
- `ApplyTransition` computes next state and validates action against current state.
- Bulk transitions reuse the same validation path.

API changes:
- Transition endpoints accept `action` (not `to_status` or `setStatus`).
- Requests containing a status field are rejected (HTTP 400).

Breaking behavior:
- Clients that send `to_status` or attempt direct state mutation will now fail.

---

## Phase 3 - Role and Actor Enforcement

Required ActorContext:
`ActorType`, `ActorID`, `ActorRole`, `Source` are mandatory.

Allowed roles (canonical):
`SYSTEM`, `INTERNAL_OPERATOR`, `LOGISTICS`, `TECHNICIAN`, `RECYCLER`, `ADMIN`

Action -> Role matrix (enforced):
| Action   | Allowed Roles |
| --- | --- |
| ACTIVATE | SYSTEM |
| SHIP     | INTERNAL_OPERATOR, LOGISTICS |
| INSTALL  | TECHNICIAN |
| RECYCLE  | RECYCLER |
| CLOSE    | SYSTEM |
| RECALL   | ADMIN |

Key changes:
- Actor context validation is required before any action/state validation.
- Role validation is enforced server-side; frontend cannot supply roles.
- Magic-link actions derive actor role from token payload, not request body.

Breaking behavior:
- Any missing/invalid ActorContext fails (401/403/409 depending on handler).
- Any role/action mismatch is rejected.

---

## Phase 4 - Audit Events as Hard Dependency

Hard rule enforced:
No audit event = no transition.

Key changes:
- Lifecycle transitions require an audit event and persist it before state change.
- Event + state update are committed in a single transaction.
- Audit events are immutable (no update/delete).

DB changes:
- `000027_audit_events_hard_dependency.up.sql`:
  - Adds `action` and `actor_role` to `passport_events`.
  - Adds constraints for allowed actions and roles.
  - Enforces required `action` + `actor_role` for lifecycle event types (`NOT VALID` to preserve legacy rows).
  - Adds triggers to prevent update/delete of `passport_events`.

Breaking behavior:
- Any write that attempts to mutate `passport_events` will fail.
- Lifecycle transitions without a valid audit event fail.

Note:
- Genesis events are still best-effort (Phase 4.1 optional hardening not yet enforced).

---

## Phase 5 - Evidence Enforcement

Mandatory evidence fields:
| Action | Required Evidence |
| --- | --- |
| SHIP | shipment_reference, shipment_date |
| INSTALL | installation_date, installer_id |
| RECYCLE | recycler_epr_id, recycling_date, certificate_reference |
| RECALL | recall_reason, recall_reference |

Key changes:
- Added `models.Evidence` and strict validator in `backend/internal/models/evidence.go`.
- Evidence is validated before event creation.
- Evidence is embedded into event metadata (`metadata.evidence`).
- Evidence dates accept `YYYY-MM-DD` or RFC3339 and are normalized to RFC3339.
- Evidence dates update lifecycle timestamps when provided.
- Evidence is not allowed for actions that do not require it (ACTIVATE, CLOSE).

API changes:
- Transition requests now use `evidence` field.
- `metadata` input removed from transition requests.

Frontend changes:
- Evidence fields added to action forms.
- UI no longer sends status; it sends `action + evidence`.

Breaking behavior:
- Any missing or malformed evidence causes transition rejection (HTTP 400).
- Extra/unknown evidence fields are rejected.
- Clients still sending `metadata` will fail.

---

## Phase 6 - Magic-Link Security Hardening

Rules enforced:
- Magic links are single-use, action-bound, role-bound, time-limited.

DB changes:
- `000028_magic_link_hardening.up.sql`:
  - Adds `action` to `magic_link_tokens`.
  - Adds `token_hash` index for validation.

Key changes:
- Magic-link requests validate:
  - token exists
  - token not used
  - token not expired
  - action matches token action
  - role comes from token (not request body)
- Token usage is marked inside the same transaction as the lifecycle transition.
- Reuse or mismatch returns `ErrMagicLinkTokenInvalid` and fails transition.

Breaking behavior:
- Tokens without an action (legacy) are invalid.
- Reused or mismatched tokens fail.

---

## Model and Schema Changes (Summary)

New/modified Go models:
- `TransitionAction` enum and canonical transition map.
- `ActorType`, `ActorRole`, `ActorContext` enforced as required fields.
- `Evidence` type + validation in `backend/internal/models/evidence.go`.
- `TransitionPersistence` includes `MagicLinkTokenHash`.
- New errors: `ErrInvalidEvidence`, `ErrMagicLinkTokenInvalid`.

New/modified database schema:
- `passport_events`:
  - `action`, `actor_role` columns + constraints.
  - Immutable via update/delete triggers.
- `passports.status` canonical lifecycle constraint.
- `magic_link_tokens.action` + `token_hash` index.
- Export job enums made idempotent:
  - `000020_create_export_jobs.up.sql` now guards enum creation.

---

## API / OpenAPI Contract Changes

- Transition endpoints accept:
  ```json
  { "action": "SHIP", "evidence": { ... }, "actor_context": { ... } }
  ```
- `to_status` / direct status mutation is rejected.
- `evidence` required for SHIP/INSTALL/RECYCLE/RECALL.
- OpenAPI includes `TransitionEvidence` schema and canonical enums.

---

## Frontend Changes (Lifecycle-Critical)

- Action UI uses `action + evidence`, no direct status changes.
- Evidence inputs added for SHIP/INSTALL/RECYCLE/RECALL.
- Transition requests align with `TransitionEvidence` API schema.

---

## Migration Hygiene and Operational Changes

New baseline migration:
- `000001_initial_schema` added to make a clean replayable baseline.

Replay-all migrator guarded:
- `cmd/migrate` now refuses to run unless `ALLOW_REPLAY_MIGRATIONS=true`.
- Default path is `make migrate-up` (golang-migrate).

Idempotency fixes:
- `000020_create_export_jobs` now uses guarded enum creation to avoid partial-schema failures.
- `000014_add_performance_indexes` handles either `quota_transactions` or `transactions`.

Breaking behavior:
- Legacy DBs with forbidden statuses will be normalized and constrained.
- `cmd/migrate` now hard-fails without the override flag.
- Any system relying on update/delete of `passport_events` will fail.

---

## Tests Added / Updated

- Evidence validation tests (`lifecycle_evidence_test.go`).
- Magic-link handler tests (`magic_link_handlers_test.go`).
- Role enforcement tests (`lifecycle_role_test.go`).
- Lifecycle handler tests updated for action + evidence requests.

---

## Known Optional / Deferred Items

- Genesis event hardening (Phase 4.1) is not yet enforced. Creation events remain best-effort; lifecycle transitions are fully hard-fail.
- `codex_status.md` lists remaining non-phase items (passport manufacturing window fields, UI surfacing) that are not part of Phases 1-6.

---

## Summary of Breaking Changes

- Status mutations from clients are rejected.
- Forbidden statuses rejected in code and DB.
- Actor context is mandatory for transitions.
- Role/action mismatches are rejected.
- Evidence is required for SHIP/INSTALL/RECYCLE/RECALL, and invalid evidence fails fast.
- Magic links are single-use and action-bound; legacy tokens may fail.
- Audit events are immutable; any update/delete on `passport_events` fails.

