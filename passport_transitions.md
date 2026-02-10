# Passport Lifecycle Actions (Canonical)

This document describes the **action-based** lifecycle transition contract and how the UI should call it.
It is aligned with `how_pass_transition_should_be.md` and the Phase 1–6 implementation.

---

## Backend Is the Source of Truth

Clients **never** set status directly. They send `action` (and evidence if required).

Any request containing `status`, `to_status`, or `metadata` is rejected.

---

## Canonical Statuses

```
CREATED -> ACTIVE -> SHIPPED -> IN_SERVICE -> RECYCLED -> END_OF_LIFE
```

Interrupt state:
```
RECALLED
```

---

## Canonical Actions

| Action   | Allowed From                  | To State     |
| --- | --- | --- |
| ACTIVATE | CREATED                       | ACTIVE       |
| SHIP     | ACTIVE                        | SHIPPED      |
| INSTALL  | SHIPPED                       | IN_SERVICE   |
| RECYCLE  | IN_SERVICE                    | RECYCLED     |
| CLOSE    | RECYCLED                      | END_OF_LIFE  |
| RECALL   | ACTIVE, SHIPPED, IN_SERVICE   | RECALLED     |

---

## Evidence Requirements

| Action  | Required Evidence Fields |
| --- | --- |
| SHIP    | shipment_reference, shipment_date |
| INSTALL | installation_date, installer_id |
| RECYCLE | recycler_epr_id, recycling_date, certificate_reference |
| RECALL  | recall_reason, recall_reference |

Evidence is **not** allowed for ACTIVATE or CLOSE.

---

## API Endpoints

1. `POST /api/v1/passports/{uuid}/transition`
2. `POST /api/v1/passports/bulk/transition`
3. `GET /api/v1/passports/{uuid}/transitions` (allowed actions)

---

## Example Requests

### Single Action (Internal User)
```
POST /api/v1/passports/{uuid}/transition
{
  "action": "SHIP",
  "evidence": {
    "shipment_reference": "INV-2026-001",
    "shipment_date": "2026-02-08"
  }
}
```

### Bulk Action
```
POST /api/v1/passports/bulk/transition
{
  "passport_ids": ["uuid1", "uuid2"],
  "action": "INSTALL",
  "evidence": {
    "installation_date": "2026-02-08",
    "installer_id": "TECH-4431"
  }
}
```

Notes:
- Actor context is derived server-side from authenticated user role.
- Status mutation from the client is always rejected.

---

## Frontend Guidance

**Dispatch Dashboard** (`frontend/app/(dashboard)/dashboard/dispatch/page.tsx`)
- Flow:
  1. If status is CREATED, call `ACTIVATE` first.
  2. Call `SHIP` with required evidence.

**Passport View**
- Read-only. Never attempts status mutation.

---

## Audit Behavior (Hard Dependency)

Every transition writes an immutable audit event and updates the passport state in the same DB transaction.

If event persistence fails, the transition fails.

