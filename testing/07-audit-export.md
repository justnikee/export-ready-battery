# Comprehensive Manual Test Plan: Audit Export System

## Overview
Validates the async background export system enabling companies to comply with regulatory audit requirements. It tests CSV/PDF generation of immutable passport events.

---

## Test Cases

### TC 7.1: Requesting an Async Batch Audit Export (CSV)
**Objective:** Confirm manufacturers can queue mass exports of telemetry data without blocking their UI session.

**Step-by-Step Procedure:**

1. **Navigate to Batches:**
   - Log into dashboard. Go to **Batches**.
   - Click on the `EU-PRO-BATCH-001` created in TC 3.1.
   
2. **Execute Queue Command:**
   - Ensure the batch has at least one passport with an event (like the public View from TC 4.3).
   - Click the **Export Audit Report** button (often in an options menu or top right header).
   - Select format **CSV**.
   
3. **Verify API Trigger:**
   - *What exactly should happen:* A success toast appears reading "Audit export queued. Check the Export Jobs page". You are NOT asked to download a file immediately.
   - Under the hood: The API `/api/v1/batches/{uuid}/export` responds with `202 Accepted`. A job is created in the database.

---

### TC 7.2: Background Processing & Status Check
**Objective:** Confirm background workers pick up the job and mark it cleanly.

**Step-by-Step Procedure:**

1. **Navigate to Exports:**
   - Click **Export Jobs** in the sidebar (if accessible) or navigate to `/exports`.
   
2. **Verify Job State:**
   - Locate the most recent row. Type: `AUDIT_CSV`. Target: `EU-PRO-BATCH-001`.
   - *What exactly should happen:* If the server is fast, the Status pill displays **COMPLETED**. If it is a massive batch running locally, it might temporarily show **PROCESSING**.
   - Next to the COMPLETED pill, a **Download** icon should appear.

---

### TC 7.3: Data Accuracy & Parsing Test
**Objective:** Ensure the generated CSV contains the proper delimiter format and correctly maps foreign UUIDs to human-readable actions.

**Step-by-Step Procedure:**

1. **Execute Download:**
   - Click the blue **Download** icon from TC 7.2.
   - *What exactly should happen:* The browser securely downloads a file named `audit_EU-PRO-BATCH-001_171452....csv` via an authenticated CDN or backend stream.

2. **Open and Audit:**
   - Open the `.csv` in Excel or Numbers.
   - **Header expectations:** `Event ID | Passport UUID | Action | Actor Interface | Timestamp | Encrypted Notes`
   - **Row expectations:** 
     - Find the row matching the public view tested in TC 4.3.
     - Ensure the `Action` says `VIEW`.
     - Ensure the `Timestamp` is in ISO-8601 or proper local timezone format.
     - Find the Recycler EOL action (if performed in same batch). Ensure `Notes` accurately reflect `Shredded and isolated 40% Cobalt mass.`.
   - *What exactly should happen:* All fields must map 1:1 with the `passport_events` Postgres table without any corrupted strings or unescaped commas breaking the CSV format.
