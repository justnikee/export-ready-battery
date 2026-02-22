# Comprehensive Manual Test Plan: Public Passport UI & i18n

## Overview
This document guides testing the public-facing Passport Viewer (`/p/{uuid}`). It verifies QR code ingestion, translation rendering (EN, FR, DE), dynamic unauthenticated data gating, and event tracking.

---

## Test Cases

### TC 4.1: Public Passport Retrieval & Rendering
**Objective:** Confirm standard unauthenticated users can access basic passport data.

**Step-by-Step Procedure:**

1. **Obtain Active UUID:**
   - In the Manufacturer Dashboard, navigate to an Active batch and copy a specific passport UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`).

2. **Access Viewer:**
   - Open an Incognito window.
   - Navigate to `http://localhost:3000/p/550e8400-e29b-41d4-a716-446655440000`.

3. **Verify UI Rendering Requirements:**
   - *What exactly should happen:* The passport UI successfully loads.
   - Basic Product Details (Battery ID, Manufacturer Name, Serial Number) must be clearly visible.
   - The Unified Performance Score (e.g., 85/100) displays dynamically.
   - *Data Gating Check:* Based on `TC 2.3`, check to ensure restricted data fields are blurred out, hidden, or locked (e.g., Battery Chemistry should be hidden from the public).

---

### TC 4.2: Localization/i18n Switching (EN / FR / DE)
**Objective:** Verify compliance with EU language laws requiring passports to be legible in member state languages.

**Step-by-Step Procedure:**

1. **Default English State:**
   - Continue from TC 4.1 in the Incognito window.
   - Observe header labels. Expect: `Safety Information`, `Disposal Details`, `Labels & Certifications`.

2. **Switch to French:**
   - Locate the language selector dropdown (top right navigation).
   - Select `Français (FR)`.
   - *Verify Result:* Immediate UI flash. "Safety Information" instantly changes to `Consignes de sécurité`. The "Disposal" tab changes to `Élimination`. Warnings translate properly into French.

3. **Switch to German:**
   - Select `Deutsch (DE)` from the dropdown.
   - *Verify Result:* "Safety Information" becomes `Sicherheitstechnische Hinweise`. EU Directives text maps to appropriate German legal translations found in `de.json`.

---

### TC 4.3: Action Telemetry & View Logging
**Objective:** Confirm public user interactions generate immutable trails.

**Step-by-Step Procedure:**

1. **Execute Tracked Action:**
   - While still on the German or French Passport layout, click the **Report Issue** or **View Safety Guide** interaction button.
   
2. **Verify Database Trigger:**
   - Switch back to database/terminal. Queries the `passport_events` table for `passport_id = '550e8400...'`.
   - *What exactly should happen:* The database has registered a new row. `action`="VIEW", `actor_id`="PUBLIC" (or unauthenticated IP hash), and the timestamp maps accurately to the exact moment the button was clicked.
