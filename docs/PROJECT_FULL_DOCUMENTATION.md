# ExportReady-Battery — Full Project Documentation

> **Last Updated:** 2026-02-15  
> **Purpose:** Comprehensive documentation of all features, flows, architecture, and identified gaps.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Authentication & Login Flow](#3-authentication--login-flow)
4. [Onboarding Flow](#4-onboarding-flow)
5. [Multi-Tenant Model](#5-multi-tenant-model)
6. [Batch Management](#6-batch-management)
7. [Passport (Digital Battery Passport)](#7-passport-digital-battery-passport)
8. [Passport Lifecycle & State Machine](#8-passport-lifecycle--state-machine)
9. [Magic Link System (External Partner Access)](#9-magic-link-system-external-partner-access)
10. [Trusted Partners & Partner Codes](#10-trusted-partners--partner-codes)
11. [Compliance Engine (Dual-Mode)](#11-compliance-engine-dual-mode)
12. [Quota & Billing System](#12-quota--billing-system)
13. [Export Jobs (Async Downloads)](#13-export-jobs-async-downloads)
14. [Team Management](#14-team-management)
15. [API Key System (External/ERP Integration)](#15-api-key-system-externalerp-integration)
16. [Rewards / Gamification](#16-rewards--gamification)
17. [Analytics & Scan Tracking](#17-analytics--scan-tracking)
18. [Audit Trail & Tamper Detection](#18-audit-trail--tamper-detection)
19. [Document Upload & Compliance Vault](#19-document-upload--compliance-vault)
20. [Blog / CMS](#20-blog--cms)
21. [Frontend Architecture](#21-frontend-architecture)
22. [API Route Map](#22-api-route-map)
23. [Database Schema (Migrations)](#23-database-schema-migrations)
24. [Identified Gaps & Recommendations](#24-identified-gaps--recommendations)

---

## 1. Project Overview

**ExportReady-Battery** is a SaaS platform that helps battery manufacturers comply with:

- **EU Battery Regulation 2023/1542** — Digital Battery Passport (Article 77)
- **India Battery Aadhaar** — Unique battery identification, PLI compliance, BIS/EPR certification

The platform generates unique digital passports for every battery unit, tracks their full lifecycle from manufacturing to end-of-life/recycling, and provides QR-code-based public verification pages.

### Core Value Proposition

| Capability                | Description                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| Digital Battery Passports | UUID-based identity per battery with QR codes                                                |
| Lifecycle Tracking        | Action-based state machine: CREATED → ACTIVE → SHIPPED → IN_SERVICE → RECYCLED → END_OF_LIFE |
| Multi-Market Compliance   | EU and India regulatory fields, market-specific validation                                   |
| External Partner Access   | Magic link system for logistics, technicians, recyclers                                      |
| Tamper-Proof Audit Trail  | SHA-256 hash chain on all lifecycle events                                                   |
| ERP Integration           | API key-authenticated external API for programmatic access                                   |

---

## 2. Architecture & Tech Stack

### System Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   Next.js Frontend  │────▶│   Go REST API        │────▶│  PostgreSQL      │
│   (App Router, SSR) │     │   (Chi Router)       │     │  (Supabase)      │
│   Port: 3000        │     │   Port: 8080         │     │                  │
└─────────────────────┘     └──────────────────────┘     └──────────────────┘
                                     │
                            ┌────────┴────────┐
                            │                 │
                     ┌──────▼──────┐   ┌──────▼──────┐
                     │  Supabase   │   │  Resend     │
                     │  Storage    │   │  Email API  │
                     │  (QR ZIPs)  │   │             │
                     └─────────────┘   └─────────────┘
```

| Layer    | Technology                                    | Purpose                                    |
| -------- | --------------------------------------------- | ------------------------------------------ |
| Frontend | Next.js 16, React 19, Tailwind CSS, shadcn/ui | App Router, SSR, RSC                       |
| Backend  | Go 1.24, `net/http` (ServeMux)                | REST API, worker pools                     |
| Database | PostgreSQL 16+ (Supabase)                     | Data persistence, JSONB for specs          |
| Storage  | Supabase Storage                              | QR ZIP archives, label PDFs, certificates  |
| Email    | Resend API                                    | Magic links, team invites, password resets |
| Payments | Razorpay                                      | Subscription billing (India)               |
| GeoIP    | MaxMind GeoLite2                              | QR scan geolocation                        |

### Backend Package Structure

```
backend/
├── cmd/
│   ├── server/main.go      # HTTP server entry point, route registration
│   ├── migrate/main.go      # Database migration runner
│   └── worker/main.go       # Background worker (export jobs)
├── internal/
│   ├── auth/                 # Magic link token generation (JWT-based)
│   ├── config/               # Environment variable loading
│   ├── db/                   # PostgreSQL connection (pgx pool)
│   │   └── migrations/       # 30 sequential SQL migrations
│   ├── handlers/             # HTTP request handlers (controllers)
│   ├── middleware/            # JWT auth, API key auth, rate limiting
│   ├── models/               # Domain models, state machine, evidence
│   ├── repository/           # Data access layer (SQL queries)
│   ├── services/             # Business logic layer
│   └── logger/               # Structured logging (slog)
└── api/
    └── openapi.yaml          # OpenAPI 3.0 specification
```

### Frontend Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login, Register, Forgot/Reset Password
│   ├── (dashboard)/          # Protected dashboard pages
│   ├── (marketing)/          # Public landing, about, pricing, contact
│   ├── (admin)/              # Admin panel (blog management)
│   ├── auth/callback/        # OAuth callback handler
│   ├── onboarding/           # Post-registration setup wizard
│   ├── p/[uuid]/             # Public passport verification page
│   ├── blog/                 # Public blog
│   └── docs/                 # Documentation pages
├── components/               # React components (organized by feature)
├── context/                  # Auth context (React Context API)
├── hooks/                    # Custom React hooks
├── lib/                      # API client (axios), types, utilities
└── middleware.ts             # Next.js edge middleware (route protection)
```

---

## 3. Authentication & Login Flow

The platform supports **three authentication methods**:

### 3.1 Email/Password Authentication

**Registration Flow:**

1. User submits `company_name`, `email`, `password` → [`POST /api/v1/auth/register`](backend/internal/handlers/auth_handlers.go:74)
2. Backend validates: email uniqueness, password ≥ 8 chars
3. Password hashed with bcrypt → stored in [`tenants`](backend/internal/db/migrations/000001_initial_schema.up.sql) table
4. JWT access token (15min) + refresh token (7 days) generated
5. Any pending team invitations for this email are auto-activated
6. Frontend stores tokens in `localStorage` + sets `auth_token` cookie for middleware

**Login Flow:**

1. User submits `email`, `password` → [`POST /api/v1/auth/login`](backend/internal/handlers/auth_handlers.go:166)
2. Backend fetches tenant by email, checks if OAuth-only account (rejects with helpful message)
3. Bcrypt password comparison
4. JWT + refresh token generated, `last_login` updated
5. Frontend calls [`login()`](frontend/context/auth-context.tsx:78) → stores tokens, sets cookie, redirects to `/dashboard`

**Token Refresh Flow:**

1. Axios interceptor detects 401 response → [`api.interceptors.response`](frontend/lib/api.ts:33)
2. Calls [`POST /api/v1/auth/refresh`](backend/internal/handlers/auth_handlers.go:238) with refresh token
3. New access token issued, cookie synced
4. Original request retried automatically
5. If refresh fails → logout, redirect to `/login`

**Password Reset Flow:**

1. [`POST /api/v1/auth/forgot-password`](backend/internal/handlers/auth_handlers.go) → generates reset token, sends email via Resend
2. User clicks link → [`/reset-password?token=xxx`](<frontend/app/(auth)/reset-password/page.tsx>)
3. [`POST /api/v1/auth/reset-password`](backend/internal/handlers/auth_handlers.go) → validates token, updates password hash

### 3.2 OAuth (Google & Microsoft)

**Flow:**

1. Frontend redirects to [`GET /api/v1/auth/google`](backend/internal/handlers/oauth_handler.go:52) (or `/microsoft`)
2. Backend generates CSRF state token → stored in `oauth_state` cookie (5min TTL)
3. User redirected to Google/Microsoft consent screen
4. Callback: [`GET /api/v1/auth/google/callback`](backend/internal/handlers/oauth_handler.go:80)
5. Backend exchanges code for tokens, fetches user profile
6. If email exists → login (link OAuth provider if first OAuth login)
7. If email new → create tenant with OAuth provider, no password
8. Redirect to [`/auth/callback?token=...&refresh_token=...`](frontend/app/auth/callback/page.tsx)
9. Frontend [`CallbackHandler`](frontend/app/auth/callback/page.tsx:9) extracts params, calls `login()`

### 3.3 Magic Link Authentication (External Partners)

See [Section 9](#9-magic-link-system-external-partner-access) for full details.

### 3.4 Frontend Route Protection

**Edge Middleware** ([`middleware.ts`](frontend/middleware.ts)):

- Checks `auth_token` cookie on every request
- Protected routes (`/dashboard`, `/batches`, `/settings`, etc.) → redirect to `/login` if no cookie
- Auth routes (`/login`, `/register`) → redirect to `/dashboard` if cookie present
- Public routes (`/p/[uuid]`, marketing pages) → pass through

**Client-Side Auth Context** ([`auth-context.tsx`](frontend/context/auth-context.tsx)):

- On mount: checks `localStorage` for token → calls [`GET /api/v1/auth/me`](backend/internal/handlers/auth_handlers.go) to validate
- Provides `user`, `loading`, `login()`, `logout()`, `refreshUser()`, `updateUser()`
- All dashboard components consume via `useAuth()` hook

### 3.5 Rate Limiting

Auth routes are wrapped with [`authRateLimiter.Limit()`](backend/internal/middleware/rate_limiter.go) to prevent brute-force attacks.

---

## 4. Onboarding Flow

After registration, new users are guided through a **4-step onboarding wizard** ([`onboarding/page.tsx`](frontend/app/onboarding/page.tsx)):

| Step | Title            | Fields                                                           |
| ---- | ---------------- | ---------------------------------------------------------------- |
| 1    | Company Profile  | Company name, address, support email, website, logo              |
| 2    | Target Markets   | Primary market selection: EU, India, or Both                     |
| 3    | Compliance Setup | EPR number, BIS R-number, IEC code, EU representative (optional) |
| 4    | All Set!         | Review and complete                                              |

- Pre-fills existing user data from [`GET /api/v1/auth/me`](backend/internal/handlers/auth_handlers.go)
- On completion: calls [`PUT /api/v1/auth/profile`](backend/internal/handlers/auth_handlers.go) with `onboarding_completed: true`
- Redirects to `/dashboard`
- If `onboarding_completed` is already true → auto-redirect to dashboard

---

## 5. Multi-Tenant Model

The platform is **multi-tenant** with tenant isolation at the database level:

- **Tenant** = a company (battery manufacturer/importer)
- Every tenant has: `id` (UUID), `company_name`, `email`, `password_hash`, compliance fields
- All data (batches, passports, templates, team members) is scoped by `tenant_id`
- JWT tokens carry `tenant_id` claim → extracted by [`auth middleware`](backend/internal/middleware/auth.go:32) into request context
- Repository queries always filter by `tenant_id`

### Tenant Fields ([`models.Tenant`](backend/internal/models/models.go:40))

| Category         | Fields                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Identity         | `company_name`, `address`, `logo_url`, `support_email`, `website`                               |
| EU Compliance    | `eu_authorized_representative_name`, `eu_authorized_representative_address`, `eu_contact_email` |
| India Compliance | `epr_registration_number`, `bis_r_number`, `iec_code`                                           |
| Compliance Vault | `epr_certificate_path`, `bis_certificate_path`, `pli_certificate_path`                          |
| Document Status  | `epr_status`, `bis_status`, `pli_status` (NOT_UPLOADED/PENDING/VERIFIED/REJECTED)               |
| Billing          | `quota_balance`, `plan_type` (STARTER/GROWTH/ENTERPRISE)                                        |
| Partner Access   | `partner_access_code`                                                                           |
| Onboarding       | `onboarding_completed`                                                                          |

---

## 6. Batch Management

A **Batch** represents a production run of batteries with shared specifications.

### Batch Lifecycle

```
DRAFT ──(activate)──▶ ACTIVE ──(archive)──▶ ARCHIVED
  │
  └──(delete draft)──▶ [deleted]
```

- **DRAFT**: Data entry mode. Downloads disabled. Can add/remove passports.
- **ACTIVE**: Activated (consumes quota). Downloads enabled. Passports become ACTIVE.
- **ARCHIVED**: No longer in active use.

### Creating a Batch ([`POST /api/v1/batches`](backend/internal/handlers/batch_handlers.go:37))

Required fields: `tenant_id`, `batch_name`  
Optional: `model_name`, `market_region` (defaults to GLOBAL), `specs` (JSONB)

**Market-specific fields:**

| Field                                          | EU  | India            | Global |
| ---------------------------------------------- | --- | ---------------- | ------ |
| `chemistry`, `voltage`, `capacity`             | ✅  | ✅               | ✅     |
| `manufacturer`, `weight`, `carbon_footprint`   | ✅  | ✅               | ✅     |
| `material_composition` (cobalt, lithium, etc.) | ✅  | ❌               | ✅     |
| `certifications` (CE, UL, IEC)                 | ✅  | ❌               | ✅     |
| `hazardous_substances` (REACH/RoHS)            | ✅  | ❌               | ✅     |
| `cell_source` (IMPORTED/DOMESTIC)              | ❌  | ✅               | ✅     |
| `domestic_value_add` (PLI %)                   | ❌  | ✅               | ✅     |
| `hsn_code`, `bis_number`, `epr_number`         | ❌  | ✅               | ✅     |
| `bill_of_entry_no`, `country_of_origin`        | ❌  | ✅ (if imported) | ✅     |

### Adding Passports to a Batch

**CSV Upload** ([`POST /api/v1/batches/{id}/upload`](backend/internal/handlers/batch_handlers.go)):

- Columns: `serial_number`, `manufacture_date`
- India mode adds: `cell_source`, `domestic_value_add`, `bill_of_entry_no`, `country_of_origin`
- Parallel processing with worker pool
- Duplicate serial number detection (unique constraint per tenant)
- CSV source filename and row index tracked for traceability

**Auto-Generate** ([`POST /api/v1/batches/{id}/auto-generate`](backend/internal/handlers/batch_handlers.go)):

- Generates N passports with auto-incremented serial numbers
- India mode: BPAN format (`IN-NKY-LFP-2026-00001`)
- EU mode: `EU-BAT-YYYY-NNNNN`

**CSV Validation** ([`POST /api/v1/batches/{id}/validate`](backend/internal/handlers/batch_handlers.go)):

- Dry-run validation without creating passports
- Returns row-level errors

### Batch Operations

| Endpoint                              | Description                           |
| ------------------------------------- | ------------------------------------- |
| `GET /api/v1/batches`                 | List all batches for tenant           |
| `GET /api/v1/batches/{id}`            | Get batch details with passport count |
| `GET /api/v1/batches/{id}/passports`  | List passports in batch               |
| `POST /api/v1/batches/{id}/activate`  | Activate batch (consumes quota)       |
| `POST /api/v1/batches/{id}/duplicate` | Clone batch as new DRAFT              |
| `POST /api/v1/batches/{id}/archive`   | Archive active batch                  |
| `DELETE /api/v1/batches/{id}`         | Soft-delete batch                     |
| `DELETE /api/v1/batches/{id}/draft`   | Hard-delete draft batch               |
| `GET /api/v1/batches/{id}/download`   | Download QR codes as ZIP              |
| `GET /api/v1/batches/{id}/labels`     | Download label PDFs                   |
| `GET /api/v1/batches/{id}/export`     | Export batch data as CSV              |

---

## 7. Passport (Digital Battery Passport)

Each passport represents a **single battery unit** with a unique UUID.

### Passport Data ([`models.Passport`](backend/internal/models/models.go:220))

| Category              | Fields                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| Identity              | `uuid`, `batch_id`, `serial_number`, `manufacture_date`                     |
| Status                | `status` (CREATED → ACTIVE → SHIPPED → IN_SERVICE → RECYCLED → END_OF_LIFE) |
| Snapshot              | `batch_snapshot` (immutable JSONB copy of batch data at creation)           |
| Ownership             | `current_owner_identifier`, `current_owner_email`, `ownership_history`      |
| Lifecycle Timestamps  | `shipped_at`, `installed_at`, `returned_at`, `recycled_at`                  |
| EU Dynamic Compliance | `state_of_health` (0-100%), `repair_events`, `replacement_events`           |
| India Recycling       | `recycling_status`, `recycler_epr_id`, `recycling_date`                     |
| Traceability          | `csv_source_filename`, `csv_row_index`                                      |

### Public Passport Page

[`GET /api/v1/passports/{uuid}`](backend/internal/handlers/passport_handlers.go) — **No authentication required**

Returns [`PassportWithSpecs`](backend/internal/models/models.go:632): passport data + batch specs + tenant info + market region.

Frontend renders at [`/p/[uuid]`](frontend/app/p/[uuid]/page.tsx) with:

- Battery specifications (chemistry, voltage, capacity, etc.)
- Manufacturer information
- Lifecycle status timeline
- Compliance badges (EU/India)
- QR scan recording (geolocation, device type)

---

## 8. Passport Lifecycle & State Machine

### State Diagram

```
                    ┌──────────────────────────────────────────┐
                    │              RECALL                       │
                    │  (from ACTIVE, SHIPPED, IN_SERVICE)       │
                    ▼                                          │
CREATED ──ACTIVATE──▶ ACTIVE ──SHIP──▶ SHIPPED ──INSTALL──▶ IN_SERVICE
                                                                │
                        RECALLED ◀─────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
                 RECYCLE     CLOSE
                    │           │
                    ▼           ▼
                RECYCLED ──CLOSE──▶ END_OF_LIFE
```

### Transition Map ([`models.TransitionMap`](backend/internal/models/models.go:407))

| Action     | From States                 | To State    | Allowed Roles                |
| ---------- | --------------------------- | ----------- | ---------------------------- |
| `ACTIVATE` | CREATED                     | ACTIVE      | SYSTEM                       |
| `SHIP`     | ACTIVE                      | SHIPPED     | INTERNAL_OPERATOR, LOGISTICS |
| `INSTALL`  | SHIPPED                     | IN_SERVICE  | TECHNICIAN                   |
| `RECYCLE`  | IN_SERVICE, RECALLED        | RECYCLED    | RECYCLER                     |
| `CLOSE`    | RECYCLED, RECALLED          | END_OF_LIFE | SYSTEM                       |
| `RECALL`   | ACTIVE, SHIPPED, IN_SERVICE | RECALLED    | ADMIN                        |

### Evidence Requirements ([`models.Evidence`](backend/internal/models/evidence.go))

| Action   | Required Evidence Fields                                     |
| -------- | ------------------------------------------------------------ |
| SHIP     | `shipment_reference`, `shipment_date`                        |
| INSTALL  | `installation_date`, `installer_id`                          |
| RECYCLE  | `recycler_epr_id`, `recycling_date`, `certificate_reference` |
| RECALL   | `recall_reason`, `recall_reference`                          |
| ACTIVATE | None (system action)                                         |
| CLOSE    | None (system action)                                         |

### Actor Context ([`models.ActorContext`](backend/internal/models/models.go:304))

Every lifecycle transition requires:

- **ActorType**: `SYSTEM`, `USER`, `PARTNER`
- **ActorID**: system identifier, user email, or partner email
- **ActorRole**: `SYSTEM`, `INTERNAL_OPERATOR`, `LOGISTICS`, `TECHNICIAN`, `RECYCLER`, `ADMIN`
- **Source**: `INTERNAL` (dashboard) or `MAGIC_LINK` (external partner)

Invariants enforced by [`ValidateActorContext()`](backend/internal/models/models.go:352):

- SYSTEM actors must have role=SYSTEM, source=INTERNAL, id="system"
- USER actors must have source=INTERNAL, role≠SYSTEM
- PARTNER actors must have source=MAGIC_LINK

### Lifecycle Service ([`services.LifecycleService`](backend/internal/services/lifecycle.go:27))

[`ApplyTransition()`](backend/internal/services/lifecycle.go:76) performs:

1. Fetch passport by UUID
2. Validate actor context
3. Validate action exists in transition map
4. Validate role is allowed for action
5. Validate current status allows this action
6. Validate evidence (action-specific required fields)
7. Activation compliance check (market-specific, for ACTIVATE only)
8. Generate SHA-256 event hash (chained to previous event)
9. Persist transition + event atomically (single DB transaction)
10. Return result with previous/new status

### Bulk Transitions

[`POST /api/v1/passports/bulk/transition`](backend/internal/handlers/lifecycle_handlers.go) — Apply same action to multiple passports in one request.

---

## 9. Magic Link System (External Partner Access)

Enables **external partners** (logistics companies, technicians, recyclers) to perform lifecycle actions without a platform account.

### Flow

1. **Partner visits public passport page** → [`/p/[uuid]`](frontend/app/p/[uuid]/page.tsx)
2. **Clicks "Perform Action"** → opens [`RequestMagicLinkModal`](frontend/components/passport/request-magic-link-modal.tsx)
3. **Submits email + role + action** → [`POST /api/v1/auth/magic-link`](backend/internal/handlers/magic_link_handlers.go:69)
4. **Backend performs tiered verification:**
   - **Tier A**: Email domain matches a trusted partner → auto-approve
   - **Tier B**: Unknown email + valid partner code → approve
   - **Rejected**: Unknown email + no/invalid code → reject
5. **Magic link email sent** via Resend with JWT token (1-hour expiry)
6. **Partner clicks link** → [`/p/[uuid]/action?token=xxx`](frontend/app/p/[uuid]/action/page.tsx)
7. **Frontend calls** [`GET /api/v1/passport/{uuid}/action-info`](backend/internal/handlers/magic_link_handlers.go) with token
8. **Partner fills evidence form** → [`POST /api/v1/passport/{uuid}/transition`](backend/internal/handlers/magic_link_handlers.go) with token
9. **Transition applied** with `source=MAGIC_LINK`, `actor_type=PARTNER`
10. **Token consumed** (single-use, recorded in `magic_link_tokens` table)

### Magic Link Token Security

- JWT-based with 1-hour expiry
- Token hash stored in DB for single-use enforcement
- Bound to specific passport UUID and action
- IP address logged on usage
- [`magic_link_hardening`](backend/internal/db/migrations/000028_magic_link_hardening.up.sql) migration adds additional constraints

---

## 10. Trusted Partners & Partner Codes

### Trusted Partners (Tier A) — [`trusted_partners`](backend/internal/handlers/trusted_partner_handlers.go)

Pre-approved companies whose email domains are automatically trusted:

```json
{
  "company_name": "Tata Motors",
  "email_domain": "tatamotors.com",
  "role": "LOGISTICS",
  "contact_email": "fleet@tatamotors.com"
}
```

Any email from `@tatamotors.com` requesting a magic link with role `LOGISTICS` is auto-approved.

### Partner Codes (Tier B)

One-time or limited-use codes for unknown partners:

| Endpoint                             | Description           |
| ------------------------------------ | --------------------- |
| `POST /api/v1/partners/codes`        | Create a partner code |
| `GET /api/v1/partners/codes`         | List partner codes    |
| `DELETE /api/v1/partners/codes/{id}` | Deactivate a code     |

Codes have: `max_uses`, `expires_at`, `role`, usage tracking.

---

## 11. Compliance Engine (Dual-Mode)

### Market Regions

| Region   | Description                                        |
| -------- | -------------------------------------------------- |
| `INDIA`  | Battery Aadhaar — PLI, BIS, EPR compliance         |
| `EU`     | EU Battery Regulation 2023/1542 — Battery Passport |
| `GLOBAL` | Both markets — strictest validation                |

### Activation Compliance ([`activation_compliance.go`](backend/internal/services/activation_compliance.go))

When a batch is activated (`DRAFT → ACTIVE`), the system validates:

**Common (all markets):**

- `model_name`, `chemistry`, `capacity`, `manufacturing_start_date`, `manufacturing_end_date`

**India-specific:**

- Tenant: `epr_registration_number`, `bis_r_number`, `iec_code`
- Batch: `cell_source`
- If imported: `bill_of_entry_no`, `country_of_origin`

**EU-specific:**

- Tenant: `eu_authorized_representative_name`
- Batch specs: `manufacturer_address`, `material_composition`, `certifications` (must include CE)

### India Regulatory Validation ([`validation.go`](backend/internal/services/validation.go))

Strict regex validation for:

- **IEC Code**: `^[A-Z]{5}[0-9]{4}[A-Z]$` (e.g., `AAAPL1234C`)
- **HSN Code**: `^8507[0-9]{4}$` (e.g., `85076000`)
- **EPR Number**: `^B-[0-9]{5}/[0-9]{4}-[0-9]{2}/CPCB$` (e.g., `B-29016/2024-25/CPCB`)
- **BIS R-Number**: `^R-[0-9]{8}$` (e.g., `R-41001234`)

### BPAN (Battery Product Authentication Number)

India-mode serial numbers follow format: `IN-{MFG}-{CHEM}-{YEAR}-{SEQ}`  
Example: `IN-NKY-LFP-2026-00001`

Generated by [`models.GenerateBPAN()`](backend/internal/models/models.go:724).

---

## 12. Quota & Billing System

### How Quotas Work

- Each tenant has a `quota_balance` (number of batch activations available)
- **Activating a batch** deducts 1 quota
- New accounts start with a free quota (configurable)
- Quota can be purchased via Razorpay

### Billing Packages ([`billing_handlers.go`](backend/internal/handlers/billing_handlers.go:32))

| Package    | Price   | Quota            | Per Batch  |
| ---------- | ------- | ---------------- | ---------- |
| Starter    | ₹4,999  | 10 activations   | ₹499       |
| Growth     | ₹19,999 | 50 activations   | ₹399       |
| Enterprise | Custom  | 200+ activations | Contact Us |

### Razorpay Integration

| Endpoint                               | Description               |
| -------------------------------------- | ------------------------- |
| `GET /api/v1/billing/packages`         | List available packages   |
| `POST /api/v1/billing/razorpay/order`  | Create Razorpay order     |
| `POST /api/v1/billing/razorpay/verify` | Verify payment signature  |
| `POST /api/v1/webhooks/razorpay`       | Razorpay webhook (public) |
| `GET /api/v1/billing/balance`          | Get current quota balance |
| `GET /api/v1/billing/transactions`     | Get transaction history   |

### Transaction Ledger ([`models.Transaction`](backend/internal/models/models.go:566))

Every quota change is recorded: `quota_change` (negative for usage, positive for top-up), `batch_id`, `description`.

---

## 13. Export Jobs (Async Downloads)

For large batches, downloads are processed asynchronously:

### Job Types ([`models.ExportJobType`](backend/internal/models/models.go:846))

| Type         | Description                 |
| ------------ | --------------------------- |
| `QR_ZIP`     | ZIP archive of QR code PNGs |
| `LABELS_PDF` | PDF with printable labels   |
| `CSV`        | CSV export of passport data |

### Flow

1. [`POST /api/v1/export-jobs`](backend/internal/handlers/export_job_handlers.go) — Create export job
2. Background worker processes the job (generates files, uploads to Supabase Storage)
3. [`GET /api/v1/export-jobs`](backend/internal/handlers/export_job_handlers.go) — List jobs with status
4. [`GET /api/v1/export-jobs/{id}/download`](backend/internal/handlers/export_job_handlers.go) — Download completed file
5. [`POST /api/v1/export-jobs/{id}/refresh`](backend/internal/handlers/export_job_handlers.go) — Refresh expired download URL

### Job States

`PENDING → PROCESSING → COMPLETED` (or `FAILED`)

Files have expiration dates and download count tracking.

---

## 14. Team Management

### Roles

| Role     | Permissions                         |
| -------- | ----------------------------------- |
| `OWNER`  | Full access, manage team, billing   |
| `ADMIN`  | Manage batches, passports, settings |
| `MEMBER` | View and create batches             |

### Endpoints

| Endpoint                     | Description            |
| ---------------------------- | ---------------------- |
| `GET /api/v1/team`           | List team members      |
| `POST /api/v1/team/invite`   | Invite member by email |
| `POST /api/v1/team/accept`   | Accept invite (public) |
| `DELETE /api/v1/team/{id}`   | Remove team member     |
| `PUT /api/v1/team/{id}/role` | Update member role     |

### Invite Flow

1. Owner invites email → invitation email sent via Resend
2. If email already registered → auto-link to team
3. If email not registered → pending invite, activated on registration
4. Accept invite page: [`/accept-invite`](frontend/app/accept-invite/page.tsx)

Seat limits enforced by billing plan.

---

## 15. API Key System (External/ERP Integration)

Enables programmatic access for ERP systems and third-party integrations.

### API Key Management

| Endpoint                       | Description         |
| ------------------------------ | ------------------- |
| `POST /api/v1/api-keys`        | Create API key      |
| `GET /api/v1/api-keys`         | List API keys       |
| `GET /api/v1/api-keys/{id}`    | Get API key details |
| `PATCH /api/v1/api-keys/{id}`  | Update API key      |
| `DELETE /api/v1/api-keys/{id}` | Delete API key      |

### External API Endpoints (API Key Authenticated)

| Endpoint                                       | Scope | Description            |
| ---------------------------------------------- | ----- | ---------------------- |
| `GET /api/v1/external/passports/{uuid}`        | Read  | Get passport data      |
| `POST /api/v1/external/batches`                | Write | Create batch           |
| `POST /api/v1/external/batches/{id}/passports` | Write | Add passports to batch |
| `GET /api/v1/external/batches/{id}/labels`     | Read  | Download labels        |

### Authentication

API key passed via `X-API-Key` header. Middleware ([`apikey_auth.go`](backend/internal/middleware/apikey_auth.go)) validates:

- Key exists and is active
- Key hash matches (keys stored hashed)
- Scope check (read vs write)
- Rate limiting per key
- `last_used_at` updated on each use

---

## 16. Rewards / Gamification

**Scan-to-Earn** loyalty system for mechanics and technicians. **Points are display-only** — no cash out.

### Point Values ([`models.RewardPoints`](backend/internal/models/models.go:785))

| Action         | Points |
| -------------- | ------ |
| `SCAN_INSTALL` | 50     |
| `SCAN_RECYCLE` | 100    |
| `SCAN_RETURN`  | 20     |

### Loyalty Levels

| Points  | Level                  |
| ------- | ---------------------- |
| 0-49    | Level 1 - Starter      |
| 50-199  | Level 2 - Intermediate |
| 200-499 | Level 3 - Advanced     |
| 500-999 | Level 4 - Senior       |
| 1000+   | Level 5 - Expert       |

### Endpoints

| Endpoint                          | Description        |
| --------------------------------- | ------------------ |
| `GET /api/v1/rewards/balance`     | Get point balance  |
| `GET /api/v1/rewards/leaderboard` | Tenant leaderboard |
| `GET /api/v1/rewards/history`     | Point history      |

Points are awarded automatically when a partner performs a lifecycle action via magic link.

---

## 17. Analytics & Scan Tracking

### QR Scan Recording

When a public passport page is viewed, a scan event is recorded:

- [`POST /api/v1/scans/record`](backend/internal/handlers/scan_handlers.go) (public endpoint)
- GeoIP lookup via MaxMind GeoLite2 ([`geo_service.go`](backend/internal/services/geo_service.go))
- Captures: IP, city, country, lat/long, device type, user agent

### Dashboard Stats ([`GET /api/v1/dashboard/stats`](backend/internal/handlers/dashboard_handlers.go))

| Metric                       | Description                        |
| ---------------------------- | ---------------------------------- |
| `total_passports`            | Total passports across all batches |
| `total_batches`              | Total batches created              |
| `quota_used` / `quota_limit` | Quota consumption                  |
| `passports_this_week`        | Recent production volume           |
| `pending_export_batches`     | Batches in DRAFT status            |

### Analytics Page

Frontend [`/analytics`](<frontend/app/(dashboard)/analytics/page.tsx>) displays:

- Scan statistics cards
- Country distribution chart
- Device type chart
- Live scan feed with map visualization

---

## 18. Audit Trail & Tamper Detection

### Event Hash Chain ([`event_hash.go`](backend/internal/services/event_hash.go))

Every [`PassportEvent`](backend/internal/models/models.go:500) includes:

- `hash`: SHA-256 of all event data
- `previous_hash`: Hash of the preceding event

This creates a **blockchain-like chain** for tamper detection.

### Chain Verification

[`GET /api/v1/passports/{uuid}/verify-chain`](backend/internal/handlers/lifecycle_handlers.go) — Verifies the integrity of the entire event chain for a passport.

[`VerifyEventChain()`](backend/internal/services/event_hash.go:64) checks:

1. Each event's stored hash matches recomputed hash
2. Each event's `previous_hash` matches the preceding event's hash
3. Returns `(valid, failedIndex)` — if invalid, indicates which event was tampered

### Event Types

| Type                 | Description                              |
| -------------------- | ---------------------------------------- |
| `CREATED`            | Passport created                         |
| `IMPORTED`           | Genesis event for CSV-uploaded passports |
| `STATUS_CHANGED`     | Lifecycle transition                     |
| `SCANNED`            | QR code scanned                          |
| `TRANSFERRED`        | Ownership transfer                       |
| `SOH_UPDATED`        | State of health updated                  |
| `REPAIR_LOGGED`      | Repair event recorded                    |
| `REPLACEMENT_LOGGED` | Component replacement recorded           |

---

## 19. Document Upload & Compliance Vault

### Certificate Upload

| Endpoint                                | Description                    |
| --------------------------------------- | ------------------------------ |
| `POST /api/v1/settings/upload-document` | Upload EPR/BIS/PLI certificate |
| `GET /api/v1/settings/documents/{type}` | View uploaded document         |
| `POST /api/v1/settings/upload-logo`     | Upload company logo            |

### Document Verification Status

Each document goes through: `NOT_UPLOADED → PENDING → VERIFIED` (or `REJECTED`)

Admin verification: [`POST /api/v1/admin/verify-doc`](backend/internal/handlers/admin_handlers.go)

### Static File Serving

Uploaded files served at `GET /api/v1/uploads/` with path traversal protection.

---

## 20. Blog / CMS

### Admin Blog Management

| Endpoint                                                                | Description                   |
| ----------------------------------------------------------------------- | ----------------------------- |
| Admin UI at [`/admin/blog`](<frontend/app/(admin)/admin/blog/page.tsx>) | List, create, edit blog posts |
| Server actions in [`actions/blog.ts`](frontend/app/actions/blog.ts)     | CRUD operations               |

### Public Blog

- [`/blog`](frontend/app/blog/page.tsx) — Blog listing
- [`/blog/[slug]`](frontend/app/blog/[slug]/page.tsx) — Individual post

Blog posts stored in [`blog_posts`](backend/internal/db/migrations/000018_create_blog_posts.up.sql) table with: title, slug, content, excerpt, cover image, published status, SEO metadata.

---

## 21. Frontend Architecture

### Key Design Patterns

1. **App Router (Next.js 16)**: Route groups for layout isolation — `(auth)`, `(dashboard)`, `(marketing)`, `(admin)`
2. **Server Components + Client Components**: Pages are server components; interactive parts use `"use client"`
3. **shadcn/ui**: Component library (dialog, tabs, select, table, etc.)
4. **Axios with Interceptors**: Auto-attach JWT, auto-refresh on 401
5. **Cookie + localStorage Dual Storage**: Cookie for edge middleware, localStorage for client-side API calls
6. **Framer Motion**: Animations (onboarding wizard, landing page)

### Dashboard Pages

| Page         | Path                  | Description                                 |
| ------------ | --------------------- | ------------------------------------------- |
| Dashboard    | `/dashboard`          | Overview stats, recent batches, scan feed   |
| Dispatch     | `/dashboard/dispatch` | Dispatch management view                    |
| Batches      | `/batches`            | List all batches, create new                |
| Batch Detail | `/batches/[id]`       | Passport list, lifecycle actions, downloads |
| Templates    | `/templates`          | Reusable batch specification templates      |
| Partners     | `/partners`           | Trusted partners and partner codes          |
| Team         | `/team`               | Team member management                      |
| Billing      | `/billing`            | Quota balance, purchase packages            |
| Exports      | `/exports`            | Async export job status                     |
| Analytics    | `/analytics`          | Scan analytics and charts                   |
| Settings     | `/settings`           | Company profile, compliance docs            |
| Developer    | `/developer`          | API key management                          |
| Rewards      | `/rewards`            | Reward points dashboard                     |

### Marketing Pages

| Page    | Path       |
| ------- | ---------- |
| Landing | `/`        |
| About   | `/about`   |
| Pricing | `/pricing` |
| Contact | `/contact` |
| Careers | `/careers` |
| Privacy | `/privacy` |
| Terms   | `/terms`   |

---

## 22. API Route Map

### Public (No Auth)

| Method | Path                                  | Handler                  |
| ------ | ------------------------------------- | ------------------------ |
| GET    | `/health`                             | Health check             |
| GET    | `/docs`                               | Swagger UI               |
| GET    | `/api/v1/passports/{uuid}`            | Public passport data     |
| POST   | `/api/v1/scans/record`                | Record QR scan           |
| GET    | `/api/v1/sample-csv`                  | Download sample CSV      |
| POST   | `/api/v1/team/accept`                 | Accept team invite       |
| POST   | `/api/v1/webhooks/razorpay`           | Razorpay webhook         |
| GET    | `/api/v1/passport/{uuid}/action-info` | Magic link passport info |
| POST   | `/api/v1/passport/{uuid}/transition`  | Magic link transition    |

### Auth (Rate-Limited, Public)

| Method | Path                              | Handler                  |
| ------ | --------------------------------- | ------------------------ |
| POST   | `/api/v1/auth/register`           | Register                 |
| POST   | `/api/v1/auth/login`              | Login                    |
| POST   | `/api/v1/auth/refresh`            | Refresh token            |
| POST   | `/api/v1/auth/forgot-password`    | Request password reset   |
| POST   | `/api/v1/auth/reset-password`     | Reset password           |
| POST   | `/api/v1/auth/magic-link`         | Request magic link       |
| GET    | `/api/v1/auth/google`             | Google OAuth redirect    |
| GET    | `/api/v1/auth/google/callback`    | Google OAuth callback    |
| GET    | `/api/v1/auth/microsoft`          | Microsoft OAuth redirect |
| GET    | `/api/v1/auth/microsoft/callback` | Microsoft OAuth callback |

### Protected (JWT Required)

| Method                | Path                         | Description              |
| --------------------- | ---------------------------- | ------------------------ |
| GET                   | `/api/v1/auth/me`            | Current user profile     |
| PUT                   | `/api/v1/auth/profile`       | Update profile           |
| POST/GET/DELETE       | `/api/v1/batches/*`          | Batch CRUD               |
| POST/GET              | `/api/v1/passports/bulk/*`   | Bulk operations          |
| POST/GET              | `/api/v1/passports/{uuid}/*` | Lifecycle operations     |
| POST/GET/DELETE       | `/api/v1/templates/*`        | Template CRUD            |
| POST/GET/DELETE/PUT   | `/api/v1/team/*`             | Team management          |
| GET/POST              | `/api/v1/billing/*`          | Billing & payments       |
| POST/GET              | `/api/v1/settings/*`         | Document uploads         |
| POST/GET/PATCH/DELETE | `/api/v1/api-keys/*`         | API key management       |
| POST/GET/DELETE       | `/api/v1/partners/*`         | Partner management       |
| GET                   | `/api/v1/rewards/*`          | Rewards (magic link JWT) |
| POST/GET              | `/api/v1/export-jobs/*`      | Export jobs              |
| GET                   | `/api/v1/dashboard/*`        | Dashboard stats          |

### External API (API Key Required)

| Method | Path                                      | Scope | Description     |
| ------ | ----------------------------------------- | ----- | --------------- |
| GET    | `/api/v1/external/passports/{uuid}`       | Read  | Get passport    |
| POST   | `/api/v1/external/batches`                | Write | Create batch    |
| POST   | `/api/v1/external/batches/{id}/passports` | Write | Add passports   |
| GET    | `/api/v1/external/batches/{id}/labels`    | Read  | Download labels |

---

## 23. Database Schema (Migrations)

30 sequential migrations in [`backend/internal/db/migrations/`](backend/internal/db/migrations/):

| #   | Name                           | Description                                  |
| --- | ------------------------------ | -------------------------------------------- |
| 001 | `initial_schema`               | Tenants, batches, passports, passport_events |
| 002 | `create_batch_templates`       | Reusable batch templates                     |
| 003 | `create_scan_events`           | QR scan tracking                             |
| 004 | `add_dual_mode`                | Market region, India compliance fields       |
| 005 | `add_tenant_details`           | EU representative, support fields            |
| 006 | `add_soft_delete_batches`      | Soft delete for batches                      |
| 007 | `add_india_compliance`         | HSN, BIS, EPR fields                         |
| 008 | `add_quota_system`             | Quota balance, transactions table            |
| 009 | `add_certificate_paths`        | Document upload paths                        |
| 010 | `add_document_status`          | Verification status fields                   |
| 011 | `add_password_reset`           | Password reset tokens                        |
| 012 | `enterprise_lifecycle`         | Full lifecycle state machine, events         |
| 013 | `add_onboarding_completed`     | Onboarding flag                              |
| 014 | `add_performance_indexes`      | Database performance indexes                 |
| 015 | `add_unique_serial_constraint` | Unique serial per tenant                     |
| 016 | `add_csv_traceability`         | CSV source tracking                          |
| 017 | `add_team_management`          | Team members, invitations                    |
| 018 | `create_blog_posts`            | Blog CMS                                     |
| 019 | `add_passport_event_hash`      | SHA-256 hash chain                           |
| 020 | `create_export_jobs`           | Async export jobs                            |
| 021 | `add_india_bis_epr`            | Additional India fields                      |
| 022 | `add_template_market_region`   | Market region on templates                   |
| 023 | `add_lat_long_to_scan_events`  | Geolocation on scans                         |
| 024 | `compliance_alignment`         | Compliance field alignment                   |
| 025 | `add_dva_pli_columns`          | DVA/PLI audit fields                         |
| 026 | `passport_state_lockdown`      | State machine constraints                    |
| 027 | `audit_events_hard_dependency` | Audit event integrity                        |
| 028 | `magic_link_hardening`         | Magic link security                          |
| 029 | `add_missing_batch_columns`    | Missing batch columns                        |
| 030 | `add_oauth_support`            | OAuth provider fields                        |

---

## 24. Identified Gaps & Recommendations

### 🔴 Critical Gaps

| #   | Gap                                              | Impact                                                                                                                                         | Recommendation                                                                           |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | **No email verification on registration**        | Users can register with any email without proving ownership                                                                                    | Add email verification flow (send confirmation link, mark `email_verified` flag)         |
| 2   | **Refresh token not stored/revoked server-side** | Cannot invalidate refresh tokens on logout or password change; tokens valid until expiry                                                       | Store refresh tokens in DB with revocation support; invalidate on logout/password change |
| 3   | **No RBAC enforcement on dashboard**             | Team member roles (OWNER/ADMIN/MEMBER) exist but handlers don't check role permissions                                                         | Add role-checking middleware; restrict destructive operations to OWNER/ADMIN             |
| 4   | **Admin routes lack proper admin verification**  | `POST /api/v1/admin/verify-doc` only requires JWT auth, no admin role check                                                                    | Add admin role verification or separate admin authentication                             |
| 5   | **JWT token in query parameter**                 | [`middleware/auth.go:46`](backend/internal/middleware/auth.go:46) accepts token via URL query param — tokens may leak in logs/referrer headers | Limit query param auth to specific download endpoints only; use short-lived tokens       |

### 🟡 Important Gaps

| #   | Gap                                                | Impact                                                                         | Recommendation                                                                    |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 6   | **No pagination on list endpoints**                | `GET /api/v1/batches`, `GET /api/v1/passports` return all records              | Add `?page=1&limit=50` pagination with cursor-based option for large datasets     |
| 7   | **Onboarding not enforced server-side**            | Onboarding redirect is client-side only; API doesn't block incomplete profiles | Add middleware to check `onboarding_completed` before allowing batch creation     |
| 8   | **No webhook retry mechanism**                     | Razorpay webhook failures are not retried                                      | Add idempotency keys and retry queue for failed webhooks                          |
| 9   | **Export job worker not integrated**               | `cmd/worker/main.go` exists but export jobs appear to run in-process           | Deploy worker as separate process; add job queue (Redis/PostgreSQL LISTEN/NOTIFY) |
| 10  | **No rate limiting on public passport endpoint**   | `GET /api/v1/passports/{uuid}` has no rate limiting                            | Add rate limiting to prevent scraping                                             |
| 11  | **Cookie security flags missing**                  | Auth cookie set without `Secure` flag                                          | Add `Secure` flag in production (HTTPS only)                                      |
| 12  | **No CSRF protection on state-changing endpoints** | POST endpoints rely solely on JWT; no CSRF tokens                              | Add CSRF tokens for cookie-authenticated requests or use `SameSite=Strict`        |

### 🟢 Minor Gaps / Improvements

| #   | Gap                                             | Impact                                                           | Recommendation                                                                 |
| --- | ----------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 13  | **Hardcoded billing packages**                  | Packages defined in handler code, not configurable               | Move to database or config file for easy updates                               |
| 14  | **No soft-delete for passports**                | Bulk delete is hard delete                                       | Add soft-delete with `deleted_at` timestamp                                    |
| 15  | **Blog has no authentication for public reads** | Blog posts table queried directly                                | Already correct for public blog; ensure draft posts are filtered               |
| 16  | **No file size limits on document uploads**     | Could allow very large file uploads                              | Add explicit file size limits (e.g., 10MB for certificates)                    |
| 17  | **Missing health check for dependencies**       | `/health` only returns static JSON                               | Add DB connectivity check, Supabase reachability                               |
| 18  | **No structured error codes**                   | Errors returned as plain strings                                 | Add error code enum (e.g., `AUTH_001`, `BATCH_002`) for client-side handling   |
| 19  | **Duplicate comment in api.ts**                 | [`api.ts:32`](frontend/lib/api.ts:32) has duplicate comment line | Remove duplicate comment                                                       |
| 20  | **No input sanitization on batch names**        | Batch names used in filenames; only client-side sanitization     | Add server-side sanitization (already partially done with `sanitizeBatchName`) |
| 21  | **Missing TypeScript strict mode**              | Frontend types use `Record<string, unknown>` loosely             | Enable strict TypeScript; define proper interfaces for all API responses       |
| 22  | **No automated tests for frontend**             | No test files in frontend directory                              | Add Jest/Vitest + React Testing Library for critical flows                     |
| 23  | **Docker deployment not implemented**           | README mentions "Coming Soon"                                    | Create Dockerfile + docker-compose.yml for backend + frontend                  |
| 24  | **No API versioning strategy**                  | All routes under `/api/v1/` but no plan for v2                   | Document versioning strategy; consider header-based versioning                 |

### 🔵 Feature Gaps (Not Yet Implemented)

| #   | Feature                               | Status                                     | Notes                                                      |
| --- | ------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| 25  | **Carbon footprint calculator**       | Schema ready, no calculator                | Add calculation engine based on chemistry/weight/origin    |
| 26  | **Recycled content tracking**         | Schema ready (`recycled_content_pct`)      | Add input fields and validation                            |
| 27  | **State of Health (SoH) integration** | API exists, no IoT integration             | Add webhook/API for BMS data ingestion                     |
| 28  | **Multi-language support**            | Not implemented                            | Add i18n for EU market (minimum: EN, DE, FR)               |
| 29  | **Notification system**               | No in-app notifications                    | Add notification center for lifecycle events, team invites |
| 30  | **Audit log export**                  | Events viewable but not exportable         | Add CSV/PDF export for audit trail                         |
| 31  | **Custom label templates**            | Enterprise feature mentioned but not built | Add label template designer                                |
| 32  | **WhatsApp integration**              | Mentioned in Growth plan features          | Add WhatsApp Business API for support                      |

---

_This document was generated by reviewing the complete codebase including all backend handlers, services, models, migrations, middleware, frontend pages, components, context, and configuration files._
