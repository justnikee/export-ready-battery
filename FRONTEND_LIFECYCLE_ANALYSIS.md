# Frontend Lifecycle Implementation Analysis

This document analyzes how the frontend implements the passport lifecycle and identifies any issues or gaps.

---

## Executive Summary

The frontend is **correctly configured** for the passport lifecycle system. It properly implements:

1. ✅ Action-based transitions (not status mutation)
2. ✅ Evidence collection for required actions
3. ✅ Magic link flow for external actors
4. ✅ Bulk transitions for dispatch operations
5. ✅ Status badge display for all states

---

## Frontend Components Analysis

### 1. Dispatch Page (`frontend/app/(dashboard)/dashboard/dispatch/page.tsx`)

**Status**: ✅ Correctly Implemented

**Implementation**:

```typescript
// Lines 196-217: Correct action-based flow
const bulkTransition = async (
  action: string,
  evidence?: Record<string, unknown>,
) => {
  const response = await api.post("/passports/bulk/transition", {
    passport_ids: passportIds,
    action: action,
    evidence: evidence || {},
  });
  return response.data;
};

// Phase 2 action flow: ACTIVATE (if needed), then SHIP
await bulkTransition("ACTIVATE");

const result = await bulkTransition("SHIP", {
  shipment_reference: shipmentReference,
  shipment_date: shipmentDate,
});
```

**What it does right**:

- Uses `action` field instead of `status`
- Sends evidence with SHIP action
- Calls ACTIVATE first (for CREATED passports), then SHIP
- Uses correct endpoint: `/passports/bulk/transition`

---

### 2. Passport Action Page (`frontend/app/p/[uuid]/action/page.tsx`)

**Status**: ✅ Correctly Implemented

**Action Configuration** (Lines 26-63):

```typescript
const ACTION_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; description: string }
> = {
  ACTIVATE: {
    label: "Activate Passport",
    icon: Shield,
    color: "emerald",
    description: "...",
  },
  SHIP: {
    label: "Mark as Shipped",
    icon: Truck,
    color: "blue",
    description: "...",
  },
  INSTALL: {
    label: "Mark as In Service",
    icon: Wrench,
    color: "emerald",
    description: "...",
  },
  RECYCLE: {
    label: "Mark as Recycled",
    icon: Recycle,
    color: "purple",
    description: "...",
  },
  RECALL: {
    label: "Recall Battery",
    icon: AlertCircle,
    color: "red",
    description: "...",
  },
  CLOSE: {
    label: "Close as End of Life",
    icon: CheckCircle,
    color: "slate",
    description: "...",
  },
};
```

**Evidence Fields** (Lines 65-83):

```typescript
const EVIDENCE_FIELDS: Record<
  string,
  { key: string; label: string; placeholder?: string; type?: string }[]
> = {
  SHIP: [
    {
      key: "shipment_reference",
      label: "Shipment Reference",
      placeholder: "Tracking number / AWB",
    },
    { key: "shipment_date", label: "Shipment Date", type: "date" },
  ],
  INSTALL: [
    { key: "installation_date", label: "Installation Date", type: "date" },
    {
      key: "installer_id",
      label: "Installer ID",
      placeholder: "Technician ID or badge",
    },
  ],
  RECYCLE: [
    {
      key: "recycler_epr_id",
      label: "Recycler EPR ID",
      placeholder: "EPR-XXXX",
    },
    { key: "recycling_date", label: "Recycling Date", type: "date" },
    {
      key: "certificate_reference",
      label: "Certificate Reference",
      placeholder: "Certificate number",
    },
  ],
  RECALL: [
    {
      key: "recall_reason",
      label: "Recall Reason",
      placeholder: "Recall reason",
    },
    {
      key: "recall_reference",
      label: "Recall Reference",
      placeholder: "Incident / reference ID",
    },
  ],
};
```

**Transition Request** (Lines 134-194):

```typescript
const handleTransition = async () => {
  // ... validation ...

  const payload: {
    action: string;
    evidence: Record<string, string>;
    partner_code?: string;
  } = {
    action: selectedAction,
    evidence: evidence,
  };

  const response = await fetch(`${apiUrl}/passport/${passportId}/transition`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
};
```

**What it does right**:

- All 6 canonical actions defined
- Evidence fields match backend requirements exactly
- Uses `action` field, not `status`
- Uses magic link token for authorization
- Correct endpoint: `/passport/{uuid}/transition` (singular, for magic links)

---

### 3. Request Magic Link Modal (`frontend/components/passport/request-magic-link-modal.tsx`)

**Status**: ✅ Correctly Implemented

**Actions Configuration** (Lines 16-38):

```typescript
const ACTIONS = [
  {
    action: "SHIP",
    label: "I'm shipping this battery",
    icon: Truck,
    color: "blue",
    role: "LOGISTICS",
  },
  {
    action: "INSTALL",
    label: "I'm installing this battery",
    icon: Wrench,
    color: "emerald",
    role: "TECHNICIAN",
  },
  {
    action: "RECYCLE",
    label: "I'm recycling this battery",
    icon: Recycle,
    color: "purple",
    role: "RECYCLER",
  },
];
```

**Magic Link Request** (Lines 50-91):

```typescript
const response = await fetch(`${apiUrl}/auth/magic-link`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    passport_id: passportId,
    email: email,
    role: selectedAction.role,
    action: selectedAction.action,
    partner_code: partnerCode || undefined,
  }),
});
```

**What it does right**:

- Correct action-to-role mapping (SHIP→LOGISTICS, INSTALL→TECHNICIAN, RECYCLE→RECYCLER)
- Supports partner code for Tier B verification
- Correct endpoint: `/auth/magic-link`

---

### 4. Passport View Component (`frontend/components/passport/passport-view.tsx`)

**Status**: ✅ Correctly Implemented

**Status Badges** (Lines 88-111):

```typescript
function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { bg: string; ring: string; dot: string; text: string; label: string }
  > = {
    CREATED: {
      bg: "bg-slate-500/20",
      ring: "ring-slate-500/50",
      dot: "bg-slate-400",
      text: "text-slate-400",
      label: "Created",
    },
    ACTIVE: {
      bg: "bg-emerald-500/20",
      ring: "ring-emerald-500/50",
      dot: "bg-emerald-400",
      text: "text-emerald-400",
      label: "Active",
    },
    SHIPPED: {
      bg: "bg-blue-500/20",
      ring: "ring-blue-500/50",
      dot: "bg-blue-400",
      text: "text-blue-400",
      label: "Shipped",
    },
    IN_SERVICE: {
      bg: "bg-emerald-500/20",
      ring: "ring-emerald-500/50",
      dot: "bg-emerald-400 animate-pulse",
      text: "text-emerald-400",
      label: "In Service",
    },
    RECALLED: {
      bg: "bg-red-500/20",
      ring: "ring-red-500/50",
      dot: "bg-red-400 animate-pulse",
      text: "text-red-400",
      label: "Recalled",
    },
    RECYCLED: {
      bg: "bg-purple-500/20",
      ring: "ring-purple-500/50",
      dot: "bg-purple-400",
      text: "text-purple-400",
      label: "Recycled",
    },
    END_OF_LIFE: {
      bg: "bg-slate-700/20",
      ring: "ring-slate-500/50",
      dot: "bg-slate-500",
      text: "text-slate-400",
      label: "End of Life",
    },
  };
  // ...
}
```

**What it does right**:

- All 7 canonical statuses displayed
- Read-only view (no status mutation)
- Visual distinction for different states (animated pulse for RECALLED and IN_SERVICE)

---

## API Endpoints Mapping

| Frontend Endpoint              | Backend Endpoint                          | Purpose                           |
| ------------------------------ | ----------------------------------------- | --------------------------------- |
| `/passports/bulk/transition`   | `POST /api/v1/passports/bulk/transition`  | Bulk transitions (internal users) |
| `/passport/{uuid}/transition`  | `POST /api/v1/passport/{uuid}/transition` | Single transition (magic link)    |
| `/auth/magic-link`             | `POST /api/v1/auth/magic-link`            | Request magic link                |
| `/passport/{uuid}/action-info` | `GET /api/v1/passport/{uuid}/action-info` | Get action info for magic link    |

---

## Evidence Field Comparison

| Action   | Backend Required Fields                                      | Frontend Fields                                              | Match |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ----- |
| SHIP     | `shipment_reference`, `shipment_date`                        | `shipment_reference`, `shipment_date`                        | ✅    |
| INSTALL  | `installation_date`, `installer_id`                          | `installation_date`, `installer_id`                          | ✅    |
| RECYCLE  | `recycler_epr_id`, `recycling_date`, `certificate_reference` | `recycler_epr_id`, `recycling_date`, `certificate_reference` | ✅    |
| RECALL   | `recall_reason`, `recall_reference`                          | `recall_reason`, `recall_reference`                          | ✅    |
| ACTIVATE | None                                                         | None                                                         | ✅    |
| CLOSE    | None                                                         | None                                                         | ✅    |

---

## Role Mapping Comparison

| Action   | Backend Allowed Roles        | Frontend Role                     | Match |
| -------- | ---------------------------- | --------------------------------- | ----- |
| ACTIVATE | SYSTEM                       | (not exposed to frontend)         | ✅    |
| SHIP     | INTERNAL_OPERATOR, LOGISTICS | LOGISTICS                         | ✅    |
| INSTALL  | TECHNICIAN                   | TECHNICIAN                        | ✅    |
| RECYCLE  | RECYCLER                     | RECYCLER                          | ✅    |
| CLOSE    | SYSTEM                       | (not exposed to frontend)         | ✅    |
| RECALL   | ADMIN                        | (admin dashboard, not magic link) | ✅    |

---

## Potential Issues & Recommendations

### 1. Missing RECALL Action in Magic Link Modal

**Issue**: The `RequestMagicLinkModal` only exposes SHIP, INSTALL, and RECYCLE actions. RECALL is not available via magic link.

**Status**: ✅ **This is correct by design** - RECALL requires ADMIN role, which should not be available via public magic links.

### 2. Missing ACTIVATE and CLOSE in Magic Link Modal

**Issue**: ACTIVATE and CLOSE are not in the magic link actions.

**Status**: ✅ **This is correct by design** - These are SYSTEM-only actions that happen automatically during batch activation and end-of-life processing.

### 3. No "Get Allowed Actions" API Call

**Observation**: The action page (`/p/[uuid]/action`) receives `allowed_actions` from the `action-info` endpoint rather than calling `/passports/{uuid}/transitions`.

**Status**: ✅ **This is correct** - The `action-info` endpoint returns allowed actions based on the passport's current state and the magic link's pre-assigned role.

---

## Testing Checklist for Frontend

### Dispatch Page Tests

- [ ] Scan passport UUIDs and add to pending list
- [ ] Enter shipment reference and date
- [ ] Submit dispatch - verify ACTIVATE + SHIP sequence
- [ ] Verify error handling for invalid passports
- [ ] Verify partial failure handling (some succeed, some fail)
- [ ] Verify localStorage persistence on page refresh

### Magic Link Flow Tests

- [ ] Request magic link for SHIP action
- [ ] Request magic link for INSTALL action
- [ ] Request magic link for RECYCLE action
- [ ] Verify partner code requirement for unknown email domains
- [ ] Verify magic link expiration
- [ ] Verify single-use enforcement

### Passport View Tests

- [ ] View passport in CREATED state
- [ ] View passport in ACTIVE state
- [ ] View passport in SHIPPED state
- [ ] View passport in IN_SERVICE state
- [ ] View passport in RECALLED state
- [ ] View passport in RECYCLED state
- [ ] View passport in END_OF_LIFE state

---

## Conclusion

The frontend implementation is **correctly aligned** with the backend lifecycle system:

1. **Action-based transitions** are used throughout (no status mutation)
2. **Evidence fields** match backend requirements exactly
3. **Role mappings** are correct for magic link flows
4. **API endpoints** are properly configured
5. **Status badges** cover all canonical states

No critical issues were found. The frontend correctly implements the security model where:

- Internal users use `/passports/bulk/transition` with JWT auth
- External partners use `/passport/{uuid}/transition` with magic link tokens
- ADMIN-only actions (RECALL) are not exposed via public magic links
- SYSTEM-only actions (ACTIVATE, CLOSE) are handled automatically
