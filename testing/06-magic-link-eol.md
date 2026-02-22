# Comprehensive Manual Test Plan: Magic Link & EOL Recycling

## Overview
Checks the end-of-life workflow where a certified recycler securely closes a passport through a Magic Link authorization flow without needing a full CMS account.

---

## Test Cases

### TC 6.1: Requesting a Magic Link (Recycler View)
**Objective:** Allow third parties scanning the physical battery to request digital closure rights.

**Step-by-Step Procedure:**

1. **Access Passport:**
   - As an unauthenticated user, navigate to `http://localhost:3000/p/{uuid}` representing a physically retrieved battery.
   
2. **Execute Request:**
   - Click the prominently displayed **Report End of Life** or **Partner Login** button.
   - A modal requires identification.
   - **Enter Email:** `disposal-tech@euro-recycle.de`
   - **Enter Notes:** `Battery physically captured at Frankfurt hub. Processing for shredding. Need closure.`
   - Click **Request Access token**.

3. **Verify Request State:**
   - *What exactly should happen:* The UI shows "Request Sent to Manufacturer". An email sequence triggers off the backend aiming for the Manufacturer's `support_email`.

---

### TC 6.2: Manufacturer Approves Request
**Objective:** Confirm manufacturers can issue safe, time-boxed token links.

**Step-by-Step Procedure:**

1. **Review Request:**
   - Log in as the Manufacturer to the main Dashboard.
   - Navigate to **Incoming Requests** or check terminal for intercepted Mailtrap links.
   
2. **Approve Magic Link Generation:**
   - Locate the request from `disposal-tech@euro-recycle.de`.
   - Click **Approve & Generate Magic Link**.
   - *What exactly should happen:* A highly secure, JWT-backed URL is created. E.g., `http://localhost:3000/p/{uuid}/action?token=xyz...`. This URL grants exactly one permission: Editing status of _this specific UUID_.

---

### TC 6.3: Recycler Closes the Passport
**Objective:** Update immutable state and formally end the passport's lifecycle.

**Step-by-Step Procedure:**

1. **Follow Magic Link:**
   - Open an incognito window. Paste the Magic Link generated in TC 6.2.
   - *What exactly should happen:* The user bypasses standard login. The UI renders the Passport view with an injected **Recycler Control Panel**.

2. **Submit End-of-Life:**
   - In the Control Panel, locate the **Update Status** dropdown.
   - Change Status from `Active` to `Closed (Recycled)`.
   - **Compliance Certificate Ref:** `DE-EPR-R-10023`
   - **Notes:** `Shredded and isolated 40% Cobalt mass.`
   - Click **Submit Closure Record**.

3. **Verify Action:**
   - *What exactly should happen:* The API receives the request, updates the `passports` table status. Inserts a permanent row in `passport_events` with the Notes payload.

---

### TC 6.4: Validate Immutable Closed Status (Public View)
**Objective:** Prevent closed passports from appearing active to future scanners.

**Step-by-Step Procedure:**

1. **Test Public Scanner:**
   - Close incognito. Reopen a standard public view `http://localhost:3000/p/{uuid}` without any token.
   
2. **Verify UI State:**
   - *What exactly should happen:* The top of the passport features a heavy red or gray banner reading: **⚠️ RECylCED / END OF LIFE**.
   - Performance and active operational stats are archived.
   - Disposal records and notes (`Shredded...`) are explicitly visible to verify legal chain of custody.
