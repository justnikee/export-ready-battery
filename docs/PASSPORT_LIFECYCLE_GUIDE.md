# ExportReady Passport Lifecycle - Complete Implementation Guide

Last Updated: 2026-02-08  
Purpose: Comprehensive reference for Phases 1-6 lifecycle enforcement  
Audience: Developers, Integrators, Compliance Officers

---

## Table of Contents

1. Overview
2. Passport Lifecycle States
3. Transition Actions
4. Evidence Requirements
5. Role-Based Access Control
6. Magic Link Security
7. API Reference
8. Breaking Changes
9. Verification and Testing
10. Troubleshooting

---

## Overview

The ExportReady Battery Passport system implements a compliance-first lifecycle model across six phases:

| Phase | Name                       | Purpose                        |
| ----- | -------------------------- | ------------------------------ |
| 1     | State Model Lockdown       | Canonical status enforcement   |
| 2     | Action-Based Transitions   | Intent-driven state changes    |
| 3     | Role and Actor Enforcement | Authorization validation       |
| 4     | Audit Events               | Immutable compliance trail     |
| 5     | Evidence Enforcement       | Proof requirements for actions |
| 6     | Magic-Link Security        | External actor controls        |

Design principle: every lifecycle transition must have a valid action, authorized actor, required evidence (when applicable), and immutable audit event.

---

## Passport Lifecycle States

Canonical states:

```
CREATED -> ACTIVE -> SHIPPED -> IN_SERVICE -> RECYCLED -> END_OF_LIFE
                                    |
                                 RECALLED (interrupt)
```

### State Descriptions

| State       | Description                                            |
| ----------- | ------------------------------------------------------ |
| CREATED     | Passport generated, not yet activated                  |
| ACTIVE      | Battery in manufacturer possession, ready for shipment |
| SHIPPED     | Battery left factory                                   |
| IN_SERVICE  | Installed and operational                              |
| RECALLED    | Removed from service for safety/compliance             |
| RECYCLED    | Processed by authorized recycler                       |
| END_OF_LIFE | Lifecycle closed                                       |

### Forbidden States

The following legacy statuses are rejected:

- RETURN_REQUESTED
- RETURNED
- IN_USE

---

## Transition Actions

Action to state mapping:

| Action   | From States                 | To State    |
| -------- | --------------------------- | ----------- |
| ACTIVATE | CREATED                     | ACTIVE      |
| SHIP     | ACTIVE                      | SHIPPED     |
| INSTALL  | SHIPPED                     | IN_SERVICE  |
| RECYCLE  | IN_SERVICE, RECALLED        | RECYCLED    |
| CLOSE    | RECYCLED, RECALLED          | END_OF_LIFE |
| RECALL   | ACTIVE, SHIPPED, IN_SERVICE | RECALLED    |

Direct status mutation is forbidden. All changes use action-based intent.

---

## Evidence Requirements

Mandatory evidence by action:

| Action   | Required Fields                                        |
| -------- | ------------------------------------------------------ |
| SHIP     | shipment_reference, shipment_date                      |
| INSTALL  | installation_date, installer_id                        |
| RECYCLE  | recycler_epr_id, recycling_date, certificate_reference |
| RECALL   | recall_reason, recall_reference                        |
| ACTIVATE | None                                                   |
| CLOSE    | None                                                   |

Evidence rules:

1. Missing evidence for required actions fails with HTTP 400.
2. Dates must be YYYY-MM-DD or RFC3339.
3. Unknown evidence keys are rejected.
4. Evidence is embedded in audit events and cannot be edited.

---

## Role-Based Access Control

Canonical roles:

| Role              | Description                           |
| ----------------- | ------------------------------------- |
| SYSTEM            | Automated processes                   |
| INTERNAL_OPERATOR | Company staff (logistics, production) |
| LOGISTICS         | External logistics partners           |
| TECHNICIAN        | Installation technicians              |
| RECYCLER          | Authorized recycling partners         |
| ADMIN             | Platform administrators               |

Action to role matrix:

| Action   | Allowed Roles                |
| -------- | ---------------------------- |
| ACTIVATE | SYSTEM                       |
| SHIP     | INTERNAL_OPERATOR, LOGISTICS |
| INSTALL  | TECHNICIAN                   |
| RECYCLE  | RECYCLER                     |
| CLOSE    | SYSTEM                       |
| RECALL   | ADMIN                        |

Unauthorized attempts return HTTP 403.

Actor context is mandatory and derived server-side:

```json
{
  "actor_type": "USER" | "PARTNER" | "SYSTEM",
  "actor_id": "user@example.com",
  "actor_role": "INTERNAL_OPERATOR",
  "source": "INTERNAL" | "MAGIC_LINK"
}
```

---

## Magic Link Security

Magic links provide temporary authority for external partners. Tokens are:

- Single-use
- Action-bound
- Role-bound
- Time-limited

Validation order:

1. Token exists
2. Token not used
3. Token not expired
4. Action matches
5. Role matches

---

## API Reference

### Transition Passport (Internal)

```
POST /api/v1/passports/{uuid}/transition
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "action": "SHIP",
  "evidence": {
    "shipment_reference": "DHL-2026-001",
    "shipment_date": "2026-02-08"
  }
}
```

Response 200:

```json
{
  "success": true,
  "previous_status": "ACTIVE",
  "new_status": "SHIPPED",
  "action": "SHIP",
  "event_id": "uuid"
}
```

### Bulk Transition

```
POST /api/v1/passports/bulk/transition
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "passport_ids": ["uuid1", "uuid2"],
  "action": "INSTALL",
  "evidence": {
    "installation_date": "2026-02-08",
    "installer_id": "TECH-4431"
  }
}
```

### Magic Link Transition

```
POST /api/v1/passport/{uuid}/transition
Authorization: Bearer <magic-link-token>
Content-Type: application/json

{
  "action": "SHIP",
  "evidence": { ... }
}
```

### Get Allowed Actions

```
GET /api/v1/passports/{uuid}/transitions
Authorization: Bearer <jwt>

Response 200:
{
  "current_status": "ACTIVE",
  "allowed_actions": ["SHIP", "RECALL"]
}
```

### Get Passport Events (Audit Trail)

```
GET /api/v1/passports/{uuid}/events
Authorization: Bearer <jwt>

Response 200:
{
  "events": [
    {
      "event_type": "STATUS_CHANGED",
      "action": "ACTIVATE",
      "actor_role": "SYSTEM",
      "status_from": "CREATED",
      "status_to": "ACTIVE",
      "metadata": { "evidence": { ... } }
    }
  ]
}
```

---

## Breaking Changes

| Change             | Old Behavior       | New Behavior  | Error |
| ------------------ | ------------------ | ------------- | ----- |
| Status mutations   | to_status accepted | Rejected      | 400   |
| Missing evidence   | Allowed            | Rejected      | 400   |
| Forbidden statuses | Some allowed       | DB constraint | 400   |
| Magic link reuse   | Possible           | Rejected      | 401   |
| Event modification | Allowed            | Trigger fails | 500   |

Migration notes:

1. Update API calls to use action + evidence.
2. Regenerate magic links with action binding.
3. Remove any code that modifies passport_events.
4. Run migrations before deploying new code.

---

## Verification and Testing

```powershell
cd d:\ExportReady-Battery\backend
go test ./internal/handlers/... ./internal/services/... -v
```

Key test cases:

- Reject to_status
- Missing evidence
- Forbidden role
- Token reuse/action mismatch

---

## Troubleshooting

HTTP 400: "action is required"

- Cause: Request sent to_status instead of action.
- Fix: Use action-based API format.

HTTP 400: "evidence is required for action SHIP"

- Cause: Missing mandatory evidence fields.
- Fix: Provide all required evidence fields.

HTTP 403: "role not authorized for action"

- Cause: Role not permitted for that action.
- Fix: Verify team role assignment.

HTTP 401: "magic link token invalid"

- Cause: Token reused, expired, or mismatched.
- Fix: Generate a new magic link token.

DB error: "violates check constraint passports_status_check"

- Cause: Attempting to set forbidden status.
- Fix: Use canonical status values only.

DB error: "passport_events are immutable"

- Cause: UPDATE or DELETE on audit events.
- Fix: Remove mutation code; events are append-only.

---

## Related Documents

- `design_system.md`
- `docs/PASSPORT_LIFECYCLE_TESTING.md`
- `docs/codex_status.md`
