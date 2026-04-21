# Lifecycle Manual Test Plan

Tests all features shipped in Phases 1–8 of the Enterprise Compliance Roadmap.

**Prerequisites:**

- Both servers running: `backend` on `:8080`, `frontend` on `:3000`
- Logged in as a tenant admin
- At least one batch exists with ≥ 2 passports in `CREATED` status
- Email delivery working OR dev mode enabled (OTP printed in server logs)
- Browser with location access (for GPS tests) — use Chrome/Edge

**State machine reference:**

```
CREATED → [ACTIVATE] → ACTIVE → [SHIP] → SHIPPED → [INSTALL] → IN_SERVICE
IN_SERVICE / SHIPPED → [RECALL] → RECALLED → [RECYCLE] → RECYCLED → [CLOSE] → END_OF_LIFE
IN_SERVICE → [RECYCLE] → RECYCLED
```

---

## Test 1 — Full Lifecycle Walk-Through (Happy Path)

> Complete a passport from CREATED to END_OF_LIFE through the normal path. This validates the state machine, evidence enforcement, and single-row transition modal.

### 1.1 Activate

1. Go to **Lifecycle** (`/lifecycle`).
2. Find a passport with status **CREATED**. Click the `⋯` menu → **Activate**.
3. The transition modal opens. Notice it shows **Reason Code \*** and **Admin Note** fields.
4. Leave Reason Code blank → click **Confirm**.
   - **Expected:** Toast error or validation message — reason code is required for ACTIVATE.
5. Enter Reason Code: `BATCH_QC_PASS` and Admin Note: `Initial quality check passed`.
6. Click **Confirm**.
   - **Expected:** Success toast. Passport status changes to **ACTIVE**.

### 1.2 Ship

1. Find the same passport, now **ACTIVE**. Click `⋯` → **Ship**.
2. The modal shows two required fields: **Shipment Reference** and **Shipment Date**.
3. Leave both blank → click **Confirm**.
   - **Expected:** Toast error — evidence fields are required.
4. Fill in:
   - Shipment Reference: `AWB-20260422-001`
   - Shipment Date: `2026-04-22`
5. Click **Confirm**.
   - **Expected:** Success. Status → **SHIPPED**.

### 1.3 Install

1. Passport is now **SHIPPED**. Click `⋯` → **Install**.
2. Fill in:
   - Installation Date: `2026-04-22`
   - Installer ID: `TECH-4431`
3. Click **Confirm**.
   - **Expected:** Status → **IN_SERVICE**.

### 1.4 Recycle (without OTP — from dashboard, not magic link)

1. Passport is **IN_SERVICE**. Click `⋯` → **Recycle**.
2. Fill in:
   - Recycler EPR ID: `EPR-7890`
   - Recycling Date: `2026-04-22`
   - Certificate Reference: `CERT-RC-2026-001`
3. Click **Confirm**.
   - **Expected:** Status → **RECYCLED**.

### 1.5 Close (End of Life)

1. Passport is **RECYCLED**. Click `⋯` → **Close** (labelled "End of life" in some views).
2. Fill in:
   - Certificate Reference: `CERT-RC-2026-001`
3. Click **Confirm**.
   - **Expected:** Status → **END_OF_LIFE**. No further actions available in the `⋯` menu.

---

## Test 2 — Reason Codes & Admin Notes (Phase 1)

> Verifies that reason codes and admin notes are stored in the event record.

### 2.1 Reason code on ACTIVATE

1. Activate a fresh CREATED passport with:
   - Reason Code: `MANUAL_OVERRIDE`
   - Admin Note: `Manually approved by compliance officer`
2. After activation, click `⋯` → **View events** on that passport.
3. Find the ACTIVATE event row.
   - **Expected:** An amber badge shows `MANUAL_OVERRIDE`. The admin note is displayed in italic text below the actor line.

### 2.2 Reason code on other transitions

1. With an ACTIVE passport, click `⋯` → **Ship**.
2. Notice the modal also has **Reason Code** and **Admin Note** optional fields.
3. Enter Reason Code: `URGENT_LOGISTICS` and fill required evidence. Confirm.
4. Open **View events** for this passport.
   - **Expected:** The SHIP event row shows the `URGENT_LOGISTICS` badge.

### 2.3 Empty reason code on non-ACTIVATE

1. With an ACTIVE passport, click `⋯` → **Ship**, fill evidence, leave Reason Code empty.
2. Confirm.
   - **Expected:** Succeeds — reason code is only _required_ for ACTIVATE. No badge shown in events.

---

## Test 3 — Document Upload & Hash Attachment (Phase 2)

> Verifies that a document can be attached to a transition and its SHA-256 hash appears in the event audit trail.

### 3.1 Upload document on SHIP transition

1. With an ACTIVE passport, click `⋯` → **Ship**.
2. In the modal, find the **Attach document** section.
3. Click **Choose file** and select any small PDF or image from your machine.
4. Optionally enter a label: `Shipping certificate`.
5. Click **Upload** (or the upload button next to the file input).
   - **Expected:** Filename and SHA-256 hash appear below the upload button. The "Choose file" button is replaced with the file info.
6. Fill in required evidence fields and click **Confirm**.
   - **Expected:** Success toast. Status → **SHIPPED**.

### 3.2 Verify document in events

1. Click `⋯` → **View events** for the same passport.
2. Find the SHIP event row.
   - **Expected:** A paperclip link `📎 Shipping certificate` (or filename) is visible next to the action name.
3. Click the paperclip link.
   - **Expected:** A document detail modal opens showing:
     - Filename
     - Label (if entered)
     - SHA-256 hash (full hex string)
     - Upload date
     - Download link

### 3.3 Negative — missing document upload

1. Open the transition modal for any action with the doc attachment section.
2. Select a file but do **not** click Upload (leave it unuploaded).
3. Try to Confirm.
   - **Expected:** The uploaded file ID is not included in the payload; transition succeeds without a document attachment. No error — document is optional.

---

## Test 4 — GPS Capture (Phase 3)

> Verifies that the browser geolocation is captured silently during a transition and appears as a GPS pin in the events panel.

### 4.1 Allow location on transition

1. Ensure your browser will share location when asked (check browser address bar permissions icon).
2. With a SHIPPED passport, click `⋯` → **Install**.
3. Fill in evidence. Click **Confirm**.
4. If the browser prompts for location access → click **Allow**.
   - **Expected:** Success toast. No location error shown.
5. Click `⋯` → **View events** on this passport.
6. Find the INSTALL event row.
   - **Expected:** A green `📍 GPS` link appears next to the action badge.
7. Click the GPS link.
   - **Expected:** Opens OpenStreetMap in a new tab, centred on your location.

### 4.2 Deny location

1. Block location access for `localhost` in browser settings (or click Deny when prompted).
2. Perform any transition (e.g., SHIP an ACTIVE passport).
   - **Expected:** A toast warning appears: "Location not captured — audit record will note this". The transition still succeeds.
3. View events for this passport.
   - **Expected:** No `📍 GPS` link on that event row.

---

## Test 5 — EPCIS Export (Phase 4)

> Verifies that the EPCIS/GS1 event document is generated and downloaded correctly.

### 5.1 Export EPCIS for a passport with events

1. Find any passport that has at least one lifecycle event (ACTIVE or beyond).
2. Click `⋯` → **Export EPCIS**.
   - **Expected:** A file named `passport_<uuid>_epcis.jsonld` downloads automatically.
3. Open the file in any text editor.
   - **Expected:**
     - Valid JSON-LD document.
     - Contains `"@context"` with GS1/EPCIS namespace references.
     - Contains `"epcList"` or equivalent with the passport's serial/SGTIN.
     - Each lifecycle event appears as an EPCIS `ObjectEvent`.
     - Each event has `eventTime`, `action`, `bizStep`, `disposition`.

### 5.2 Export for passport with no events

1. Find a **CREATED** passport that has never been transitioned.
2. Click `⋯` → **Export EPCIS**.
   - **Expected:** File downloads. May contain an empty events array or a single CREATION event — no error.

### 5.3 Negative — failed export

1. With the backend stopped, click **Export EPCIS**.
   - **Expected:** Toast error: "Failed to export EPCIS document". No broken download.

---

## Test 6 — Proof Viewer / Events Panel (Phase 6)

> Verifies the full events panel UI — event list, GPS links, reason code badges, document paperclip links, and document detail modal.

### 6.1 Open the panel

1. Navigate to a passport that has gone through multiple transitions (ideally ACTIVATE → SHIP → INSTALL with GPS, reason code, and document all captured — use the passport from Tests 1-4 above).
2. Click `⋯` → **View events**.
   - **Expected:** A dialog opens titled "Lifecycle events — `<serial>`".

### 6.2 Event rows

For each event row in the panel, verify:

- Action name or event type shown in bold.
- Status transition shown as e.g. `ACTIVE → SHIPPED`.
- Timestamp (locale format) on the right side.
- Actor email and role shown below: `by user@example.com (LOGISTICS)`.

### 6.3 Reason code badge

1. Find the ACTIVATE event (if you used `BATCH_QC_PASS` in Test 1).
   - **Expected:** Amber rounded badge `BATCH_QC_PASS` next to the action name.

### 6.4 GPS link

1. Find the INSTALL event (if GPS was captured in Test 4.1).
   - **Expected:** Green `📍 GPS` link. Click it → OpenStreetMap opens in new tab.

### 6.5 Document paperclip

1. Find the SHIP event (if a doc was attached in Test 3.1).
   - **Expected:** `📎 Shipping certificate` (or filename) link next to the action name.
2. Click the paperclip link.
   - **Expected:** Document detail modal opens with filename, label, SHA-256 hash, upload date, and a **Download** link.
3. Click **Download**.
   - **Expected:** The original file downloads from the server.

### 6.6 Panel for passport with no events

1. Find a brand-new CREATED passport.
2. Click `⋯` → **View events**.
   - **Expected:** Panel opens with message: "No events recorded yet."

### 6.7 Loading state

1. Throttle your network to Slow 3G in DevTools.
2. Click `⋯` → **View events**.
   - **Expected:** A spinner is shown while loading; events appear after load completes.

---

## Test 7 — OTP Gate for RECYCLE / RECALL (Phase 7)

> These tests require the magic link flow (external partner). The OTP gate fires when a magic link is for RECYCLE or RECALL action.

### 7.1 Setup — send a RECYCLE magic link

1. Find a passport in **IN_SERVICE** status.
2. Click `⋯` → **Send magic link**.
3. In the modal:
   - Enter an email address you can receive email on (or a test address).
   - Select role: **Recycler**.
   - Select action: **Recycle**.
4. Click **Send**.
   - **Expected:** "Magic link sent" success state in modal.

### 7.2 Open the magic link

1. Check your email for the magic link (subject contains "ExportReady").
2. Click the link — it opens `/p/<uuid>/action?token=<jwt>` in the browser.
   - **Expected:** The action page loads and shows the passport info and allowed action (RECYCLE).

### 7.3 Trigger the OTP gate

1. Select the **Recycle** action. Fill in all required evidence:
   - Recycler EPR ID: `EPR-7890`
   - Recycling Date: `2026-04-22`
   - Certificate Reference: `CERT-RC-2026-002`
2. Click **Confirm Action**.
   - **Expected:**
     - The page transitions to the **Security Verification** screen (amber shield icon).
     - Message: "A 6-digit code was sent to your email. Enter it below to confirm this action."
     - A 6-digit number input and a **Verify Code** button are shown.
     - **The normal action form is no longer visible.**

### 7.4 Check server logs for OTP (dev mode)

1. In the backend terminal, look for a log line containing the OTP code:
   ```
   OTP issued  otp=123456  token_hash=...
   ```
   Note the 6-digit code.

### 7.5 Enter correct OTP

1. Enter the 6-digit code from the log (or email if email delivery is working).
2. Click **Verify Code**.
   - **Expected:**
     - Spinner briefly shown on button.
     - Page transitions to the **success / trophy screen**.
     - Shows the new status: `RECYCLED`.
     - Confetti animation fires.

### 7.6 Verify state in Lifecycle

1. Return to the Lifecycle page (`/lifecycle`).
2. Find the passport.
   - **Expected:** Status is now **RECYCLED**.

### 7.7 Wrong OTP

1. Repeat steps 7.1–7.3 with a **different** IN_SERVICE passport, getting a new magic link.
2. On the OTP screen, enter `000000` (wrong code).
3. Click **Verify Code**.
   - **Expected:** Red error message: "Invalid OTP (4 attempts remaining)" (decrements each try).
4. Keep entering wrong codes.
   - **Expected:** After 5 failed attempts → error message: "Too many attempts. Please request a new magic link." The Verify button may become disabled.

### 7.8 Resend OTP

1. On the OTP screen (after a failed attempt), click **Resend code**.
   - **Expected:**
     - Button immediately shows "Resend in 60s" and counts down.
     - A new OTP is issued (check backend logs).
     - Old OTP no longer works; new OTP succeeds.
2. Click **Resend code** while the countdown is running.
   - **Expected:** Button is disabled — cannot resend during cooldown.
3. Wait for countdown to reach 0.
   - **Expected:** Button re-enables and shows "Resend code".

### 7.9 RECALL also triggers OTP

1. Find a passport in **ACTIVE** or **SHIPPED** or **IN_SERVICE** status.
2. Send a RECALL magic link (role: Admin, action: Recall).
3. Click the link, select Recall, fill in:
   - Recall Reason: `Battery thermal runaway risk`
   - Recall Reference: `INC-2026-001`
4. Click **Confirm Action**.
   - **Expected:** OTP verification screen appears (same as RECYCLE).

### 7.10 Non-OTP actions (SHIP, INSTALL) do NOT trigger OTP

1. Send a SHIP magic link to a logistics partner for an ACTIVE passport.
2. Click the link, select Ship, fill in evidence, click **Confirm Action**.
   - **Expected:** Transitions directly to the success screen — **no OTP screen** appears.

---

## Test 8 — Batch Bulk Action (Phase 8)

> Verifies that multiple passports can be transitioned in one operation with a single set of evidence.

### 8.1 Select passports on the page

1. Go to Lifecycle. Filter by status **CREATED** (use the status funnel at the top).
2. Check 2–3 individual passport rows using the checkboxes.
   - **Expected:** A selection toolbar appears at the bottom (or top) of the table showing "2 selected" with an action dropdown and Apply button.

### 8.2 Bulk ACTIVATE

1. With 2 CREATED passports selected, choose **Activate** from the bulk action dropdown.
2. Click **Apply**.
   - **Expected:** Bulk confirmation modal opens titled "Confirm: ACTIVATE 2 passports".
3. The modal shows required fields:
   - Reason Code \*
   - Admin Note (optional)
4. Leave Reason Code blank → click **Confirm**.
   - **Expected:** Validation error or toast — reason code is required.
5. Enter Reason Code: `BATCH_QC_PASS`.
6. Click **Confirm**.
   - **Expected:**
     - Progress bar animates.
     - Toast: "2 passport(s) → ACTIVATE".
     - Both passports now show **ACTIVE** status.
     - Selection is cleared.

### 8.3 Select all passports across pages

1. Filter by status **ACTIVE**.
2. Click the **checkbox in the table header** to select all passports on the current page.
   - **Expected:** A blue banner appears: "All `<N>` passports on this page are selected. Select all `<total>` passports."
3. Click **Select all `<total>` passports**.
   - **Expected:** Banner changes to "All `<total>` passports are selected. Clear selection."
4. Choose action **Ship** and click **Apply**.
5. In the modal fill in:
   - Shipment Reference: `BULK-AWB-20260422`
   - Shipment Date: `2026-04-22`
6. Click **Confirm**.
   - **Expected:**
     - Progress bar runs, status message updates (e.g., "Fetching passport IDs…", "Applying Ship…").
     - Final toast shows total transitioned.
     - All selected passports → **SHIPPED**.

### 8.4 Mixed-status bulk action (partial success)

1. Select a mix of CREATED and ACTIVE passports.
2. Choose **Activate** from the dropdown and click Apply.
3. Enter Reason Code and confirm.
   - **Expected:**
     - Progress bar runs.
     - Toast warning: "N transitioned, M failed" (the ACTIVE ones cannot be activated again).
     - Table refreshes — CREATED ones became ACTIVE; ACTIVE ones unchanged.

### 8.5 Bulk action with evidence fields

1. Select 2–3 SHIPPED passports.
2. Choose **Install** and Apply.
3. In the modal fill in:
   - Installation Date: `2026-04-22`
   - Installer ID: `TECH-BULK-001`
4. Confirm.
   - **Expected:** All selected passports → **IN_SERVICE** with the same evidence embedded in each event.

### 8.6 Clear selection

1. Select some passports.
2. Click the **X** (clear) button in the selection toolbar.
   - **Expected:** All checkboxes deselected, toolbar disappears.

---

## Test 9 — Status Filter & Funnel

> Sanity test for the status filter — not a new feature but verifies counts are correct after the above transitions.

1. Go to Lifecycle.
2. The status funnel at the top shows coloured chips: CREATED, ACTIVE, SHIPPED, IN_SERVICE, RECALLED, RECYCLED, END_OF_LIFE.
3. Click each chip.
   - **Expected:** Table filters to that status. Count on chip matches table row count.
4. Click **ALL** chip.
   - **Expected:** All passports shown again.

---

## Test 10 — Search & Batch Filter

1. Type a partial serial number into the **search box**.
   - **Expected:** Table updates within ~300ms debounce to show only matching passports.
2. Select a specific batch from the **batch dropdown**.
   - **Expected:** Table shows only passports belonging to that batch.
3. Combine search + batch + status filter.
   - **Expected:** All three filters apply together. Passport count shown accurately.

---

## Summary Checklist

| Test    | Feature                                               | Expected Pass |
| ------- | ----------------------------------------------------- | ------------- |
| 1       | Full lifecycle CREATED → END_OF_LIFE                  | ☐             |
| 2.1–2.3 | Reason codes & admin notes                            | ☐             |
| 3.1–3.3 | Document upload & hash in events                      | ☐             |
| 4.1–4.2 | GPS capture (allow + deny)                            | ☐             |
| 5.1–5.3 | EPCIS download (.jsonld)                              | ☐             |
| 6.1–6.7 | Proof viewer — events, GPS, badges, doc modal         | ☐             |
| 7.3–7.5 | OTP screen appears for RECYCLE; correct code succeeds | ☐             |
| 7.7     | Wrong OTP decrements attempts; locks at 5             | ☐             |
| 7.8     | Resend OTP with 60s cooldown                          | ☐             |
| 7.9     | RECALL also triggers OTP                              | ☐             |
| 7.10    | SHIP does NOT trigger OTP                             | ☐             |
| 8.1–8.2 | Bulk ACTIVATE with reason code                        | ☐             |
| 8.3     | Select-all across pages + bulk SHIP                   | ☐             |
| 8.4     | Mixed-status bulk (partial success toast)             | ☐             |

---

## Known Limitations (as of this session)

- **Migration 000049 must be applied** to Supabase before OTP tests will work. Run the migration SQL against your Supabase project before Test 7.
- **OTP email** is not yet wired to the email service on the initial `TransitionWithMagicLink` call — check backend logs for the code. The `ResendOTP` endpoint does log/send the code.
- `CLOSE` action requires the **recycler** who performed the prior `RECYCLE` event — it cannot be done by a different recycler account.
