# Comprehensive Manual Test Plan: Authentication & Onboarding

## Overview
This document meticulously details the steps to verify the authentication and onboarding workflows for manufacturers on the AnvayaLabs Battery platform, ensuring complete validation of all required regulatory states.

---

## Test Cases

### TC 1.1: Complete New User Registration & Onboarding Lifecycle
**Objective:** Verify that a brand new user can register, authenticate, and complete the mandatory regulatory onboarding flow before accessing the dashboard.

**Prerequisites:** 
- A clean browser session (Incognito recommended)
- Access to Mailtrap (or server terminal proxy logs) to retrieve Magic Links if testing without standard Passwords enabled in the local environment.

**Step-by-Step Procedure:**

1. **Navigate to Registration:**
   - Open browser and go to: `http://localhost:3000/register`
   
2. **Input Dummy Registration Data:**
   - **Full Name:** `Jane Doe Tester`
   - **Company Name:** `VoltTech Manufacturing Ltd.`
   - **Email:** `jane.tester+1@example.com` (Use a "+1" alias so you can repeat this easily)
   - **Password:** `StrongTestPass123!`

3. **Submit Registration:**
   - Click the **Create Account** button.
   - *What exactly should happen:* The UI should display a loading spinner. The backend creates the `users` and `tenants` records. The UI redirects to `/login` or `/onboarding` immediately.

4. **Verify Session & Redirect to Onboarding:**
   - Log in using `jane.tester+1@example.com` and `StrongTestPass123!`.
   - *What exactly should happen:* The system detects `onboarding_completed: false`. You must be forcibly redirected to `http://localhost:3000/onboarding`. You cannot access `/dashboard` if you type it in the URL bar manually.

5. **Onboarding Step 1: Company Profile:**
   - **Company Address:** `123 Innovation Drive, Tech Park, Berlin 10115`
   - **Support Email:** `support@volttech-test.com`
   - **Corporate Website:** `https://www.volttech-test.com`
   - *Action:* Click **Next: Regulatory Info**.

6. **Onboarding Step 2: Global Regulations:**
   - **MoRTH EPR Number (India):** `EPR-BATT-2025-998877`
   - **BIS R-Number (India):** `R-12345678`
   - **IEC Code:** `0987654321`
   - *Action:* Click **Next: EU Representation**.

7. **Onboarding Step 3: EU Representation (EU Battery Regulation):**
   - **Representative Name:** `VoltTech EU Compliance Services`
   - **Representative Address:** `Suite 45, EU Business Hub, Brussels 1000, Belgium`
   - **Contact Email:** `eu-rep@volttech-test.com`
   - *Action:* Click **Complete Onboarding**.

8. **Verify Final Expected Result:**
   - *What exactly should happen:* The dashboard spinner appears. The backend updates the `users` table, saving all regulatory fields and flipping `onboarding_completed` to `true`.
   - The user is successfully redirected to `http://localhost:3000/dashboard`. 
   - Refreshing the page keeps you on the dashboard.

---

### TC 1.2: Existing User Login (Skipping Onboarding)
**Objective:** Confirm a fully onboarded user bypasses the onboarding screens entirely.

**Step-by-Step Procedure:**

1. **Navigate to Login:**
   - Open: `http://localhost:3000/login`
   
2. **Input Existing Credentials:**
   - Use the `jane.tester+1@example.com` account created in TC 1.1.
   
3. **Submit:**
   - Click **Login**.
   
4. **Verify Final Expected Result:**
   - *What exactly should happen:* The backend returns an auth token. The React AuthContext verifies `onboarding_completed` is `true`. The browser immediately navigates to `/dashboard`. At no point is `/onboarding` flashed on the screen.

---

### TC 1.3: Forgot Password Flow
**Objective:** Verify password recovery correctly generates secure tokens.

**Step-by-Step Procedure:**

1. **Navigate to Reset Request:**
   - Go to `http://localhost:3000/forgot-password`
   
2. **Request Link:**
   - Enter `jane.tester+1@example.com` and click **Send Reset Link**.
   - *What exactly should happen:* A success toast appears. 

3. **Verify Email/Logs:**
   - Open Terminal where the Go server is running OR open Mailtrap (if SMTP is configured).
   - Find the URL resembling: `http://localhost:3000/reset-password?token=er_pw_xxxxx`
   
4. **Execute Reset:**
   - Navigate to that exact URL in the browser.
   - Enter New Password: `NewStrongPass456!`
   - Click **Reset Password**.

5. **Verify Final Expected Result:**
   - *What exactly should happen:* Backend hashes the new password and invalidates the `er_pw_` token. User is redirected to login and can successfully log in with `NewStrongPass456!`.

---

### TC 1.4: Magic Link Authentication (Recycler / Partner Flow)
**Objective:** Verify that third parties can authenticate into restricted passport views without traditional passwords.

**Step-by-Step Procedure:**

1. **Trigger Magic Link (Backend Test):**
   - Trigger a magic link generation for a Recycler requesting EOL access (See Magic Link EOL test plan for exact triggering steps).
   
2. **Intercept Link:**
   - Retrieve the link from terminal logs or Mailtrap: `http://localhost:3000/auth/callback?token=ey...&refresh_token=ey...&email=recycler@test.com&tenant_id=...`
   
3. **Navigate to Callback:**
   - Open the Magic Link URL in an Incognito window.
   
4. **Verify Final Expected Result:**
   - *What exactly should happen:* The `/auth/callback` page mounts. The `<CallbackHandler>` extracts tokens from query parameters, saves them to `localStorage`/cookies, and seamlessly redirects the user. The user is now authenticated as `recycler@test.com` and has access to restricted UI elements without ever seeing a login screen.
