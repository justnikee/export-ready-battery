# Comprehensive Manual Test Plan: Data Access Tokens

## Overview
Validates the authorization flow enabling Regulators and Supply Chain Partners to view restricted data on Battery Passports without requiring them to create a manufacturer account.

---

## Test Cases

### TC 5.1: Generate a Targeted Access Token
**Objective:** Create a time-limited authentication token with specific roles.

**Step-by-Step Procedure:**

1. **Navigate to Token UI:**
   - Log in as the existing Manufacturer (`jane.tester+1@example.com`).
   - Go to **Settings** > **Data Visibility Configuration**.

2. **Configure New Token:**
   - Click the **Generate Token** button.
   - **Target Audience:** `Ministry of Environment, Forest and Climate Change (India)`
   - **Access Level:** Select `REGULATOR`.
   - **Expiry Date:** Select a date exactly 30 days from today.

3. **Execute Generation:**
   - Click **Generate & Copy**.
   - *What exactly should happen:* The modal closes. A toast confirms generation. The clipboard receives a token like `er_tok_abc123def456`. A new row appears in the Active Tokens table displaying "Regulator" and the expiry date.

---

### TC 5.2: Authenticating a Restricted Passport View
**Objective:** Confirm a generated token actually unlocks restricted database fields for a third-party viewer.

**Step-by-Step Procedure:**

1. **Prep Restricted View:**
   - Note the ID of a Passport from the Batches page (e.g., `550e8400-e29b-41d4-a716-446655440000`).
   - Open an Incognito window to simulate the Indian MoEFCC agent.
   - Go to `http://localhost:3000/p/550e8400-e29b-41d4-a716-446655440000`.
   - *Verification:* Note that Battery Composition is currently locked out (based on TC 2.3 rules).

2. **Authenticate with Token:**
   - In the URL bar, append the copied token: `?access_token=er_tok_abc123def456`.
   - Press Enter.
   - *What exactly should happen:* The `layout.tsx` wrapper dynamically validates the token against the backend `verify` endpoint. 

3. **Verify Unlocked State:**
   - A persistent banner appears reading **Regulator Mode Active**.
   - Scroll down to Battery Composition.
   - *What exactly should happen:* The lock icons are gone. The exact percentages (e.g., Cobalt 16.5%) inputted in TC 3.1 are now brightly visible.

---

### TC 5.3: Token Revocation Security Check
**Objective:** Ensure stolen or expired tokens can be killed instantly by the manufacturer.

**Step-by-Step Procedure:**

1. **Revoke the Token:**
   - Switch back to the Manufacturer dashboard (Settings > Tokens).
   - Find the MoEFCC token row. Click the red **Revoke** icon.
   - Click **Confirm/Revoke** in the warning modal.
   - *What exactly should happen:* The row disappears from the Active Tokens UI. The token's database record is updated with `revoked = true` or `expires_at = NOW()`.

2. **Test Revoked Access:**
   - Switch back to the Incognito MoEFCC window.
   - Refresh the page, maintaining the `?access_token=er_tok_abc...` in the URL.
   - *What exactly should happen:* The token validation fails. The page loads strictly in **Public View**. The Battery Composition data is instantly locked again. An audit log is silently recorded documenting the unauthorized access attempt with a revoked token.
