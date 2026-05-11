# Demo Readiness Audit — Export-Ready Battery Platform

**Audit Scope:** Core demo flows (batch creation → passport generation → QR scan), compliance activation, and environment gaps.  
**Architecture:** Go 1.24.3 / Chi Router / pgx v5 backend · Next.js 16 / React 19 / Tailwind 4 / shadcn-radix frontend · PostgreSQL 16 (Supabase)  
**Module:** `anvayalabs-battery`  
**Migrations:** 41 applied · **API routes:** 60+ fully implemented · **Compliance engine:** 14 India + 12 EU checkpoints

---

## Executive Summary

The codebase is in excellent shape — no 501 stubs, all repositories implemented, compliance engine production-grade, billing/quota system wired to Razorpay. The primary gaps are **environmental configuration** and a few **UX friction points** that will block a live demo if not addressed first. Core business logic is complete.

**Overall Demo-Readiness: ~80%** — all code is present, gaps are configuration + minor UX polish.

---

## Core Demo Flow (What Works End-to-End)

```
Register → Verify Email → Login → Onboarding → Settings
  → Create Batch (DRAFT) → Activate Batch (ACTIVE)
    → Upload CSV  OR  Auto-Generate Passports
      → Download QR Labels → Scan QR Code → Public Passport Page
```

All steps above are implemented. The following sections detail what can block each step.

---

## Critical Gaps (Prioritized by Severity)

---

### GAP-1 — Email Verification Blocks New Account Login ⚠️ CRITICAL

**What happens:** After registration, the system requires email verification before login is allowed.  
**Root cause:** `POST /auth/register` inserts `email_verified=false`. Login handler rejects unverified accounts. Verification email is sent via `emailService.SendVerificationEmail()`.  
**If `RESEND_API_KEY` is not set:** Email logs to console in dev mode but no actual email is delivered.  
**Demo impact:** New registrations in demo environment will silently fail to deliver the verification email, blocking login.

**Fix Options (in priority order):**

**Option A — Seed a pre-verified demo account (fastest for demo)**  
Insert a tenant directly in the DB with `email_verified=true` and a known password hash:
```sql
INSERT INTO public.tenants (
  id, company_name, email, password_hash, email_verified, quota_balance, created_at,
  epr_registration_number, bis_r_number, iec_code,
  manufacturing_start_date, onboarding_completed
) VALUES (
  gen_random_uuid(), 'Demo Company', 'demo@example.com',
  '$2a$12:<bcrypt-hash-of-demo-password>',
  true, 100, now(),
  'EPR-DEMO-001', 'BIS-R-DEMO-001', 'IEC-DEMO-001',
  now(), true
);
```
Generate the bcrypt hash: `htpasswd -bnBC 12 "" demopassword | tr -d ':\n' | sed 's/$apr1$//'`  
Or use the Go tool: `go run ./cmd/tools/hashpwd -password demopassword`

**Option B — Add `RESEND_API_KEY` to env**  
Set `RESEND_API_KEY=re_...` in `.env` / deployment secrets. Email verification then works for real accounts.

**Option C — Add dev bypass flag to registration**  
In `auth_handlers.go:Register()`, add:
```go
// File: backend/internal/handlers/auth_handlers.go  ~line 176
if os.Getenv("SKIP_EMAIL_VERIFICATION") == "true" {
    emailVerified = true
}
```
And update the INSERT to use this flag. Safe for dev/demo, never set in production.

---

### GAP-2 — India Batch Activation Requires Tenant Settings Pre-Filled ⚠️ HIGH

**What happens:** `POST /batches/{id}/activate` runs `ValidateActivationCompliance()`. For **INDIA** market batches, it checks:
- `tenant.epr_registration_number` (EPR reg number)
- `tenant.bis_r_number` (BIS CRS Registration)
- `tenant.iec_code` (Import-Export Code)
- `batch.specs.certifications` contains `"AIS-156"` and `"AIS-038"`

If any are missing → `HTTP 422` with full missing fields list. Demo will appear broken.

**Fix:** Before demo, fill these fields in Settings → Company Compliance. Alternatively use the seed SQL above with dummy values.

**Where in the UI:** `Settings → Company Settings → India Compliance` section.  
**Backend field names:** `epr_registration_number`, `bis_r_number`, `iec_code` on the `tenants` table.

**AIS certifications:** These are now exposed in the **Create Batch dialog** (India market → Certifications section). Ensure `AIS-156` and `AIS-038` checkboxes are checked when creating the batch. They default to checked when India market is selected (auto-set by `useEffect`).

---

### GAP-3 — EU Batch Activation Requires EU Representative Info ⚠️ HIGH

**Similar to GAP-2 but for EU market.** `ValidateEUActivation()` checks:
- `tenant.eu_authorized_representative_name`
- `tenant.eu_authorized_representative_address`

**Where in the UI:** `Settings → EU Compliance` section.

---

### GAP-4 — QR Codes Only Work if `BASE_URL` is Publicly Accessible ⚠️ HIGH

**What happens:** QR codes are generated with `{BASE_URL}/p/{passport-uuid}`. If `BASE_URL=http://localhost:3000`, scanning from a phone does nothing.  
**Root cause:** `backend/internal/services/qr_service.go:81` — `base := fmt.Sprintf("%s/p/%s", s.baseURL, passportUUID.String())`

**Fix for demo:**
```
# .env or backend environment
BASE_URL=https://your-deployed-domain.com
# OR for local demo with ngrok:
BASE_URL=https://abc123.ngrok-free.app
```
The public passport page is at `frontend/app/p/[uuid]/page.tsx` — fully implemented with tier-aware display, multilingual, and print support.

---

### GAP-5 — Batch Must Be ACTIVE Before Passport Upload (Flow Order Matters) ℹ️ MEDIUM

**What happens:** `POST /batches/{id}/upload` and `POST /batches/{id}/auto-generate` enforce:
```go
// backend/internal/handlers/upload_handlers.go:45-48
if batch.Status != models.BatchStatusActive {
    respondError(w, http.StatusConflict, "Batch must be ACTIVE before passport creation")
}
```

**Correct demo flow order:**
1. Create batch → status = `DRAFT`
2. **Activate batch first** (deducts 1 quota unit, status → `ACTIVE`)
3. Then upload CSV **or** auto-generate passports
4. Download QR labels / scan QR

This is not a bug — it's intentional — but it's counter-intuitive and will trip up demo presenters.

---

### GAP-6 — Async Label Export Requires Supabase Config ℹ️ MEDIUM

**What happens:** `POST /export-jobs` (large batch label downloads >500 passports) is only registered when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set:
```go
// backend/cmd/server/main.go:142-164
if cfg.SupabaseURL != "" && cfg.SupabaseServiceRoleKey != "" {
    mux.Post("/api/v1/export-jobs", h.CreateExportJob)
}
```

Without Supabase, the `DownloadLabelsDialog` button will silently fail for large batches.  
**For demo with ≤500 passports:** Direct download via `GET /batches/{id}/labels` works without Supabase. This is the common demo path.

---

### GAP-7 — Quota System: 2 Free Activations per Account ℹ️ LOW

**What happens:** New accounts have `quota_balance = 2` (set by migration `000008`). After 2 batch activations, further activations are blocked with HTTP 402 and the UI redirects to `/billing`.

**Demo implication:** For a short demo with 1-2 batches this is fine. For extended demos or stress testing, top up via `/billing` or set quota manually:
```sql
UPDATE public.tenants SET quota_balance = 100 WHERE email = 'demo@example.com';
```

**Razorpay integration:** Fully implemented. Requires `RAZORPAY_KEY_ID` + `RAZORPAY_SECRET` in env for billing to work.

---

## Environment Setup Checklist for Demo

```bash
# Backend (.env or environment variables)
DATABASE_URL=postgres://...          # Required: PostgreSQL connection string
JWT_SECRET=<random-64-char-string>   # Required: JWT signing secret
BASE_URL=https://your-domain.com     # Required: for QR code URLs
FRONTEND_URL=https://your-domain.com # Required: CORS + email links

# Optional but recommended for demo
RESEND_API_KEY=re_...                # Email verification (or use pre-seeded account)
RAZORPAY_KEY_ID=rzp_test_...        # Billing / quota top-up
RAZORPAY_SECRET=...

# Only needed for async export jobs (large batches >500)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-backend.com/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...   # Optional for billing demo
```

---

## Implementation Plan: Filling the Gaps

### Phase 1 — Demo Environment Setup (No Code Changes Required)

| Task | Action |
|------|--------|
| Pre-seed demo account | Run SQL to insert verified tenant with India compliance fields filled |
| Configure BASE_URL | Set to ngrok URL or deployed domain |
| Set quota for demo account | `UPDATE tenants SET quota_balance = 50 WHERE email = 'demo@example.com'` |
| Practice the activation-first flow | Activate → then upload/generate passports |

### Phase 2 — UX Polish (Low Risk, High Demo Value)

#### P2.1 — Add "Demo Setup" indicator to Activation Errors

**File:** `frontend/app/(dashboard)/batches/[id]/page.tsx` (~line 428)  
**Change:** Improve the error toast when compliance check fails (HTTP 422) to show a friendly list of missing settings with a direct link to Settings page.

```tsx
// Current (line 428):
toast.error(apiError.response?.data?.error || 'Failed to activate batch')

// Improved:
const missingFields = apiError.response?.data?.missing as string[] | undefined
if (missingFields?.length) {
    toast.error(
        <div>
            <p className="font-semibold">Compliance fields missing:</p>
            <ul className="mt-1 text-xs list-disc ml-4">
                {missingFields.slice(0, 3).map((f: string) => <li key={f}>{f}</li>)}
            </ul>
            <a href="/settings" className="mt-2 block text-teal-600 underline text-xs">
                Go to Settings →
            </a>
        </div>,
        { duration: 8000 }
    )
} else {
    toast.error(apiError.response?.data?.error || 'Failed to activate batch')
}
```

#### P2.2 — Show Demo Flow Guide in Batch Detail Page

**File:** `frontend/app/(dashboard)/batches/[id]/page.tsx`  
**Change:** When batch is `DRAFT`, show a numbered stepper hint: `1. Fill Settings → 2. Activate → 3. Upload/Generate → 4. Download QR`.

#### P2.3 — Add "Copy Demo Values" to Settings Page

**File:** `frontend/app/(dashboard)/settings/page.tsx`  
**Change:** Add a "Fill Demo Values" button that auto-fills EPR, BIS-R, IEC fields with placeholder values so first-time users can immediately test the activation flow.

### Phase 3 — Robustness Improvements (Post-Demo)

#### P3.1 — Skip Email Verification in Dev Mode

**File:** `backend/internal/handlers/auth_handlers.go`  
**Change:** Read `SKIP_EMAIL_VERIFICATION` env flag; if set, insert with `email_verified=true`.  
Pattern: follow the existing `cfg` struct in `backend/cmd/server/main.go` — add `SkipEmailVerification bool` loaded from env.

#### P3.2 — Seed Default Demo Tenant in Development Migration

**File:** Create `backend/internal/db/migrations/000042_demo_seed.up.sql`  
Only applies when `APP_ENV=development`. Inserts a pre-verified tenant with demo credentials, quota=50, and all compliance fields filled.

#### P3.3 — Improve Activation Flow: Allow Deferred Activation

**File:** `backend/internal/handlers/upload_handlers.go:45-48`  
**Consideration:** The ACTIVE-before-upload guard is intentional (compliance assurance). Rather than removing it, add a tooltip in the UI explaining why activation must happen first.

---

## Architecture Reference

### Backend Package Structure
```
backend/
├── cmd/server/main.go          # Chi router, 60+ routes, env config
├── internal/
│   ├── handlers/               # HTTP handlers (batch, auth, upload, passport, billing)
│   ├── services/               # Business logic (compliance, QR, PDF, activation)
│   ├── repository/             # pgx v5 data access (tenant, batch, passport)
│   ├── models/                 # Domain models + JSON tags
│   ├── middleware/             # JWT auth, tenant extraction, CORS
│   └── db/migrations/          # 41 SQL migrations (golang-migrate)
```

### Frontend Page Structure
```
frontend/app/
├── (auth)/                     # Login, register, verify-email, forgot-password
├── (dashboard)/                # Auth-guarded: layout.tsx with onboarding check
│   ├── batches/                # Batch list + [id] detail (CSV upload, auto-generate, activate)
│   ├── settings/               # Company, compliance, billing, team settings
│   ├── billing/                # Razorpay quota top-up
│   └── passports/              # Passport list with search/filter
├── p/[uuid]/                   # PUBLIC passport page (no auth, scanned via QR)
└── onboarding/                 # First-time setup wizard
```

### Key Services
| Service | File | Purpose |
|---------|------|---------|
| Activation compliance | `services/activation_compliance.go` | Hard-block validation at batch activation |
| QR generation | `services/qr_service.go` | Generates QR PNG + URL |
| PDF passport | `services/pdf_service.go` | Generates downloadable PDF |
| BPAN generation | `services/bpan_service.go` | Battery Passport Access Number format |
| Razorpay billing | `services/billing_service.go` | Order creation + webhook verification |

---

## Public Passport Page — QR Scan Target

- **URL:** `{BASE_URL}/p/{passport-uuid}`
- **File:** `frontend/app/p/[uuid]/page.tsx`
- **Features:** Tier-aware field display, multilingual, printable view, lifecycle timeline
- **API call:** `GET /api/v1/public/passports/{uuid}` → returns `PassportWithSpecs` model
- **No auth required** — this is the customer-facing view

---

## Compliance Activation Requirements (Quick Reference)

### India Market Batch
| Requirement | Source | Where to Set |
|-------------|--------|-------------|
| EPR Registration Number | `tenant.epr_registration_number` | Settings → India Compliance |
| BIS CRS R-Number | `tenant.bis_r_number` | Settings → India Compliance |
| IEC Code | `tenant.iec_code` | Settings → India Compliance |
| AIS-156 certification | `batch.specs.certifications[]` | Create Batch → Certifications (auto-checked for India) |
| AIS-038 Rev.2 certification | `batch.specs.certifications[]` | Create Batch → Certifications (auto-checked for India) |

### EU Market Batch
| Requirement | Source | Where to Set |
|-------------|--------|-------------|
| EU Authorized Representative Name | `tenant.eu_authorized_representative_name` | Settings → EU Compliance |
| EU Authorized Representative Address | `tenant.eu_authorized_representative_address` | Settings → EU Compliance |

### Common (All Markets)
- `batch.model_name` — filled in Create Batch form
- `batch.specs.chemistry` — filled in Create Batch form
- `batch.specs.capacity` — filled in Create Batch form
- `batch.manufacturing_start_date` — filled in Create Batch form
- `batch.manufacturing_end_date` — filled in Create Batch form

---

## Known Issues Fixed Prior to This Audit

1. **Login → Onboarding redirect race condition** — `auth-context.tsx:login()` now calls `GET /auth/me` before `setUser()` ensuring `onboarding_completed` is populated before the dashboard layout guard fires.

2. **India batch AIS certifications not in payload** — `create-batch-dialog.tsx` now includes `specs.certifications` in the INDIA market payload, and the form exposes AIS-156/AIS-038 checkboxes with auto-defaults.

---

*Generated by project audit — verify against codebase before each release.*
