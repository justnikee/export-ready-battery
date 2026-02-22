# Comprehensive Manual Test Plan: Batch Creation & Carbon Footprint

## Overview
This document guides QA and developers through the strict requirements of generating battery batches. It covers conditional compliance rules (EU Recycled Content vs MoRTH India rules) and tests the accuracy of the dynamic carbon calculator.

---

## Test Cases

### TC 3.1: Create an EU-compliant Batch with Valid Recycled Data
**Objective:** Confirm a batch targeting the EU market properly mandates and records recycled material percentages.

**Step-by-Step Procedure:**

1. **Launch Creation Modal:**
   - Go to `Batches` > click **Create New Batch**.
   
2. **Input Basic Details:**
   - **Batch Name:** `EU-PRO-BATCH-001`
   - **Expected Yield:** `5000`
   - **Target Market:** Select `EU`.
   - *What exactly should happen:* The UI form dynamically reveals the "EU Regulation: Recycled Content" section.

3. **Input Recycled Material Parameters:**
   - **Cobalt:** `16.5` (%)
   - **Lithium:** `6.0` (%)
   - **Nickel:** `15.0` (%)
   - **Lead:** `85.0` (%)
   - *Action:* Click **Next: Carbon Footprint**.

4. **Input Carbon Manufacturing Data:**
   - **Grid Electricity:** `12500` kWh
   - **Renewable Electricity:** `5000` kWh
   - **Transport Distance:** `850` km
   - **Battery Weight:** `450` kg
   
5. **Execute Calculation:**
   - Click **Calculate Footprint**.
   - *What exactly should happen:* The system multiplies energy usage by EU grid emission factors. It returns a `Total kg CO2e` (e.g., around `8500 kg CO2e`). A detailed breakdown by Manufacturing, Transport, and Materials phases is rendered in a chart.

6. **Submit & Generate:**
   - Click **Submit & Generate**.
   - *Verify Final Expected Result:* The drawer closes. The Batches list immediately shows `EU-PRO-BATCH-001` with status `Verified`. 5000 passports begin queuing in the background.

---

### TC 3.2: Create an India-compliant Batch (MoRTH)
**Objective:** Confirm a batch targeting India completely drops EU constraints and executes Indian compliance checks.

**Step-by-Step Procedure:**

1. **Launch Creation Modal:**
   - Go to `Batches` > click **Create New Batch**.
   
2. **Input Basic Details:**
   - **Batch Name:** `IND-DOMESTIC-002`
   - **Expected Yield:** `250`
   - **Target Market:** Select `India`.
   - *What exactly should happen:* The "Recycled Content" fields are entirely hidden. A prompt for AIS Certification reference may appear if supported by the UI.

3. **Input Carbon Data & Execute:**
   - **Grid Electricity:** `2000` kWh
   - Click **Calculate Footprint**.
   - *What exactly should happen:* The system uses India-specific grid multipliers (historically higher carbon intensity than EU grid) from the `carbon_factors` table to compute the total footprint.

4. **Submit & Generate:**
   - Click **Submit & Generate**.
   - *Verify Final Expected Result:* Batch appears in the list with target market `India`. The `compliance_status` shows `Verified` (as EU recycled metrics are not required in India).

---

### TC 3.3: Carbon Footprint Re-evaluation
**Objective:** Verify that carbon metrics can be updated dynamically if inputs change before finalization.

**Step-by-Step Procedure:**

1. **Navigate to Existing Batch:**
   - Click into a newly created batch (e.g., `IND-DOMESTIC-002`).
   
2. **Re-calculate Scenario:**
   - Navigate to the **Carbon Footprint** tab (if a separate detailed view is implemented) or trigger a new test calc.
   - Change **Grid Electricity** from `2000` to `4000`.
   - Click **Update Calculation**.
   
3. **Verify Expected Result:**
   - The total emission value strictly doubles (e.g., if the multiplier is 0.82, `2000 * 0.82 = 1640`, the new result must immediately reflect `4000 * 0.82 = 3280`).

---

### TC 3.4: Activation Block (Missing Recycled Content Warning)
**Objective:** If a manufacturer attempts to circumvent the UI and submits an EU batch via API without recycled content, ensure the system throws a soft warning.

**Step-by-Step Procedure:**

1. **Execute Malformed API Submission:**
   - In terminal, run a POST request to `/api/v1/batches` setting `target_market: "EU"` but omitting `recycled_content_cobalt` etc.
   
2. **Navigate View:**
   - Log into dashboard to view the malformed batch.
   
3. **Verify Expected Result:**
   - The UI displays the `compliance_status` as `WARNING` or flags the batch visually.
   - Any attempt to activate Passports within this batch triggers a pop-up restricting passport transition to `ACTIVE` state until recycled parameters are updated.
