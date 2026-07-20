# Document 4: System Architecture & Tech Stack Strategy
## ExportReady — Technical Architecture Reference
**Source files:** `next.config.ts`, `go.mod`, `package.json`, `handlers/handlers.go`, `db/schema_clean.sql`, `services/lifecycle.go`, `services/vc_crypto_service.go`, `services/opentimestamps.go`, `services/storage_service.go`, `middleware/`, `render.yaml`

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Layer                               │
│  battery-web (Next.js 16, React 19)   marketing-web (Next.js)  │
│  battery-mobile (React Native)        admin-web                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / REST JSON
                       │ (NEXT_PUBLIC_API_URL → http://localhost:8080)
┌──────────────────────▼──────────────────────────────────────────┐
│                 Battery API (Go 1.24.3)                         │
│  module: github.com/anvayalabs/battery-api                      │
│  net/http standard library router (no third-party framework)    │
│  Port: 8080                                                     │
└──────┬────────────────────────────────────┬───────────────────┬─┘
       │                                    │                   │
┌──────▼──────┐                 ┌───────────▼──────┐  ┌────────▼──────┐
│  PostgreSQL │                 │ Supabase Storage │  │ External APIs │
│  (Supabase) │                 │  (S3-compatible) │  │ Razorpay      │
│  pgx/v5     │                 │  Private bucket  │  │ OpenTimestamps│
│  Connection │                 │  (logos, certs,  │  │ GeoIP2        │
│  Pool       │                 │   PDFs, uploads) │  │ OAuth2        │
└─────────────┘                 └──────────────────┘  └───────────────┘
```

---

## 2. Frontend — Next.js Application

### 2.1 Tech Stack

| Concern | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.1 |
| UI Runtime | React | 19.2.3 |
| Language | TypeScript | ^5 |
| State management | TanStack React Query | ^5.90.20 |
| Forms | React Hook Form + Zod | ^7.71.1 / ^4.3.6 |
| HTTP client | Axios | ^1.13.2 |
| Storage SDK | @supabase/supabase-js | ^2.91.1 |
| Styling | Tailwind CSS v4 | ^4 |
| Component library | Radix UI primitives | various |
| Animations | Framer Motion | ^12.26.2 |
| Charting | Recharts | ^3.7.0 |
| Maps | React Simple Maps | ^3.0.0 |
| Internationalisation | next-intl | ^4.12.0 |
| PDF rendering | pdfjs-dist | ^5.7.284 |
| Testing | Vitest + Testing Library | ^4.1.6 |

### 2.2 Routing Architecture (App Router)

The `apps/battery-web/app/` directory uses Next.js App Router conventions:

```
app/
├── (auth)/              # Auth route group — login, register, forgot-password
├── onboarding/          # Mandatory onboarding flow
├── dashboard/           # Protected dashboard (21 sub-routes)
│   ├── batches/         # Batch CRUD + compliance wizard
│   ├── lifecycle/       # Passport lifecycle management
│   ├── compliance/      # Compliance dashboard
│   ├── eu-compliance/   # EU BatteryPass checklist (Growth)
│   ├── carbon-calculator/
│   ├── dgft-claims/
│   ├── mass-balance/
│   ├── due-diligence/
│   ├── fleet/
│   ├── telemetry/
│   ├── partners/
│   ├── regulatory/
│   ├── developer/       # API keys + webhooks
│   ├── team/
│   ├── billing/
│   ├── settings/
│   └── templates/
├── p/[uuid]/            # Public passport scan page
├── supplier/            # Supplier portal
├── accept-invite/       # Team invite acceptance
└── verify-email/
```

### 2.3 Frontend → Backend Connection

**All API calls** go to `NEXT_PUBLIC_API_URL` (default: `http://localhost:8080/api/v1`). The frontend uses **Axios** with interceptors for JWT token injection.

**Authentication flow:**
1. User logs in → backend returns `access_token` (short-lived JWT) in response body.
2. `refresh_token` stored in an **HttpOnly, Secure, SameSite=Strict** cookie (path restricted to `/api/v1/auth`).
3. Frontend stores access_token in memory (not localStorage); refresh via `POST /api/v1/auth/refresh`.

**Content Security Policy** (from `next.config.ts`):

| Directive | Value |
|---|---|
| `default-src` | `'self'` |
| `script-src` | `'self' 'unsafe-inline' https://checkout.razorpay.com` |
| `connect-src` | `'self' {API_ORIGIN} https://cdn.jsdelivr.net` |
| `frame-src` | `'self' https://api.razorpay.com https://checkout.razorpay.com` |
| `img-src` | `'self' data: blob: https://*.supabase.co` |
| `frame-ancestors` | `'none'` (prevents clickjacking) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=()` |

---

## 3. Backend — Go API

### 3.1 Tech Stack

| Concern | Technology |
|---|---|
| Language | Go 1.24.3 |
| Module | `github.com/anvayalabs/battery-api` |
| HTTP router | `net/http` stdlib (no third-party router) |
| Database driver | `jackc/pgx/v5` (pgxpool connection pool) |
| JWT | `golang-jwt/jwt/v5` |
| QR codes | `skip2/go-qrcode` |
| PDF generation | `jung-kurt/gofpdf` |
| GeoIP | `oschwald/geoip2-golang` |
| Payments | `razorpay/razorpay-go` |
| OAuth2 | `golang.org/x/oauth2` |
| Rate limiting | `golang.org/x/time/rate` |
| Ed25519/DID | `golang.org/x/crypto` + `multiformats/go-multibase` |
| Excel (CMRT) | `xuri/excelize/v2` |
| Logging | `log/slog` (structured JSON logs) |

### 3.2 API Route Structure

All routes are prefixed `/api/v1/`. Key route groups:

**Authentication (`auth_handlers.go`)**
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
PUT  /api/v1/auth/profile
POST /api/v1/auth/verify-email
```

**Batches (`batch_handlers.go`)**
```
POST   /api/v1/batches
GET    /api/v1/batches
GET    /api/v1/batches/{id}
PUT    /api/v1/batches/{id}
DELETE /api/v1/batches/{id}
POST   /api/v1/batches/{id}/activate
GET    /api/v1/batches/{id}/passports
POST   /api/v1/batches/{id}/validate
GET    /api/v1/batches/{id}/compliance
GET    /api/v1/batches/{id}/compliance-report        (PDF download)
GET    /api/v1/batches/{id}/eu-attribute-score
GET    /api/v1/batches/{id}/qr-codes                 (PDF download)
GET    /api/v1/batches/{id}/epcis                    (GS1 EPCIS 2.0 JSON-LD)
```

**Passports / Lifecycle (`lifecycle_handlers.go`)**
```
GET    /api/v1/passports
GET    /api/v1/passports/{uuid}
POST   /api/v1/passports/{uuid}/transition
POST   /api/v1/passports/{uuid}/undo-transition
GET    /api/v1/passports/{uuid}/events
POST   /api/v1/passports/{uuid}/soh
GET    /api/v1/passports/{uuid}/soh-history
```

**Compliance (`compliance_handler.go`)**
```
GET  /api/v1/compliance/rules
GET  /api/v1/compliance/deadlines
POST /api/v1/compliance/check
```

**Carbon (`carbon_handler.go`)**
```
POST /api/v1/carbon/calculate
```

**Suppliers (`supplier_handlers.go`)**
```
POST /api/v1/suppliers/invitations
GET  /api/v1/suppliers
GET  /api/v1/suppliers/{id}
POST /api/v1/supplier/login
POST /api/v1/suppliers/{id}/documents
GET  /api/v1/suppliers/{id}/documents
GET  /api/v1/suppliers/{id}/risk-profile
GET  /api/v1/suppliers/{id}/assessments
POST /api/v1/suppliers/{id}/assessments
POST /api/v1/suppliers/{id}/cmrt
```

**DGFT (`dgft_claim_handlers.go`)**
```
POST /api/v1/dgft/claims
GET  /api/v1/dgft/claims
GET  /api/v1/dgft/claims/{id}
PUT  /api/v1/dgft/claims/{id}
POST /api/v1/dgft/claims/{id}/submit
POST /api/v1/dgft/claims/{id}/documents
```

**EPR (`epr_handler.go`, `epr_certificate_handler.go`)**
```
GET  /api/v1/epr/obligations
POST /api/v1/epr/obligations
GET  /api/v1/epr/certificates
POST /api/v1/epr/certificates
```

**Developer (`apikey_handlers.go`, `outbound_webhook_handlers.go`)**
```
POST   /api/v1/api-keys
GET    /api/v1/api-keys
DELETE /api/v1/api-keys/{id}
POST   /api/v1/webhooks
GET    /api/v1/webhooks
DELETE /api/v1/webhooks/{id}
```

**External / Public scan (`external_handlers.go`)**
```
GET /api/v1/p/{uuid}         # Public DPP scan (unauthenticated)
POST /api/v1/p/{uuid}/scan   # Record scan event
```

---

## 4. Data Models & Schema

### 4.1 Core Database Tables

| Table | Primary Key | Key Columns |
|---|---|---|
| `tenants` | UUID | company_name, email, password_hash, plan_type, quota_balance, manufacturer_code, data_visibility JSONB |
| `battery_tenant_profiles` | tenant_id FK | epr_registration_number, bis_r_number, iec_code, eu_authorized_representative_*, morth_*,  epr/bis/pli_certificate_path + status |
| `team_members` | UUID | tenant_id, email, role (OWNER/ADMIN/MEMBER/VIEWER), status (PENDING/ACTIVE/REVOKED) |
| `batches` | UUID | tenant_id, specs JSONB, status, market_region ENUM, compliance_score, carbon_footprint_result JSONB |
| `passports` | UUID | batch_id, serial_number (BPAN), status, state_of_health, ownership_history JSONB, geolocation_history JSONB |
| `passport_events` | UUID | passport_id, action, actor_role, status_from, status_to, hash (SHA-256), previous_hash — **immutable** |
| `soh_history` | UUID | passport_id, soh DECIMAL(5,2), recorded_at, actor |
| `passport_telemetry` | UUID | passport_id, device_token_id, state_of_health, cycle_count, temperature, voltage, current, thermal_event |
| `magic_link_tokens` | UUID | passport_id, email, role, token_hash, action, expires_at |
| `suppliers` | UUID | tenant_id, email, company_name, status (invited/active/blocked) |
| `supplier_documents` | UUID | supplier_id, doc_type (coc/audit_report/provenance/msds/test_report), status (pending/approved/rejected) |
| `due_diligence_assessments` | UUID | supplier_id, step (policy/identify/assess/respond/audit), status |
| `dgft_claims` | UUID | tenant_id, batch_id, scheme_type, status, export_value_inr, documents JSONB |
| `epr_obligations` | UUID | tenant_id, financial_year, battery_category, obligation_kg, net_obligation_kg, shortfall_kg |
| `epr_certificates` | UUID | tenant_id, certificate_number, recycler_epr_id, weight_kg, financial_year, status |
| `carbon_factors` | UUID | category, subcategory, factor_value, unit, source, valid_from, valid_to |
| `api_keys` | UUID | tenant_id, key_hash, key_prefix, scope, role, rate_limit_tier, expires_at |
| `outbound_webhooks` | UUID | tenant_id, url, secret_hash, event_types, is_active |
| `certificate_anchors` | UUID | batch_id, cert_type, file_hash (SHA-256), ots_proof (base64), bitcoin_tx_id, status |
| `compliance_rules` | UUID | product_type, market_region, rule_key, threshold_value, is_active |
| `reward_ledger` | UUID | tenant_id, passport_uuid, action_type, points_earned |
| `scan_events` | UUID | passport_id, ip_address, city, country, latitude, longitude, device_type |

### 4.2 JSONB Schema Design Rationale

The `specs` column on `batches` is stored as `JSONB`. This was a **deliberate product-agnostic design decision**: the `BatchSpec` Go struct captures all battery-specific fields without requiring schema migrations for every new EU regulation amendment or India notification.

Key JSONB fields:
- `material_composition` — MaterialComposition struct (7 elemental percentages + 4 recycled percentages)
- `performance_spec` — PerformanceSpec struct (14 electrical/thermal values)
- `disassembly_guide` — DisassemblyGuide struct (URL, steps, tools, hazards, safety, EOL)
- `supply_chain_provenance` — SupplyChainProvenance struct (policy URL + tiers array)
- `components` — Bill of Materials (flat array with ParentID, hierarchical)
- `hazardous_substances` — HazardousSubstances struct (3 boolean flags + declaration)

---

## 5. Security Architecture

### 5.1 Authentication & Authorisation

| Mechanism | Detail |
|---|---|
| **Access token** | JWT (HS256), short-lived, carries: `tenant_id`, `product_type`, `role`, `email` |
| **Refresh token** | JWT (HS256), stored as HttpOnly Strict SameSite cookie (path: `/api/v1/auth`); JTI stored in DB for revocation |
| **Tenant isolation** | Every request validates `JWT.tenant_id == request.tenant_id` — hard-enforced in `CreateBatch`, `GetBatch`, etc. |
| **Product type isolation** | JWT `product_type` must match request `product_type`; mismatch returns 403 |
| **Onboarding gate** | `checkIfOnboardingCompleted()` middleware blocks all mutating operations until onboarding is complete |
| **Plan feature gate** | `RequireFeature(feature)` middleware returns HTTP 402 if plan doesn't include the feature |
| **Supplier JWT** | Separate short-lived JWT for supplier portal; `supplier_id` + `tenant_id` scoped |
| **Magic link tokens** | Scoped by `action` + `role` + `expires_at`; optional OTP enforcement |
| **API key auth** | Scoped API keys: role + rate_limit_tier. Rate limiting via `golang.org/x/time/rate`. Key stored as SHA-256 hash. |
| **Regulator key** | `regulatorAPIKey` env var gates Art. 78 field-level access to geolocation data |

### 5.2 Data Immutability

**Passport events** are the most critical immutable data:

```sql
-- Prevents any UPDATE or DELETE on passport_events
CREATE TRIGGER trg_passport_events_no_update
    BEFORE UPDATE ON passport_events
    FOR EACH ROW EXECUTE FUNCTION prevent_passport_event_mutation();

CREATE TRIGGER trg_passport_events_no_delete
    BEFORE DELETE ON passport_events
    FOR EACH ROW EXECUTE FUNCTION prevent_passport_event_mutation();
```

**Hash chaining** (from `services/event_hash.go`):
- Each `PassportEvent.hash` = SHA-256 of (passport_id + action + actor + timestamp + status_from + status_to + previous_hash)
- Chaining: `previous_hash` = hash of the most recent prior event for that passport
- Breaks: tampering with any event invalidates the hash chain for all subsequent events

**OpenTimestamps blockchain anchoring** (`services/opentimestamps.go`):
- Certificate PDFs hashed with SHA-256
- Hash submitted to the OpenTimestamps network → committed to Bitcoin blockchain
- `CertificateAnchor.ots_proof` stores the base64-encoded `.ots` proof file
- `CertificateAnchor.bitcoin_tx_id` is populated once the timestamp is confirmed

**W3C Verifiable Credentials** (`services/vc_crypto_service.go`):
- Ed25519 key pair generated at startup (or loaded from env)
- DID document for the API instance as the verification method
- `LDProof` (type: `Ed25519Signature2020`) signed over passport credential payload

### 5.3 Storage Security

- File uploads handled by `services/storage_service.go` using Supabase Storage (S3-compatible).
- Private bucket for compliance certificates, logos — pre-signed URLs generated on-demand.
- `img-src` CSP directive allows `https://*.supabase.co` — not wildcard.
- Logo URLs are re-signed before returning from `/auth/me` endpoint.

---

## 6. Scalability & Deployment

### 6.1 Horizontal Scalability

| Component | Scaling Approach |
|---|---|
| **Battery API (Go)** | Stateless; multiple replicas behind a load balancer. Connection pooling via pgxpool (configurable pool size). |
| **PostgreSQL** | Supabase managed Postgres with pgBouncer connection pooling. |
| **File storage** | Supabase Storage (S3-backed) — horizontally unlimited. |
| **PDF/QR generation** | In-process (gofpdf, go-qrcode) — CPU-bound, scales with replica count. |

### 6.2 Background Jobs

From `services/` and `handlers/export_job_handlers.go`:

- **Export jobs** (`export_jobs` table): Async QR ZIP, labels PDF, CSV generation queued as `PENDING → PROCESSING → COMPLETED/FAILED`.
- **Alert jobs**: Certificate expiry, compliance degradation, quota low — evaluated periodically.
- **Outbound webhooks** (`services/outbound_webhook.go`): HTTP POST to subscriber URLs on lifecycle events; retry with backoff.

### 6.3 Rate Limiting

- **Scan rate limiter**: per-IP, per-passport hourly cap on public scan recording (`handlers.go`: `scanRateLimiter`).
- **API key rate limits**: tier-based via `rate_limit_tier` on `api_keys` table + `golang.org/x/time/rate`.
- **Auth endpoints**: brute-force protection (not yet explicitly coded — infrastructure-level concern).

### 6.4 Multi-Tenancy

- Complete tenant isolation via `tenant_id` FK on every table.
- `data_visibility` JSONB field on `tenants` controls field-level visibility per tenant.
- Row-level security considered at application layer (not yet PostgreSQL RLS policies — a future hardening opportunity).

---

## 7. Monorepo Structure

```
ExportReady-Battery/ (pnpm workspace)
├── apps/
│   ├── battery-web/        # Next.js 16 — primary B2B dashboard
│   ├── marketing-web/      # Marketing site
│   ├── admin-web/          # Platform admin
│   ├── battery-desktop/    # Desktop app (Electron/Tauri)
│   └── battery-mobile/     # Mobile app (React Native)
├── services/
│   ├── battery-api/        # Go 1.24.3 — primary backend
│   ├── platform-core/      # Shared platform services
│   └── textile-api/        # Parallel vertical (textile DPP)
└── packages/
    ├── @anvaya/types        # Shared TypeScript types
    └── @anvaya/ui           # Shared UI component library
```

### 7.1 Render.yaml Deployment

From `render.yaml` at repo root: both `battery-api` (Go web service) and `battery-web` (static Next.js) are declared as Render services, enabling one-click deployment to Render.com.

---

## 8. Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Go stdlib net/http (no Gin/Echo)** | Zero external router dependency; full control over middleware chain; reduces attack surface. |
| **JSONB for BatchSpec** | Product-agnostic: adding new EU regulation fields requires no DB migration, only Go struct updates. Enables parallel textile vertical on the same platform. |
| **PostgreSQL trigger immutability** | Stronger than application-layer immutability — cannot be bypassed by any Go code path. |
| **Hash-chained events + OTS** | Two complementary proofs: (1) chain makes tampering detectable internally, (2) OTS provides external time-bound cryptographic proof on the Bitcoin blockchain. |
| **Dual validator (client + server)** | `activation-blockers.ts` gives instant UX feedback; `activation_compliance.go` is the authoritative server gate. Both are kept in sync by design — a merge function (`mergeActivationBlockers`) deduplicates their outputs so the UI never understates real blocking conditions. |
| **Plan feature gates at middleware layer** | `RequireFeature()` middleware returns HTTP 402 (not 403) to distinguish "pay to access" from "role denied", enabling the frontend to show upgrade CTAs. |
| **Supplier portal as a separate JWT scope** | Suppliers have zero access to manufacturer tenant data. Supplier JWT carries only `supplier_id` + `tenant_id`. |

---

*End of Document 4*
