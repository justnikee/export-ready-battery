# Passport Lifecycle Tracking & Fraud Prevention

This document defines the authoritative lifecycle enforcement model for ExportLens battery passports.
It is written as a regulator-defensible specification, not a UI guideline.

---

## Purpose

Lifecycle tracking ensures that:
- No passport can be fraudulently modified.
- No lifecycle event can be performed by an unauthorized actor.
- Every state change is attributable, timestamped, and auditable.
- Lifecycle history can withstand regulatory, customs, or legal scrutiny.

This system treats lifecycle history as evidence, not application state.

---

## Core Principle (Non-Negotiable)

Users request actions. The system decides state. Events record truth.

No client may directly set or edit a passport status.

---

## Canonical Passport Lifecycle (Locked)

Valid states:

```
CREATED -> ACTIVE -> SHIPPED -> IN_SERVICE -> RECYCLED -> END_OF_LIFE
```

Interrupt state:

```
RECALLED
```

Rules:
- RECALLED may be entered only from ACTIVE, SHIPPED, or IN_SERVICE.
- RECALLED must eventually transition to RECYCLED or END_OF_LIFE.
- No other states are permitted.

---

## Transition Model (Action-Based Only)

Actions represent real-world events. Clients send intent; backend computes the next state.

Canonical actions:

| Action   | Allowed From                  | To State     |
| --- | --- | --- |
| ACTIVATE | CREATED                       | ACTIVE       |
| SHIP     | ACTIVE                        | SHIPPED      |
| INSTALL  | SHIPPED                       | IN_SERVICE   |
| RECYCLE  | IN_SERVICE                    | RECYCLED     |
| CLOSE    | RECYCLED                      | END_OF_LIFE  |
| RECALL   | ACTIVE, SHIPPED, IN_SERVICE   | RECALLED     |

Forbidden patterns:
- Status mutation from client (status or to_status).
- Skipping lifecycle steps.
- Reverting states.
- Conditional graphs based on user type or market.

---

## Role Enforcement (Mandatory)

ActorContext is mandatory for every action:
`ActorType`, `ActorID`, `ActorRole`, `Source`.

Allowed ActorTypes:
`SYSTEM`, `USER`, `PARTNER`

Allowed ActorRoles:
`SYSTEM`, `INTERNAL_OPERATOR`, `LOGISTICS`, `TECHNICIAN`, `RECYCLER`, `ADMIN`

Action -> Role matrix:

| Action   | Allowed Roles |
| --- | --- |
| ACTIVATE | SYSTEM |
| SHIP     | INTERNAL_OPERATOR, LOGISTICS |
| INSTALL  | TECHNICIAN |
| RECYCLE  | RECYCLER |
| CLOSE    | SYSTEM |
| RECALL   | ADMIN |

No role = no action. Missing or inferred roles are rejected.

---

## Evidence Requirements (Mandatory for Sensitive Actions)

Evidence is action-specific and validated before audit event creation.

| Action  | Required Evidence Fields |
| --- | --- |
| SHIP    | shipment_reference, shipment_date |
| INSTALL | installation_date, installer_id |
| RECYCLE | recycler_epr_id, recycling_date, certificate_reference |
| RECALL  | recall_reason, recall_reference |

Evidence is not allowed for ACTIVATE or CLOSE.

Missing or malformed evidence -> transition fails.

---

## Magic Link Security (External Actors)

Magic links are temporary authority and must be:
- Single-use
- Action-bound
- Role-bound
- Time-limited

External actors do not choose actions. The token defines the action and role.

---

## Audit Events (Hard Dependency)

Every transition must write an immutable audit event. If the event cannot be written, the transition must fail.

Event rules:
- Append-only (no update/delete).
- Captures action, actor role, and evidence.
- Event + state update occur in a single DB transaction.

---

## Example Request (Internal)

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

Notes:
- Actor context is derived server-side from authentication.
- Clients must not send status fields or metadata.

---

## Final Rule (Absolute)

If a lifecycle action cannot survive regulatory questioning, it must not be allowed by the system.

