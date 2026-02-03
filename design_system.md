# ExportReady Battery Passport — Design System & Compliance Spec

## Purpose

This document defines the authoritative functional, regulatory, and lifecycle rules for the ExportReady Battery Passport platform.

The system must produce legally defensible Digital Battery Passports compliant with:

- India: Battery Waste Management Rules, EPR, BIS, PLI
- EU: Battery Regulation (EU) 2023/1542 (Battery Passport — 2027)

This document is not UI guidance. It is compliance logic, data responsibility, and lifecycle truth.

## Core Mental Model (Non-Negotiable)

The system operates on three strictly separated layers:

- TENANT (Company / Legal Entity)
- BATCH (Manufacturing Declaration)
- PASSPORT (Individual Battery Lifecycle)

Each layer has distinct legal responsibility.

- Data must not be arbitrarily duplicated across layers.
- Snapshots may be embedded for audit reasons.

## 1. Tenant (Company-Level Compliance)

### Purpose

Defines who is legally responsible for the batteries.

### Mandatory (India)

- legal_company_name
- registered_address
- epr_registration_number (required)
- bis_r_number (required)
- iec_code (required)

If any are missing -> manufacturing/export is illegal.

### Mandatory (EU)

- manufacturer_name (required)
- manufacturer_address (required)
- eu_authorized_representative_name (required)
- eu_authorized_representative_address (required)
- eu_contact_email (required)

If missing -> EU Battery Passport is invalid.

### Optional

- Supporting documents (PDFs)
- Compliance certificates
- Branding info

## 2. Batch (Manufacturing Declaration — Most Important)

### Purpose

Represents how a group of batteries was manufactured. This is treated as a legal declaration.

### General Rules

- A batch is immutable once approved.
- Any change requires a new batch version.
- Passports inherit a snapshot of batch data.

### Mandatory (All Markets)

- batch_id
- model_name
- chemistry
- rated_capacity
- manufacturing_start_date
- manufacturing_end_date

### Mandatory (India)

- cell_source: `DOMESTIC` | `IMPORTED` (required)

If `IMPORTED`, then all are mandatory:

- bill_of_entry_number (required)
- country_of_origin (required)
- customs_clearance_date (required)

Additional:

- domestic_value_addition_percentage (required)
- pli_compliant_flag

If `pli_compliant_flag` = true and DVA < 50% -> invalid.

### Mandatory (EU)

- carbon_footprint (required)
- material_composition (required)
- hazardous_substances_declaration (required)
- recycled_content_percentage (required)
- expected_lifetime_cycles_or_years (required)
- warranty_period_months (required)

Missing any -> EU export blocked.

### Optional

- Certifications
- Internal QC notes
- BOM references (future)

## 3. Passport (Individual Battery Lifecycle)

### Purpose

Tracks what happens to one physical battery over time. A passport is never deleted.

### Mandatory Fields

- passport_uuid (required)
- serial_number (required)
- batch_snapshot (required)
- manufacturing_date (required)
- current_status (required)
- current_owner_identifier (required)

## 4. Passport Lifecycle (State Machine — Strict)

### Allowed States

- CREATED
- ACTIVE
- SHIPPED
- IN_SERVICE
- RETURNED
- RECYCLED
- END_OF_LIFE
- RECALLED (interrupt)

### Rules

- Transitions must be explicit and validated.
- Invalid transitions are forbidden.
- Every transition must generate an event.

### Mandatory Events per Transition

- previous_status
- new_status
- timestamp
- actor_type (`SYSTEM` | `USER` | `PARTNER`)
- actor_identifier
- source (`INTERNAL` | `MAGIC_LINK` | `API`)

## 5. EU-Specific Passport Requirements

### Mandatory (Dynamic Data)

- state_of_health_percentage (required)
- last_soh_update_timestamp (required)
- ownership_history (required)
- repair_events
- replacement_events

Static-only passports are non-compliant in EU.

## 6. India-Specific Passport Requirements

### Mandatory

- recycling_status (required)
- recycler_epr_id (required)
- recycling_date

### Not Required in India

- State of Health
- Lifetime tracking
- Ownership history

## 7. Audit & Enforcement (Critical)

### Audit Trail Rules

- Every mutation writes a PassportEvent.
- Events are append-only.
- Events are never editable.
- Missing events = compliance failure.

## 8. Access Model

### Internal Users

- Role-based (ADMIN, OPERATOR, VIEWER)
- All actions logged

### External Actors (Magic Link)

- Logistics -> SHIPPED
- Technician -> IN_SERVICE / RETURNED
- Recycler -> RECYCLED

### Permissions

- Explicit and minimal

## 9. Hard Block Rules (Do Not Ignore)

The system must block:

- EU passport generation if EU mandatory fields missing
- Batch activation if India compliance incomplete
- Export if SHIPPED event missing
- Recycling close if recycler not EPR-registered
- PLI claim if DVA < threshold

## 10. Explicitly Optional (Do Not Overbuild)

- Blockchain anchoring
- OEM integrations
- Cell-level tracing
- Predictive analytics
- Mobile apps

These must not affect core compliance logic.

## Design Philosophy (For AI + Humans)

- Treat Batch as a legal declaration
- Treat Passport as legal history
- Treat Events as evidence
- Assume a regulator will audit screenshots

## Final Rule (Absolute)

If a regulator, customs officer, or auditor views a passport:

Every visible field must be complete, explainable, and legally defensible.

---

# Codex DO / DO NOT Rules

(Authoritative behavioral constraints for all code, features, and decisions)

## Core Rule (Applies to Everything)

This system generates regulatory evidence, not UI data. Any shortcut that weakens auditability is a hard failure.

## Codex Must Do

### Architecture & Data Modeling

- Strictly separate TENANT, BATCH, and PASSPORT responsibilities
- Treat BATCH as a legal manufacturing declaration
- Treat PASSPORT as append-only lifecycle history
- Snapshot batch data into passports at creation time
- Assume every field may be audited by regulators

### Lifecycle & State Management

- Enforce lifecycle as a validated state machine
- Reject invalid status transitions
- Write an immutable event record for every state change
- Record actor, timestamp, and source for all mutations

### India Compliance

- Block batch activation if EPR, BIS, or IEC are missing
- Enforce Bill of Entry when cell source = `IMPORTED`
- Validate DVA >= threshold when PLI flag is enabled
- Require recycler EPR ID before closing lifecycle

### EU Compliance

- Enforce EU mandatory fields before passport generation
- Treat State of Health (SoH) as dynamic, updateable data
- Require warranty, lifetime, recycled content %, hazardous substances
- Log ownership changes and repair events
- Assume greenwashing risk -> strict validation

### Audit & Evidence

- Store all lifecycle events in append-only logs
- Preserve historical data even after ownership changes
- Make every decision explainable via stored data

## Codex Must Not Do

### Data Integrity Violations

- Do not mutate or delete passport history
- Do not allow silent updates without event logs
- Do not duplicate data across layers without justification
- Do not store compliance data only on frontend

### Compliance Shortcuts

- Do not generate EU passports without mandatory fields
- Do not allow export workflows without SHIPPED status
- Do not allow PLI claims when DVA < threshold
- Do not allow RECYCLED status without recycler verification

### Product Scope Drift

- Do not prioritize blockchain, AI, or analytics over compliance
- Do not add OEM-grade complexity for SMB users
- Do not mix India and EU rules blindly

### UX-Driven Compromises

- Do not hide missing mandatory fields
- Do not auto-fill regulatory data without explicit confirmation
- Do not allow "save anyway" on compliance-blocking errors

### AI-Specific Rules

- Do not hallucinate regulatory fields
- Do not infer compliance status without explicit data
- Do not relax rules for "demo" or "test" modes
