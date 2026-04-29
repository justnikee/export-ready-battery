# ExportReady Battery - Change Status (Codex)

Last updated: 2026-02-08

This file tracks what has been implemented vs. what remains, based on `design_system.md` and the lifecycle enforcement phases.

---

## Completed (Phases 1–6)

### Lifecycle Enforcement (Backend)

- Canonical lifecycle states enforced (CREATED -> ACTIVE -> SHIPPED -> IN_SERVICE -> RECYCLED -> END_OF_LIFE, with RECALLED).
- Action-based transitions only; no status mutation from clients.
- Actor context required; role enforcement matrix applied.
- Audit events are mandatory and immutable (event + state atomic).
- Evidence validation enforced for SHIP/INSTALL/RECYCLE/RECALL.
- Magic links are single-use, action-bound, role-bound, time-limited.

### Database / Migrations

- Added baseline migration `000001_initial_schema`.
- Canonical lifecycle constraints applied and legacy status normalization added.
- `passport_events` now stores `action` and `actor_role`; immutability triggers added.
- Magic link tokens include `action` and index on `token_hash`.
- `cmd/migrate` now guarded by `ALLOW_REPLAY_MIGRATIONS=true`.
- Enum creation in `000020_create_export_jobs` made idempotent.
- `000014_add_performance_indexes` handles `transactions` or `quota_transactions`.

### API / OpenAPI

- Transition requests accept `action` + `evidence`.
- Status or metadata in requests is rejected.
- Evidence schema documented in OpenAPI.

### Frontend

- Lifecycle transition UI sends `action + evidence`.
- Evidence inputs added for SHIP/INSTALL/RECYCLE/RECALL.
- No status mutation from frontend.

### Tests

- Lifecycle evidence tests added.
- Magic link handler tests added.
- Role enforcement tests updated.
- Lifecycle handler tests updated for action + evidence.

---

## Documentation Updates

- `docs/archived/PHASES_1_6_IMPLEMENTATION_REPORT.md` (historical phase-by-phase report).
- `docs/PASSPORT_LIFECYCLE_TESTING.md` (current manual lifecycle verification guide).
- `design_system.md` updated with implementation status reference.
- `how_pass_transition_should_be.md` and `passport_transitions.md` refreshed to match action/evidence/role enforcement.

---

## Pending / To Verify (Non-Phase)

### Backend

- Complete `PassportWithSpecs` additions:
  - `model_name`, `manufacturing_start_date`, `manufacturing_end_date`
- Update `GetPassportWithSpecs` SELECT/scan for those fields.
- Re-scan for any remaining calls to old `CreateLifecycleEvents` signature.
- Verify all passport creation flows set `CurrentOwnerIdentifier` + `OwnershipHistory`.

### Frontend

- If required by `design_system.md`, surface `model_name` and manufacturing window in certificate view.
- Re-check any missing-field UI fallbacks/labels once backend wiring is done.

### Optional (Phase 4.1)

- Genesis event hardening: make passport creation transactional with audit events.

---

## Notes

- Authoritative migration path: `backend/internal/db/migrations`.
- Migration replay is guarded; use `make migrate-up` for normal operation.
- Lifecycle compliance is locked in Phases 1–6; any deviation is a compliance defect.
