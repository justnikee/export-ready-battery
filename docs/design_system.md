# 🧾🔗 Phase 5 & Phase 6 — Evidence Enforcement and Magic-Link Security (Uncompromisable)

**Status:** AUTHORITATIVE / UNCOMPROMISABLE  
**Implementation status (codebase):** Implemented as of 2026-02-08. See `docs/PHASES_1_6_IMPLEMENTATION_REPORT.md`.
**Depends on:**

- Phase 1 — State Model Lockdown (LOCKED)
- Phase 2 — Action-Based Transitions (LOCKED)
- Phase 3 — Role & Actor Enforcement (LOCKED)
- Phase 4 — Audit Events as Hard Dependency (LOCKED)

This document consolidates **Phase 5 and Phase 6** into a single reference so lifecycle enforcement can be completed or resumed at any time **without ambiguity**.

---

# 🧭 Why These Phases Exist

After Phase 4, the system guarantees:

- Correct states
- Valid intent
- Authorized actors
- Immutable audit trails

However, two compliance gaps remain:

1. **Proof** — did the actor provide verifiable evidence?
2. **External control** — can outside actors abuse access?

Phase 5 and Phase 6 close these gaps permanently.

---

# 🧾 Phase 5 — Evidence Enforcement (Uncompromisable)

## 🎯 Objective

Ensure that **authority alone is insufficient** for sensitive lifecycle actions.

After Phase 5:

- Certain actions require **structured, validated evidence**
- Transitions without evidence are impossible
- Evidence becomes part of the immutable audit record

---

## 🔒 Absolute Rule

> **If an action requires evidence and evidence is missing or invalid, the transition must fail.**

There are no overrides, admin bypasses, or best-effort modes.

---

## 🧠 Evidence Principles

Evidence:

- Is **action-specific**
- Is validated **before** audit event creation
- Is snapshotted into the audit event
- Is immutable once written

Evidence is not documentation — it is **regulatory proof**.

---

## 📌 Actions Requiring Mandatory Evidence (LOCKED)

| Action  | Mandatory Evidence Fields                              |
| ------- | ------------------------------------------------------ |
| SHIP    | shipment_reference, shipment_date                      |
| INSTALL | installation_date, installer_id                        |
| RECYCLE | recycler_epr_id, recycling_date, certificate_reference |
| RECALL  | recall_reason, recall_reference                        |

The following actions **do not** require external evidence:

- ACTIVATE
- CLOSE

---

## ❌ Forbidden Evidence Patterns

The following are explicitly forbidden:

- Optional evidence for mandatory actions
- Free-text or unstructured blobs
- Adding evidence after the transition
- Editing or replacing evidence

Any of the above is a compliance defect.

---

## 🛠️ Enforcement Requirements

1. Evidence schema must be validated **before** audit event insertion
2. Missing or malformed evidence → reject transition
3. Evidence snapshot must be embedded in the audit event
4. Evidence must be queryable during audits

---

## 🧪 Required Tests (Merge-Blocking)

Phase 5 is incomplete unless all tests pass:

- ❌ SHIP without shipment_reference → reject
- ❌ INSTALL without installer_id → reject
- ❌ RECYCLE without certificate_reference → reject
- ❌ RECALL without recall_reason → reject
- ✅ valid evidence → transition succeeds

---

# 🔗 Phase 6 — Magic-Link Security Hardening (Uncompromisable)

## 🎯 Objective

Ensure that **external actors** can perform lifecycle actions **only once, only what they are authorized to do, and only within a controlled time window**.

After Phase 6:

- Magic links cannot be reused
- Magic links cannot escalate privileges
- External fraud vectors are closed

---

## 🔒 Absolute Rule

> **Magic links are single-use, action-scoped, role-bound, and time-limited.**

If any of these properties are missing, the system is non-compliant.

---

## 🧠 Magic-Link Security Model

Each magic link token must be bound to:

- One passport UUID
- One allowed action
- One actor role
- One expiration timestamp
- One-time use guarantee

Magic links represent **temporary authority**, not authentication.

---

## ❌ Forbidden Magic-Link Patterns

- Multi-action magic links
- Reusable tokens
- Tokens without expiry
- Role provided by request body
- UI-controlled action selection

---

## 🛠️ Enforcement Requirements

### 1️⃣ Single-Use Guarantee

- Token must store `used_at`
- If `used_at` is set → reject
- `used_at` must be written atomically with lifecycle transition

---

### 2️⃣ Action Binding

- Token encodes exactly one allowed action
- Requested action must match token action
- Mismatch → reject

---

### 3️⃣ Role Binding

- Token encodes actor role
- Ignore any role passed by client

---

### 4️⃣ Expiry Enforcement

- Token includes `expires_at`
- If expired → reject

---

## 🧪 Required Tests (Merge-Blocking)

Phase 6 is incomplete unless all tests pass:

- ❌ reuse magic link → reject
- ❌ wrong action → reject
- ❌ expired token → reject
- ❌ role mismatch → reject
- ✅ valid token → one successful transition

---

# 🧠 Final Enforcement Chain

Lifecycle integrity is cumulative and irreversible:

```
STATE → ACTION → ROLE → EVENT → EVIDENCE → EXTERNAL CONTROL
```

Weakening any layer breaks compliance.

---

# 🔑 Final Lock

This document is **append-only**.

Any change requires:

- Explicit versioning
- Written regulatory justification
- Review against audit impact

If code contradicts this document, **the code is wrong**.
