# Passport Lifecycle Manual Testing Guide

This document provides a comprehensive guide for manually testing the passport lifecycle system in ExportReady-Battery.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Prerequisites](#2-prerequisites)
3. [Understanding the Flow](#3-understanding-the-flow)
4. [Test Environment Setup](#4-test-environment-setup)
5. [Test Case 1: Full Happy Path](#5-test-case-1-full-happy-path)
6. [Test Case 2: Recall Interrupt Path](#6-test-case-2-recall-interrupt-path)
7. [Test Case 3: Validation Error Testing](#7-test-case-3-validation-error-testing)
8. [Test Case 4: Bulk Operations](#8-test-case-4-bulk-operations)
9. [Test Case 5: Audit Chain Verification](#9-test-case-5-audit-chain-verification)
10. [Test Case 6: Magic Link Flow (External Actors)](#10-test-case-6-magic-link-flow-external-actors)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. System Overview

### What is the Passport Lifecycle?

The passport lifecycle tracks a battery from creation to end-of-life, ensuring regulatory compliance and fraud prevention. Each state change is recorded in an immutable audit trail.

### Key Principles

1. **Action-Based Transitions**: Clients never set status directly. They request actions, and the system determines the new state.
2. **Role Enforcement**: Only authorized roles can perform specific actions.
3. **Evidence Requirements**: Sensitive actions require documented proof.
4. **Audit Trail**: Every transition creates a tamper-proof event record.

### State Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │                                             │
                    ▼                                             │
CREATED ──ACTIVATE──► ACTIVE ──SHIP──► SHIPPED ──INSTALL──► IN_SERVICE
                         │                      │                   │
                         │                      │                   │
                         └──────────RECALL──────┴─────────RECALL───┘
                                              │
                                              ▼
                                         RECALLED
                                              │
                                              │
                    ┌─────────────────────────┼─────────────────────┐
                    │                         │                     │
                    ▼                         ▼                     │
               RECYCLED ◄──RECYCLE──── IN_SERVICE                  │
                    │                                             │
                    │                                             │
                    └────────────────CLOSE─────────────────────────┘
                                              │
                                              ▼
                                        END_OF_LIFE
```

---

## 2. Prerequisites

### Required Tools

- **Postman** or **curl** for API requests
- **Database client** (pgAdmin, DBeaver, or psql) for direct database inspection
- **Go** installed (for running the server)

### Required Accounts/Roles

| Role                | Purpose               | How to Get                                      |
| ------------------- | --------------------- | ----------------------------------------------- |
| `ADMIN`             | Can recall passports  | Create team member with role "OWNER" or "ADMIN" |
| `INTERNAL_OPERATOR` | Can ship passports    | Create team member with role "MEMBER"           |
| `SYSTEM`            | Can activate/close    | Automatic (server-side)                         |
| `TECHNICIAN`        | Can install batteries | Via magic link from trusted domain              |
| `RECYCLER`          | Can recycle batteries | Via magic link from trusted domain              |
| `LOGISTICS`         | Can ship passports    | Via magic link from trusted domain              |

### Environment Variables

Ensure your `.env` file has:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/exportready
JWT_SECRET=your-jwt-secret
PORT=8080
```

---

## 3. Understanding the Flow

### How Actions Work

1. **Client sends action request** → `POST /api/v1/passports/{uuid}/transition`
2. **Server validates**:
   - Actor context (authenticated user + role)
   - Action is valid for current state
   - Evidence requirements met
3. **Server creates audit event** with tamper-proof hash
4. **Server updates passport status** in same transaction
5. **Server returns result** with new status and event ID

### How Role Resolution Works

For internal users (authenticated via JWT):

1. Extract email from JWT token
2. Look up team member by email
3. Map team role to actor role:
   - `OWNER`/`ADMIN` → `ADMIN` actor role
   - `MEMBER` → `INTERNAL_OPERATOR` actor role

For external users (authenticated via magic link):

1. Validate magic link token
2. Extract role from token (pre-assigned during creation)
3. Allow only the specific action bound to token

---

## 4. Test Environment Setup

### Step 1: Start the Server

```bash
cd backend
go run ./cmd/server
```

Expected output:

```
Server starting on :8080
Database connected successfully
```

### Step 2: Create a Test Tenant

```bash
# Using psql or database client
INSERT INTO tenants (id, company_name, plan_type, quota_balance)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Company', 'GROWTH', 1000);
```

### Step 3: Create a Test User

```bash
# Create a team member with MEMBER role (can SHIP)
INSERT INTO team_members (id, tenant_id, email, role, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'test@example.com',
  'MEMBER',
  'ACTIVE'
);
```

### Step 4: Create a Test Batch

```bash
curl -X POST http://localhost:8080/api/v1/batches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "tenant_id": "11111111-1111-1111-1111-111111111111",
    "batch_name": "Test Batch 001",
    "model_name": "Battery Model X",
    "specs": {
      "chemistry": "LFP",
      "voltage": "48V",
      "capacity": "100Ah",
      "manufacturer": "Test Manufacturer"
    },
    "market_region": "GLOBAL"
  }'
```

Response will include `batch_id`. Save this for next step.

### Step 5: Create Test Passports

```bash
# Upload CSV to create passports
curl -X POST http://localhost:8080/api/v1/batches/{batch_id}/upload \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@test_passports.csv"
```

Or directly insert:

```sql
INSERT INTO passports (uuid, batch_id, serial_number, manufacture_date, status, created_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '<batch_id>',
  'TEST-001',
  '2026-02-13',
  'CREATED',
  NOW()
);
```

---

## 5. Test Case 1: Full Happy Path

This test walks through the complete lifecycle from CREATED to END_OF_LIFE.

### Step 5.1: Verify Initial State

```bash
# Get passport details
curl http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333

# Expected response:
{
  "passport": {
    "uuid": "33333333-3333-3333-3333-333333333333",
    "status": "CREATED",
    "serial_number": "TEST-001"
  }
}
```

### Step 5.2: Get Allowed Actions (CREATED state)

```bash
curl http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transitions \
  -H "Authorization: Bearer <token>"

# Expected response:
{
  "current_status": "CREATED",
  "allowed_actions": ["ACTIVATE"]
}
```

### Step 5.3: ACTIVATE (CREATED → ACTIVE)

**Who can do this**: SYSTEM role (typically automatic during batch activation)

```bash
curl -X POST http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "action": "ACTIVATE"
  }'

# Expected response:
{
  "success": true,
  "previous_status": "CREATED",
  "new_status": "ACTIVE",
  "action": "ACTIVATE",
  "event_id": "44444444-4444-4444-4444-444444444444"
}
```

**What happens internally**:

1. Server validates action is allowed from CREATED
2. Server validates actor has SYSTEM role (or admin performing system action)
3. Server creates audit event with hash
4. Server updates passport status to ACTIVE
5. Both operations commit atomically

### Step 5.4: Get Allowed Actions (ACTIVE state)

```bash
curl http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transitions

# Expected response:
{
  "current_status": "ACTIVE",
  "allowed_actions": ["SHIP", "RECALL"]
}
```

### Step 5.5: SHIP (ACTIVE → SHIPPED)

**Who can do this**: INTERNAL_OPERATOR or LOGISTICS role

```bash
curl -X POST http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <member-token>" \
  -d '{
    "action": "SHIP",
    "evidence": {
      "shipment_reference": "INV-2026-001",
      "shipment_date": "2026-02-13"
    }
  }'

# Expected response:
{
  "success": true,
  "previous_status": "ACTIVE",
  "new_status": "SHIPPED",
  "action": "SHIP",
  "event_id": "55555555-5555-5555-5555-555555555555"
}
```

**What happens internally**:

1. Server validates SHIP action is allowed from ACTIVE
2. Server validates actor has INTERNAL_OPERATOR or LOGISTICS role
3. Server validates evidence has required fields (shipment_reference, shipment_date)
4. Server parses shipment_date and sets shipped_at timestamp
5. Server creates audit event with evidence in metadata
6. Server updates passport status and shipped_at field
7. Both operations commit atomically

### Step 5.6: Get Allowed Actions (SHIPPED state)

```bash
curl http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transitions

# Expected response:
{
  "current_status": "SHIPPED",
  "allowed_actions": ["INSTALL", "RECALL"]
}
```

### Step 5.7: INSTALL (SHIPPED → IN_SERVICE)

**Who can do this**: TECHNICIAN role (typically via magic link)

For internal testing with admin/member token:

```bash
# Note: In production, this requires TECHNICIAN role via magic link
# For testing, you may need to modify role requirements or use magic link

curl -X POST http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <technician-magic-link-token>" \
  -d '{
    "action": "INSTALL",
    "evidence": {
      "installation_date": "2026-02-13",
      "installer_id": "TECH-001"
    }
  }'

# Expected response:
{
  "success": true,
  "previous_status": "SHIPPED",
  "new_status": "IN_SERVICE",
  "action": "INSTALL",
  "event_id": "66666666-6666-6666-6666-666666666666"
}
```

### Step 5.8: Get Allowed Actions (IN_SERVICE state)

```bash
curl http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transitions

# Expected response:
{
  "current_status": "IN_SERVICE",
  "allowed_actions": ["RECYCLE", "RECALL"]
}
```

### Step 5.9: RECYCLE (IN_SERVICE → RECYCLED)

**Who can do this**: RECYCLER role (via magic link)

```bash
curl -X POST http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <recycler-magic-link-token>" \
  -d '{
    "action": "RECYCLE",
    "evidence": {
      "recycler_epr_id": "EPR-RECYCLER-001",
      "recycling_date": "2026-02-13",
      "certificate_reference": "CERT-REC-2026-001"
    }
  }'

# Expected response:
{
  "success": true,
  "previous_status": "IN_SERVICE",
  "new_status": "RECYCLED",
  "action": "RECYCLE",
  "event_id": "77777777-7777-7777-7777-777777777777"
}
```

**What happens internally**:

1. Server validates RECYCLE action is allowed from IN_SERVICE
2. Server validates actor has RECYCLER role
3. Server validates all three evidence fields
4. Server sets recycled_at, recycling_status, recycler_epr_id, recycling_date
5. Server creates audit event
6. Server updates passport with all recycling fields
7. Both operations commit atomically

### Step 5.10: Get Allowed Actions (RECYCLED state)

```bash
curl http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transitions

# Expected response:
{
  "current_status": "RECYCLED",
  "allowed_actions": ["CLOSE"]
}
```

### Step 5.11: CLOSE (RECYCLED → END_OF_LIFE)

**Who can do this**: SYSTEM role (automatic)

```bash
curl -X POST http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "action": "CLOSE"
  }'

# Expected response:
{
  "success": true,
  "previous_status": "RECYCLED",
  "new_status": "END_OF_LIFE",
  "action": "CLOSE",
  "event_id": "88888888-8888-8888-8888-888888888888"
}
```

### Step 5.12: Verify Final State

```bash
curl http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transitions

# Expected response:
{
  "current_status": "END_OF_LIFE",
  "allowed_actions": []
}
```

No more actions allowed - lifecycle complete!

---

## 6. Test Case 2: Recall Interrupt Path

This tests the interrupt state where a battery needs to be recalled for safety/compliance reasons.

### Step 6.1: Setup - Create passport in ACTIVE state

Follow steps 5.1-5.3 to get a passport in ACTIVE state.

### Step 6.2: RECALL (ACTIVE → RECALLED)

**Who can do this**: ADMIN role

```bash
curl -X POST http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "action": "RECALL",
    "evidence": {
      "recall_reason": "Safety concern - potential thermal runaway risk",
      "recall_reference": "RECALL-2026-001"
    }
  }'

# Expected response:
{
  "success": true,
  "previous_status": "ACTIVE",
  "new_status": "RECALLED",
  "action": "RECALL",
  "event_id": "99999999-9999-9999-9999-999999999999"
}
```

### Step 6.3: Get Allowed Actions (RECALLED state)

```bash
curl http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transitions

# Expected response:
{
  "current_status": "RECALLED",
  "allowed_actions": ["RECYCLE", "CLOSE"]
}
```

### Step 6.4: From RECALLED - Option A: RECYCLE

```bash
curl -X POST http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <recycler-token>" \
  -d '{
    "action": "RECYCLE",
    "evidence": {
      "recycler_epr_id": "EPR-RECYCLER-001",
      "recycling_date": "2026-02-13",
      "certificate_reference": "CERT-REC-2026-001"
    }
  }'
```

### Step 6.5: From RECALLED - Option B: CLOSE directly

```bash
curl -X POST http://localhost:8080/api/v1/passports/33333333-3333-3333-3333-333333333333/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "action": "CLOSE"
  }'

# Expected: status changes to END_OF_LIFE
```

---

## 7. Test Case 3: Validation Error Testing

These tests verify the system correctly rejects invalid requests.

### Test 3.1: Reject Status Mutation

```bash
# Attempt to set status directly (FORBIDDEN)
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "ACTIVE"
  }'

# Expected: 400 Bad Request
# Response: "status fields are not allowed; use action"
```

### Test 3.2: Reject to_status Field

```bash
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "SHIP",
    "to_status": "SHIPPED"
  }'

# Expected: 400 Bad Request
# Response: "status fields are not allowed; use action"
```

### Test 3.3: Reject metadata Field

```bash
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "SHIP",
    "metadata": {"custom": "value"}
  }'

# Expected: 400 Bad Request
# Response: "metadata is not allowed; use evidence"
```

### Test 3.4: Unknown Action

```bash
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "FLY"
  }'

# Expected: 400 Bad Request
# Response: "Unknown action: FLY"
```

### Test 3.5: Action Not Allowed From Current State

```bash
# Try to SHIP from CREATED state (should fail)
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "SHIP",
    "evidence": {
      "shipment_reference": "REF-1",
      "shipment_date": "2026-02-13"
    }
  }'

# Expected: 409 Conflict
# Response: "Action SHIP not allowed from CREATED. Allowed actions: [ACTIVATE]"
```

### Test 3.6: Skip State (Not Allowed)

```bash
# Try to RECALL from CREATED state (should fail)
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "action": "RECALL",
    "evidence": {
      "recall_reason": "Test",
      "recall_reference": "REF-1"
    }
  }'

# Expected: 409 Conflict
# Response: "Action RECALL not allowed from CREATED"
```

### Test 3.7: Missing Evidence

```bash
# Try to SHIP without evidence
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "SHIP"
  }'

# Expected: 400 Bad Request
# Response: "evidence is required for action SHIP"
```

### Test 3.8: Missing Required Evidence Field

```bash
# Try to SHIP with incomplete evidence
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "SHIP",
    "evidence": {
      "shipment_reference": "REF-1"
    }
  }'

# Expected: 400 Bad Request
# Response: "shipment_date is required"
```

### Test 3.9: Invalid Date Format

```bash
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "SHIP",
    "evidence": {
      "shipment_reference": "REF-1",
      "shipment_date": "13/02/2026"
    }
  }'

# Expected: 400 Bad Request
# Response: "shipment_date must be a valid date"
```

### Test 3.10: Role Not Permitted

```bash
# Try to RECALL with MEMBER role (only ADMIN can recall)
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <member-token>" \
  -d '{
    "action": "RECALL",
    "evidence": {
      "recall_reason": "Test",
      "recall_reference": "REF-1"
    }
  }'

# Expected: 403 Forbidden
# Response: "Role INTERNAL_OPERATOR is not permitted to perform RECALL"
```

### Test 3.11: Evidence Not Allowed for Action

```bash
# Try to provide evidence for ACTIVATE (not allowed)
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "ACTIVATE",
    "evidence": {
      "some_field": "value"
    }
  }'

# Expected: 400 Bad Request
# Response: "evidence not allowed for action ACTIVATE"
```

---

## 8. Test Case 4: Bulk Operations

### Test 4.1: Bulk Ship

```bash
# Create multiple passports first, then:
curl -X POST http://localhost:8080/api/v1/passports/bulk/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "passport_ids": [
      "uuid-1",
      "uuid-2",
      "uuid-3"
    ],
    "action": "SHIP",
    "evidence": {
      "shipment_reference": "BULK-SHIP-2026-001",
      "shipment_date": "2026-02-13"
    }
  }'

# Expected response:
{
  "total": 3,
  "succeeded": 3,
  "failed": 0,
  "failed_ids": [],
  "errors": []
}
```

### Test 4.2: Bulk with Partial Failures

```bash
# Mix of valid and invalid passport IDs
curl -X POST http://localhost:8080/api/v1/passports/bulk/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "passport_ids": [
      "valid-uuid-1",
      "invalid-uuid",
      "valid-uuid-2"
    ],
    "action": "SHIP",
    "evidence": {
      "shipment_reference": "BULK-SHIP-2026-002",
      "shipment_date": "2026-02-13"
    }
  }'

# Expected response:
{
  "total": 3,
  "succeeded": 2,
  "failed": 1,
  "failed_ids": ["invalid-uuid"],
  "errors": ["passport not found"]
}
```

---

## 9. Test Case 5: Audit Chain Verification

### Test 5.1: Get All Events

```bash
curl http://localhost:8080/api/v1/passports/{uuid}/events \
  -H "Authorization: Bearer <token>"

# Expected response:
{
  "passport_id": "uuid",
  "count": 5,
  "events": [
    {
      "id": "event-1",
      "event_type": "CREATED",
      "action": "",
      "actor": "system",
      "actor_type": "SYSTEM",
      "status_from": "",
      "status_to": "CREATED",
      "hash": "abc123...",
      "previous_hash": "",
      "created_at": "2026-02-13T10:00:00Z"
    },
    {
      "id": "event-2",
      "event_type": "STATUS_CHANGED",
      "action": "ACTIVATE",
      "actor": "system",
      "actor_type": "SYSTEM",
      "status_from": "CREATED",
      "status_to": "ACTIVE",
      "hash": "def456...",
      "previous_hash": "abc123...",
      "created_at": "2026-02-13T10:01:00Z"
    },
    ...
  ]
}
```

### Test 5.2: Verify Chain Integrity

```bash
curl http://localhost:8080/api/v1/passports/{uuid}/verify-chain \
  -H "Authorization: Bearer <token>"

# Expected response (valid chain):
{
  "valid": true,
  "passport_id": "uuid",
  "event_count": 5,
  "failed_at_index": -1,
  "message": "Audit chain verified - no tampering detected"
}
```

### Test 5.3: Detect Tampering (Manual DB Test)

```sql
-- Manually modify an event hash (simulating tampering)
UPDATE passport_events
SET metadata = '{"tampered": true}'::jsonb
WHERE id = 'event-2';
```

```bash
# Verify chain again
curl http://localhost:8080/api/v1/passports/{uuid}/verify-chain

# Expected response (tampered chain):
{
  "valid": false,
  "passport_id": "uuid",
  "event_count": 5,
  "failed_at_index": 2,
  "message": "CHAIN BROKEN - possible tampering detected"
}
```

---

## 10. Test Case 6: Magic Link Flow (External Actors)

This tests the flow for external partners (technicians, recyclers, logistics).

### Step 10.1: Create Trusted Domain

```bash
curl -X POST http://localhost:8080/api/v1/trusted-domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "domain": "technician-company.com",
    "role": "TECHNICIAN",
    "description": "Partner technician company"
  }'
```

### Step 10.2: Generate Magic Link

```bash
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/magic-link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "email": "tech@technician-company.com",
    "role": "TECHNICIAN",
    "action": "INSTALL"
  }'

# Expected response:
{
  "magic_link": "https://app.example.com/magic?token=abc123...",
  "expires_at": "2026-02-14T10:00:00Z"
}
```

### Step 10.3: Use Magic Link

```bash
# The external user clicks the link and is authenticated
# Then they can perform the action:

curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <magic-link-token>" \
  -d '{
    "action": "INSTALL",
    "evidence": {
      "installation_date": "2026-02-13",
      "installer_id": "TECH-001"
    }
  }'
```

### Step 10.4: Verify Token is Single-Use

```bash
# Try to use the same magic link again
curl -X POST http://localhost:8080/api/v1/passports/{uuid}/transition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <same-magic-link-token>" \
  -d '{
    "action": "INSTALL",
    "evidence": {...}
  }'

# Expected: 401 Unauthorized
# Response: "Magic link token is invalid or already used"
```

---

## 11. Troubleshooting

### Common Issues

| Issue            | Cause                         | Solution                                          |
| ---------------- | ----------------------------- | ------------------------------------------------- |
| 401 Unauthorized | Missing/invalid JWT token     | Ensure token is valid and not expired             |
| 403 Forbidden    | Role not permitted            | Check user's team role matches action requirement |
| 404 Not Found    | Passport doesn't exist        | Verify passport UUID is correct                   |
| 409 Conflict     | Action not allowed from state | Check current status and allowed actions          |
| 400 Bad Request  | Invalid evidence              | Verify all required evidence fields are present   |

### Debug Queries

```sql
-- Check passport current state
SELECT uuid, serial_number, status, created_at
FROM passports
WHERE uuid = 'your-uuid';

-- Check all events for a passport
SELECT id, event_type, action, actor, actor_role, status_from, status_to, created_at
FROM passport_events
WHERE passport_id = 'your-uuid'
ORDER BY created_at;

-- Check team member roles
SELECT email, role, status
FROM team_members
WHERE tenant_id = 'your-tenant-id';

-- Check magic link tokens
SELECT token_hash, passport_id, role, action, expires_at, used_at
FROM magic_link_tokens
WHERE passport_id = 'your-uuid';
```

### Logs to Check

Server logs will show:

- Transition attempts with actor context
- Validation failures
- Database transaction results

```bash
# Run server with verbose logging
LOG_LEVEL=debug go run ./cmd/server
```

---

## Summary

The passport lifecycle system ensures:

1. **Regulatory Compliance**: Every state change is documented
2. **Fraud Prevention**: Hash chains detect tampering
3. **Role-Based Security**: Only authorized actors can perform actions
4. **Evidence Trail**: Sensitive actions require documented proof
5. **Atomic Operations**: State and audit events commit together

For questions or issues, refer to:

- [`passport_transitions.md`](passport_transitions.md) - API specification
- [`how_pass_transition_should_be.md`](how_pass_transition_should_be.md) - Design principles
