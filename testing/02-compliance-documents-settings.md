# Comprehensive Manual Test Plan: Compliance Vault & Settings

## Overview
This document guides the granular testing of the Settings page. This includes validating that file uploads are strictly validated, that regulatory documents integrate into the Compliance Vault, and that Data Visibility Tiers correctly map to the database schema.

---

## Test Cases

### TC 2.1: View and Update Administrative Information
**Objective:** Confirm basic profile updates save to the database.

**Step-by-Step Procedure:**
1. **Navigate:** Log in as an onboarded Manufacturer and go to the `Settings` page (left sidebar).
2. **Modify Dummy Data:**
   - Under `Company Details`:
     - **Support Email:** `updated-support@volttech.com`
     - **Website:** `https://www.volttech-europe.com`
3. **Execute:** Scroll down and click **Save Changes**.
4. **Verify Final Expected Result:**
   - A success toast reading "Settings updated successfully" appears.
   - Refuse to trust the client state. Press `CTRL+R` (Cmd+R) to hard refresh the page.
   - *What exactly should happen:* The input fields re-populate with `updated-support@volttech.com` directly from the backend API `/api/v1/auth/me`.

---

### TC 2.2: Compliance Vault File Validation (EPR, BIS, PLI)
**Objective:** Ensure the system securely accepts regulatory PDF documents while rigidly blocking malicious or incorrect file types (e.g., massive files, ZIP payloads, fake PDFs).

**Prerequisites:** 
- Keep a simple `test.pdf` (under 1MB) and an image file `fake-doc.png` on your desktop.

**Step-by-Step Procedure:**

1. **Test Malicious/Invalid Upload:**
   - Scroll to **Compliance Vault**. Under **EPR Certificate**, click **Upload**.
   - Select the `fake-doc.png` file.
   - *What exactly should happen:* The upload immediately aborts. A red toast notification appears saying "Only PDF files are allowed". No network request is sent to the backend.

2. **Test Valid Upload:**
   - Under **EPR Certificate**, click **Upload**.
   - Select the `test.pdf` file.
   - *What exactly should happen:* A loading spinner (`Loader2`) replaces the Upload icon. The browser sends a `multipart/form-data` POST request to `/settings/upload-document`.
   
3. **Verify Upload Success State:**
   - The UI updates. The upload button changes to "Replace".
   - A badge appears reading `⏳ Verification Pending`.
   - A new interaction link labeled **View** appears.
   
4. **Test Document Retrieval:**
   - Click the **View** link.
   - *What exactly should happen:* A new browser tab opens pointing to `http://localhost:8080/api/v1/settings/documents/epr?token=YOUR_JWT`. The PDF is securely streamed and rendered by the browser's native PDF viewing engine.

---

### TC 2.3: Data Visibility Configuration Rules
**Objective:** Confirm that selecting privacy tiers modifies the underlying JSON representation.

**Step-by-Step Procedure:**

1. **Locate Data Visibility Table:**
   - Scroll to the "Data Visibility Configuration" panel.

2. **Modify Visibility Tiers:**
   - Row 1: `Battery Chemistry & Composition` -> Change dropdown to **Regulators Only**.
   - Row 2: `Lifecycle & Performance Metrics` -> Change dropdown to **Partners & Regulators**.
   - Row 4: `Compliance Certificates` -> Change dropdown to **Public (Everyone)**.

3. **Execute Save:**
   - Click **Save Changes** at the bottom of the page.

4. **Verify Database State:**
   - Wait for the success toast.
   - Refresh the page to ensure the dropdowns retain their selections.
   - *Under the hood expectaion:* The API payload sent contained `"data_visibility": {"battery_composition": "REGULATOR", "lifecycle_metrics": "PARTNER", "compliance_docs": "PUBLIC"}`. This is serialized into the `users` table `data_visibility` JSONB column.

---

### TC 2.4: Update MoRTH & EU Representative Details
**Objective:** Ensure heavily scrutinized legal representative fields update properly.

**Step-by-Step Procedure:**
1. Scroll to `India Regulatory Information (MoRTH)`. Update **EPR Registration Number** to `EPR-UPDATE-TEST-99`.
2. Scroll to `EU Authorized Representative`. Update **Contact Email** to `legal@volttech-europe-hubs.de`.
3. Click **Save Changes**.
4. **Expected Result:** The fields update successfully. If you generate a new batch tomorrow, these updated details will immediately be attached to the new passports.
