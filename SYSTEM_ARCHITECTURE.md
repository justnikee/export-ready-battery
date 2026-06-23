# ExportReady / AnvayaLabs — System Architecture

> **Version:** 1.0  
> **Scope:** Full-stack architecture of the Battery & Textile Digital Product Passport (DPP) platform.  
> **Audience:** Engineers, DevOps, QA, product managers, and future contributors who need a single source of truth for how the system is organized, why it is organized that way, and where to find things.

---

## 1. Executive Summary

ExportReady is a **multi-product regulatory-compliance SaaS** that helps Indian manufacturers create **Digital Product Passports (DPP)** for batteries and textiles exported to the European Union. The system is implemented as a **Turborepo + pnpm monorepo** containing:

- **6 end-user applications** (3 web, 2 desktop, 1 functional mobile app, plus 1 mobile scaffold)
- **3 Go backend services** sharing authentication/authorization primitives
- **4 shared internal packages** (UI components, TypeScript types, TS config presets)
- **A single CI/CD pipeline** that builds, tests, migrates, and deploys to Vercel (frontend) and Render (backend)

The architecture is intentionally **product-line oriented**: the same compliance engine, tenant model, and UI layer are reused across the Battery and Textile product lines, while each product keeps its own service boundary, database, and domain logic.

---

## 2. Product Vision & Regulatory Context

### 2.1 What the Product Does

| Product | Domain | Primary Regulation |
|---------|--------|-------------------|
| Battery Passport | Battery DPP | EU Battery Regulation 2023/1542, India CPCB EPR/BIS |
| Textile DPP | Textile DPP | EU ESPR, India Textile EPR / BWM |

Both products support:

- Batch/lot creation and lifecycle tracking
- QR-code and GS1 Digital Link generation
- Public passport pages with tiered access (public scan, partner magic-link, regulator key)
- Compliance scoring against India + EU rules
- Supplier due-diligence workflows and document upload
- EPR ledger, mass balance, and recycled-content tracking
- PDF/label generation, CSV import/export, EPCIS 2.0 JSON-LD export
- Billing via Razorpay and team/role management

### 2.2 Why the Architecture Looks Like This

The system is built around three constraints:

1. **Regulatory deadlines are fixed** — the EU Battery Passport becomes mandatory in February 2027, so the platform must ship a working battery product first, then generalize to textiles.
2. **Indian MSMEs are price-sensitive** — the stack avoids heavy managed-service costs where possible (Render starter, Vercel free tiers, Supabase free tier).
3. **Two product lines must share DNA** — auth, billing, teams, UI primitives, and the compliance registry are reused; product-specific logic is isolated per service.

---

## 3. Monorepo Topology

```text
ExportReady-Battery/
├── apps/                           # User-facing applications
│   ├── admin-web/                  # Next.js static admin dashboard
│   ├── battery-web/                # Next.js battery SaaS
│   ├── battery-desktop/            # Tauri + Vite desktop client
│   ├── battery-mobile/             # Expo + React Native mobile client
│   ├── marketing-web/              # Next.js static marketing site
│   ├── textile-web/                # Next.js textile SaaS
│   ├── textile-desktop/            # Tauri + Vite desktop client
│   └── textile-mobile/             # Expo + React Native scaffold
├── packages/                       # Shared frontend libraries
│   ├── config/
│   │   ├── eslint/                 # @anvayalabs/eslint-config
│   │   └── tailwind/               # @anvayalabs/tailwind-config
│   ├── types/                      # @anvaya/types
│   ├── typescript-config/          # @anvayalabs/typescript-config
│   └── ui/                         # @anvaya/ui
├── services/                       # Go backend services
│   ├── battery-api/                # Battery domain API
│   ├── platform-core/              # Auth, tenants, teams, billing
│   └── textile-api/                # Textile domain API
├── scripts/                        # Maintenance & migration helpers
├── docs/                           # Architecture, UX, and planning docs
├── .github/workflows/ci.yml        # CI/CD pipeline
├── render.yaml                     # Render Blueprint for backend services
├── Makefile                        # Local dev/build/test/migration commands
├── turbo.json                      # Turborepo pipeline
├── pnpm-workspace.yaml             # pnpm workspace definition
└── package.json                    # Root monorepo manifest
```

### 3.1 Workspace Tooling

| Tool | Purpose | Evidence |
|------|---------|----------|
| **pnpm** | Package manager & workspace linker | `pnpm-workspace.yaml`, `pnpm-lock.yaml` |
| **Turborepo** | Task orchestration & build caching | `turbo.json`, root `package.json` scripts |
| **npm workspaces** | Declared but secondary | root `package.json` `workspaces` array |

> **Note:** The root `package.json` still declares `workspaces`, and a stale `package-lock.json` exists, but the active lockfile and CI use **pnpm**. Treat npm declarations as legacy.

### 3.2 Turborepo Pipeline

```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev":   { "cache": false, "persistent": true },
    "lint":  { "dependsOn": ["^build"] },
    "test":  { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] }
  }
}
```

- `^build` means any package/app that another depends on must finish building first.
- `dev` is uncached and persistent because it runs long-lived dev servers.
- Outputs are cached so repeated builds skip unchanged apps.

---

## 4. Technology Stack Matrix

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| **Package Manager** | pnpm | v9 in CI, v10.15 locally |
| **Monorepo Runner** | Turborepo | v2 |
| **Web Framework** | Next.js | 15 / 16, App Router, React 19 |
| **Web Styling** | Tailwind CSS | v4 (`@tailwindcss/postcss`) |
| **Desktop Shell** | Tauri | v2 |
| **Desktop Bundler** | Vite | v7 |
| **Mobile** | Expo SDK 52 + React Native 0.76 | battery-mobile uses Expo Router; textile-mobile is a scaffold |
| **Backend Language** | Go | 1.24.3 |
| **HTTP Layer** | Standard library `net/http` | `http.NewServeMux()` with Go 1.22 route patterns |
| **Database Driver** | `jackc/pgx/v5` | Connection pooling via `pgxpool` |
| **ORM** | None | Raw SQL in repository layer |
| **Auth** | JWT HS256 (`golang-jwt/jwt/v5`) + bcrypt + OAuth2 |
| **Object Storage** | Supabase Storage | Used for compliance docs, blog images |
| **Cache** | Upstash Redis | Optional; used by battery-api for rate limiting/caching |
| **Payments** | Razorpay | `razorpay-go` SDK |
| **Email** | Resend | HTTP API |
| **CI/CD** | GitHub Actions | Node 20, Go 1.24, pnpm 9 |
| **Frontend Hosting** | Vercel | 4 projects from one repo |
| **Backend Hosting** | Render | Blueprint `render.yaml` |
| **Databases** | Supabase PostgreSQL | Target: one project per service |

---

## 5. Frontend Architecture

### 5.1 Application Inventory

| App | Framework | Output Mode | Primary Role | Maturity |
|-----|-----------|-------------|--------------|----------|
| `battery-web` | Next.js 16 + App Router | SSR / dynamic | Battery SaaS dashboard | Most mature |
| `textile-web` | Next.js 16 + App Router | SSR / dynamic | Textile SaaS dashboard | Active branch; some stubs |
| `marketing-web` | Next.js 15 + App Router | Static export (`distDir: 'out'`) | Public marketing site | Functional |
| `admin-web` | Next.js 16 + App Router | Static export | Internal admin dashboard | Placeholder/mock data |
| `battery-desktop` | Tauri v2 + Vite 7 + React 19 | Desktop binary | Factory-floor client | Functional; print station + CSV import |
| `textile-desktop` | Tauri v2 + Vite 7 + React 19 | Desktop binary | Factory-floor client | Functional; no print station |
| `battery-mobile` | Expo SDK 52 + RN 0.76 | iOS/Android | QR scan + offline actions | Functional |
| `textile-mobile` | Expo SDK 52 + RN 0.76 | iOS/Android | — | Scaffold only |

### 5.2 Shared Frontend Patterns

#### 5.2.1 Component Architecture

- **Base primitives:** `packages/ui` exports shadcn/ui-style components built on **Radix UI** primitives.
- **Local re-exports:** Each web app duplicates a `components/ui/*` layer that re-exports from `@anvaya/ui/*` and adds app-specific wrappers (e.g., forms).
- **Styling:** Tailwind CSS v4 with CSS variables for light/dark themes. Brand token: `#3ecf8e` emerald.
- **Utils dependency:** Every app needs its own `lib/utils.ts` exporting `cn()` (from `clsx` + `tailwind-merge`) because `@anvaya/ui` does not ship one.

#### 5.2.2 State Management

| Concern | Web | Desktop | Mobile |
|---------|-----|---------|--------|
| Auth/session | React Context (`context/auth-context.tsx`) | React Context (`src/context/auth-context.tsx`) | React Context (`lib/auth-context.tsx`) |
| Server state | TanStack Query v5 (`providers/query-provider.tsx`) | None (direct axios calls) | TanStack Query v5 |
| Forms | `react-hook-form` + `zod` | Local state | Local state |
| Theme | `next-themes` | Tailwind dark class | N/A |

#### 5.2.3 API Client Pattern

All clients use **axios** with a default base URL:

```ts
// apps/battery-web/lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
});
```

- **Web:** access token held in memory; refresh token is an HttpOnly cookie sent to `/auth/refresh`.
- **Desktop:** token stored in `localStorage` under key `"token"`.
- **Mobile:** token stored in `expo-secure-store`; SQLite offline queue for actions.

### 5.4 Web Apps in Detail

#### `battery-web`

- **Package:** `@anvaya/battery-web`
- **Framework:** Next.js 16, React 19, `next-intl` for i18n.
- **Key routes:**
  - Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`
  - Dashboard: `/dashboard/*` (analytics, batches, compliance, billing, team, settings, developer, rewards, etc.)
  - Supplier portal: `/supplier/*`
  - Public passport: `/p/[uuid]/`, `/p/[uuid]/action`
  - Onboarding, docs, privacy/terms, verify-email, accept-invite
- **Testing:** Vitest + React Testing Library + MSW.
- **Notable features:** batch creation wizard, Supabase Storage uploads, strict CSP headers, Razorpay checkout script.

#### `textile-web`

- **Package:** `@anvaya/textile-web`
- **Framework:** Next.js 16, React 19 (no `next-intl` currently).
- **Key routes:** mirrors battery-web dashboard routes plus marketing pages (`/about`, `/careers`, `/contact`, `/pricing`) and a blog CMS under `(admin)/admin/blog`.
- **State:** same TanStack Query + AuthContext pattern as battery-web.
- **Current focus:** `feat/textile-foundation` branch; several dashboard routes are `UnderDevelopment` stubs and some copy still references batteries.

#### `marketing-web`

- **Package:** `@anvayalabs/marketing-web`
- **Framework:** Next.js 15 static export.
- **Routes:** `/` landing, `/battery`, `/textile`, `/pricing`, `/request-access`, `/blog`, `/admin/blog`.
- **Backend connection:** `request-access` form posts directly to the auth service; `/api/contact` route is a stub that logs inquiries.
- **Design system:** separate editorial palette (`--color-paper`, `--color-ink`, `--color-accent: #157a5b`).

#### `admin-web`

- **Package:** `@anvayalabs/admin-web`
- **Framework:** Next.js 16 static export.
- **Routes:** `/`, `/dashboard/*` (stats, tenants, users, billing, health, announcements, settings).
- **State:** local state only; dashboard data is currently hard-coded.

### 5.5 Desktop Apps

Both desktop apps use **Tauri v2** as the native shell and **Vite 7 + React 19** for the UI. Routing is handled by `react-router-dom` v7.

| Feature | battery-desktop | textile-desktop |
|---------|-----------------|-----------------|
| Print Station | Yes (`/dashboard/print-station`, `/dashboard/print-station/csv-import`) | No |
| Dashboard routes | Full set | Full set minus print station |
| Native plugins | dialog, fs, http, opener | opener |
| Auth token | `localStorage` | `localStorage` |

Tauri configuration: `src-tauri/tauri.conf.json` with devUrl `http://localhost:1420`.

### 5.6 Mobile Apps

| Feature | battery-mobile | textile-mobile |
|---------|----------------|----------------|
| Router | Expo Router | Standard React Native |
| Screens | Auth, scan, passport, actions, profile | Single title screen |
| Offline support | SQLite (`expo-sqlite`) scanned cache + pending action queue | None |
| Biometric auth | `expo-local-authentication` | None |
| Notifications | `expo-notifications` | None |
| Deep links | `passport/<uuid>` | None |

---

## 6. Backend Architecture

### 6.1 Service Inventory

| Service | Module | Port | Responsibility |
|---------|--------|------|----------------|
| `platform-core` | `github.com/anvayalabs/platform-core` | 8081 | Auth, tenants, teams, invites, billing, Razorpay, OAuth, email |
| `battery-api` | `github.com/anvayalabs/battery-api` | 8080 | Battery batches, passports, compliance, EPR, supplier due diligence, telemetry, Tally, PDF/QR |
| `textile-api` | `github.com/anvayalabs/textile-api` | 8082 | Textile lots, passports, ESPR compliance, templates, billing |

### 6.2 No Web Framework: Standard Library HTTP

All three services use Go's standard library:

```go
// services/battery-api/cmd/server/main.go
mux := http.NewServeMux()
mux.HandleFunc("GET /api/v1/health", handlers.HealthCheck)
// ...
log.Fatal(http.ListenAndServe(":"+cfg.Port, mux))
```

This is a deliberate choice:

- **Simpler dependency graph** — no Gin/Fiber/Echo version drift.
- **Explicit routing** — every route is visible in `cmd/server/main.go`.
- **Middleware composition** is manual but transparent.

Trade-off: developers must write more boilerplate for middleware, parameter extraction, and JSON helpers.

### 6.3 Layered Code Organization

Each Go service follows a similar internal layout:

```text
services/<service>/
├── cmd/
│   ├── server/main.go              # HTTP server, route registration
│   ├── migration_runner/main.go    # SQL migration runner
│   └── apply_schema/main.go        # Baseline schema applier
├── internal/
│   ├── config/                     # Env/config structs
│   ├── db/                         # pgx pool setup + migrations
│   ├── handlers/                   # HTTP handlers (controller layer)
│   ├── services/                   # Business logic / domain services
│   ├── repository/                 # Raw SQL data access
│   ├── middleware/                 # Auth, API key, logging, CORS
│   ├── models/                     # Go structs
│   ├── compliance/                 # Product/market validators
│   ├── integrations/               # External HTTP clients (Razorpay, Tally, registries)
│   └── events/                     # In-process event bus
└── api/
    └── openapi.yaml                # API spec (textile-api still titled "Battery API")
```

### 6.4 Route Map (Battery API)

```text
/api/v1/auth/*                     # Login, register, refresh, logout, me, forgot/reset password
/api/v1/batches/*                  # Batch CRUD, bulk CSV import
/api/v1/batches/{batch_id}/components/*  # BOM / component hierarchy
/api/v1/components/*               # Component library
/api/v1/passports/*                # Passport generation, list, detail
/api/v1/passports/{uuid}/transition      # Lifecycle transitions
/api/v1/passports/{uuid}/repairs   # Repair history
/api/v1/compliance/*               # Compliance scoring, gap analysis
/api/v1/epr/*                      # India EPR ledger, obligations, Form 3 export
/api/v1/suppliers/*                # Supplier management
/api/v1/dd-assessments/*           # Due diligence assessments
/api/v1/dgft-claims/*              # DGFT TRACE export claims
/api/v1/billing/*                  # Plans, invoices, usage
/api/v1/telemetry/*                # BMS telemetry ingestion
/api/v1/device-tokens/*            # IoT device registration
/api/v1/regulatory/*               # Regulatory intelligence
/api/v1/external/*                 # External ERP API-key access
/api/v1/integrations/tally/*       # Tally Prime ERP sync
/api/v1/webhooks/razorpay          # Razorpay payment webhooks
/health                            # Render health check
```

`textile-api` mirrors this structure with textile-specific handlers; `platform-core` is narrower (auth, team, billing, OAuth, webhooks).

### 6.5 Database Access

- **Driver:** `jackc/pgx/v5` with `pgxpool`.
- **ORM:** None. SQL is written directly in repository functions.
- **Migrations:** Custom runner (`cmd/migration_runner/main.go`) executes numbered `.up.sql` / `.down.sql` files.
- **Migration counts:** ~185 files in battery-api, ~133 in textile-api. platform-core has no local migrations because historically it shared the battery DB schema.

### 6.6 Inter-Service Communication

| Mechanism | Usage |
|-----------|-------|
| Direct HTTP/gRPC | **None** between services |
| Shared JWT secret | `platform-core` is the source of truth on Render; battery-api and textile-api read it via `fromService` |
| Shared database schema | Historically all services shared one Supabase DB; migration to DB-per-service is in progress |
| In-process event bus | `internal/events/bus.go` per service for domain events (e.g., `batch.activated`) |
| External webhooks | Razorpay, Resend email, Supabase Storage, Tally ERP, registry adapters |

This is currently a **loosely coupled, database-aligned** architecture rather than a message-driven microservice mesh.

---

## 7. Data Architecture

### 7.1 Target State: DB-per-Service

The documented target is **three separate Supabase PostgreSQL projects**:

1. **platform-core DB** — users, tenants, teams, team_members, transactions, OAuth state.
2. **battery-api DB** — battery batches, passports, components, compliance, EPR, telemetry.
3. **textile-api DB** — textile lots, passports, schemas, ESPR compliance.

### 7.2 Current State

- All services were originally deployed against a **single shared Supabase database**.
- Battery and textile schemas were mixed, leading to cross-product table pollution.
- `docs/DATABASE_SPLIT_STRATEGY.md` documents the phased cleanup:
  1. Drop textile tables/columns from the battery DB.
  2. Create a clean textile DB from `schema_clean.sql`.
  3. Migrate textile data out of the battery DB.
  4. Update each service's `DATABASE_URL`.
  5. (Future) Extract platform-core to its own DB and have product APIs call it via REST.

### 7.3 Key Data Patterns

| Pattern | Implementation |
|---------|----------------|
| **Product-agnostic schemas** | `product_schemas` table + JSONB specs to support future product lines |
| **Separated tenant profiles** | `battery_tenant_profiles` and `textile_tenant_profiles` isolate product metadata |
| **Immutable audit trail** | `passport_events` hash-chained with SHA-256 (README says BLAKE2b; verify in code) |
| **Three-tier access** | Public QR scan / partner magic-link / regulator API key |
| **Hash-chained certificates** | OpenTimestamps Bitcoin anchoring for tamper evidence |

---

## 8. Authentication & Authorization

### 8.1 Stack

- **Token type:** JWT HS256 (`golang-jwt/jwt/v5`)
- **Password hashing:** bcrypt
- **Token pair:** short-lived access token + long-lived refresh token with JTI revocation
- **OAuth:** Google & Microsoft login handled in platform-core
- **API keys:** separate middleware for external ERP integration

### 8.2 Roles

| Role | Scope |
|------|-------|
| `owner` | Full tenant access |
| `operator` | Most operations, no billing/destructive actions |
| `viewer` | Read-only |
| `supplier` | Supplier portal access only |

### 8.3 Token Storage by Client

| Client | Access Token | Refresh Token |
|--------|--------------|---------------|
| Web | In-memory | HttpOnly cookie |
| Desktop | `localStorage("token")` | Not currently isolated |
| Mobile | `expo-secure-store` | SecureStore |

---

## 9. Compliance Engine Architecture

The platform uses a **pluggable compliance registry** that maps `(ProductType, MarketRegion)` to a validator.

```text
ProductType = BATTERY | TEXTILE | ELECTRONICS
MarketRegion = INDIA | EU | GLOBAL
```

- `GLOBAL` mode runs both India and EU validators simultaneously.
- Validators are in `internal/compliance/<product>/`.
- Each validator returns a `ComplianceCheckResult` with gaps, scores, and pass/warn/fail status.
- Battery validators cover EU Battery Regulation (carbon footprint Art 7, recycled content Art 8, due diligence Art 48–52, Annex XIII data) and India CPCB/BIS/MoRTH.
- Textile validators cover EU ESPR and India textile EPR.

---

## 10. Shared Packages

| Package | Name | Purpose | Build Step | Adoption |
|---------|------|---------|------------|----------|
| `packages/ui` | `@anvaya/ui` | Shared shadcn/Radix UI components | None (source `.tsx` imported directly) | Active in all web apps |
| `packages/types` | `@anvaya/types` | Shared TS types mirroring backend models | None (source `.ts`) | Declared; not heavily imported yet |
| `packages/typescript-config` | `@anvayalabs/typescript-config` | TSConfig presets (`base`, `nextjs`, `react-library`) | None | Partially adopted |
| `packages/config/eslint` | `@anvayalabs/eslint-config` | ESLint preset | None | Defined, not used |
| `packages/config/tailwind` | `@anvayalabs/tailwind-config` | Tailwind v3-style preset | None | Defined, not used; incompatible with Tailwind v4 |

### 10.1 Notable Coupling Issue

`@anvaya/ui` components import `cn` from `@/lib/utils`. Every consuming app must therefore duplicate `lib/utils.ts`. This is not ideal; consider moving `cn` into the shared package or a shared utilities package.

---

## 11. Deployment & Infrastructure

### 11.1 Render Blueprint (`render.yaml`)

| Resource | Service | Build | Start | Health |
|----------|---------|-------|-------|--------|
| Web | `platform-core` | `go build -o platform-core ./cmd/server/main.go` | `./platform-core` | `/health` |
| Web | `battery-api` | `go build -o battery-api ./cmd/server/main.go` | `./battery-api` | `/health` |
| Web | `textile-api` | `go build -o textile-api ./cmd/server/main.go` | `./textile-api` | `/health` |
| Job | `platform-core-migrate` | `go build -o migrate ./cmd/migration_runner/main.go` | `./migrate up` | — |
| Job | `battery-migrate` | same | `./migrate up` | — |
| Job | `textile-migrate` | same | `./migrate up` | — |

- Region: `singapore`
- Plan: `starter`
- No Dockerfiles; Render builds native Go binaries.
- `battery-api` and `textile-api` receive `JWT_SECRET` from `platform-core`.

### 11.2 Vercel Frontends

| App | Vercel Project | Build Strategy |
|-----|----------------|----------------|
| `marketing-web` | Separate project | `vercel build --prod` from app directory |
| `battery-web` | Separate project | Build after battery migration |
| `textile-web` | Separate project | Build after textile migration |
| `admin-web` | Separate project | Build after platform migration |

Each app has a `vercel.json` that runs `pnpm install && pnpm turbo run build --filter=<package-name>...` from the monorepo root so Vercel can resolve workspace dependencies.

### 11.3 Environment Variables

Key variables are documented in `.env.example`:

- `PLATFORM_CORE_*`, `BATTERY_API_*`, `TEXTILE_API_*` — per-service config
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — object storage
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — cache
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — payments
- `RESEND_API_KEY`, `EMAIL_FROM` — email
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — OAuth
- `NEXT_PUBLIC_*` — frontend service URLs

---

## 12. CI/CD Pipeline

File: `.github/workflows/ci.yml`

### 12.1 Jobs

```text
build-and-test
├── Node 20 + Go 1.24 + pnpm 9
├── pnpm install --frozen-lockfile
├── pnpm run build
├── go build ./... in every service
├── pnpm run test
└── go test ./... in every service

migrate-platform (main only, needs build-and-test)
├── DATABASE_URL from secrets.PLATFORM_DATABASE_URL
└── go run ./cmd/migration_runner up

migrate-battery (main only, needs build-and-test)
├── DATABASE_URL from secrets.BATTERY_DATABASE_URL
└── go run ./cmd/migration_runner up

migrate-textile (main only, needs build-and-test)
├── DATABASE_URL from secrets.TEXTILE_DATABASE_URL
└── go run ./cmd/migration_runner up

deploy-marketing (main only)
└── vercel pull / build / deploy --prod

deploy-battery-web (main only, needs migrate-battery)
└── vercel pull / build / deploy --prod

deploy-textile-web (main only, needs migrate-textile)
└── vercel pull / build / deploy --prod

deploy-admin-web (main only, needs migrate-platform)
└── vercel pull / build / deploy --prod

deploy-render (main only, needs all migrations)
└── curl POST $RENDER_DEPLOY_HOOK_URL
```

### 12.2 Deployment Order

1. Build & test all code.
2. Run database migrations.
3. Deploy frontends.
4. Trigger Render redeploy for backend services.

---

## 13. Observability & Security

### 13.1 Current Observability

- **Health checks:** each backend exposes `/health` for Render.
- **Logs:** Render/Vercel native logging; no centralized observability stack identified.
- **Metrics:** not currently instrumented with Prometheus/Datadog.
- **Tests:** Vitest for web, `go test` for Go. No E2E suite currently active (Playwright is a devDependency in marketing-web but not integrated in CI).

### 13.2 Security Measures

- Strict CSP headers in `battery-web` and `textile-web` `next.config.ts`.
- HttpOnly refresh-token cookie on web.
- API-key middleware for external integrations.
- Bcrypt password hashing.
- Role-based route guards.
- Environment secrets stored in Render dashboard and GitHub Secrets.

### 13.3 Known Security/Compliance Gaps

- GDPR / DPDP erasure workflows not implemented.
- Desktop stores token in `localStorage` (less secure than secure storage).
- No centralized secrets rotation or audit logging of admin actions.

---

## 14. Current State & Architectural Gaps

### 14.1 Strengths

- Mature battery feature set: passport generator, QR/GS1 Digital Link, W3C Verifiable Credentials, EPCIS 2.0 export, carbon calculator, recycled content tracking, BOM hierarchy, supplier portal, India EPR ledger, Tally integration, Razorpay billing, bulk CSV import, AI PDF parsing.
- Clean product-line separation at the service level.
- Reusable UI library and consistent design tokens.
- Automated CI/CD and deployment blueprints.

### 14.2 Critical Gaps

| Gap | Impact | Owner Area |
|-----|--------|-----------|
| Mobile app empty / desktop thin shell | Field/factory users cannot fully use the platform | `battery-mobile`, `textile-mobile`, `battery-desktop`, `textile-desktop` |
| Live CPCB/BIS/EU NANDO integrations | Compliance checks fall back to `self_declared` unless manually configured | `battery-api/internal/integrations/registry` |
| Dynamic LCA with supplier primary data | EU auditors require primary data, not static JRC factors | `battery-api/internal/compliance` |
| Event-driven architecture | Monolith cannot scale telemetry/compliance independently | Cross-service |
| Textile product parity | 7 dashboard routes are stubs; copy still references batteries | `textile-web`, `textile-api` |
| EU DPP Registry connector | Required by July 2026 | `battery-api`, `textile-api` |
| JSON-LD / DIN DKE SPEC 99100 AAS export | ERP interoperability | `battery-api` exports |
| REACH SVHC CAS-number screening | Currently presence-check only | `battery-api/internal/compliance` |
| Hard threshold enforcement on EU recycled content | Validator warns but does not fail | `battery-api/internal/compliance` |
| GDPR/DPDP erasure workflows | Legal requirement | `platform-core` |

---

## 15. Where Things Live — Quick Reference

| If you need to... | Go to... |
|-------------------|----------|
| Add a new web route | `apps/<app>/app/` or `apps/<app>/src/App.tsx` (desktop) |
| Add a shared UI component | `packages/ui/<component>.tsx` |
| Add shared TypeScript types | `packages/types/index.ts` |
| Add a backend API endpoint | `services/<svc>/cmd/server/main.go` + `internal/handlers/` |
| Add business logic | `services/<svc>/internal/services/` |
| Add a database query | `services/<svc>/internal/repository/` |
| Add/change schema | `services/<svc>/internal/db/migrations/` |
| Run migrations locally | `make migrate-up` |
| Change CI/CD | `.github/workflows/ci.yml` |
| Change backend infra | `render.yaml` |
| Change environment templates | `.env.example` |
| Understand product roadmap | `BATTERY_MASTER_IMPLEMENTATION_PLAN.md`, `docs/DPP_COMPETITIVE_ANALYSIS_ROADMAP.md` |
| Understand DB split plan | `docs/DATABASE_SPLIT_STRATEGY.md` |
| Understand textile gaps | `docs/TEXTILE_CLEANUP_PLAN.md`, `docs/textile_schema_gap_analysis.md` |

---

## 16. Decision Log

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Turborepo + pnpm workspaces | Fast install, good caching, modern monorepo tooling | npm workspace declaration is legacy and slightly confusing |
| Go stdlib HTTP | Minimal dependencies, explicit routing, easy to reason about | More boilerplate than a framework |
| Raw SQL + pgx | Fine-grained query control, no ORM magic | More code to maintain; no automatic migration generation |
| No inter-service HTTP calls | Simpler network topology; shared DB historically | Tight coupling through shared schema; hard to scale independently |
| Shared UI as source `.tsx` | No build step for shared packages; Next.js/Vite compile directly | Consumers must duplicate `lib/utils.ts` |
| Render + Vercel + Supabase | Cost-effective for an early-stage SaaS | Free-tier limits; may need to upgrade as usage grows |
| Tauri for desktop | Rust-based secure shell, small binary, web frontend reuse | Requires Rust toolchain |
| Expo for mobile | Faster iteration, single JS codebase | Larger binary, dependency on Expo ecosystem |

---

## 17. Reading Order for New Engineers

1. **Start here:** `README.md`, `SYSTEM_ARCHITECTURE.md` (this file).
2. **Understand the product:** `docs/DPP_COMPETITIVE_ANALYSIS_ROADMAP.md`, `docs/MANUFACTURER_PERSONA_DEEP_ANALYSIS.md`.
3. **Understand the plan:** `BATTERY_MASTER_IMPLEMENTATION_PLAN.md`, `docs/DEPLOYMENT_PLAN.md`.
4. **Run locally:** `make dev` and `make build`.
5. **Pick a subsystem:**
   - Frontend: `apps/battery-web` is the reference implementation.
   - Backend: `services/battery-api/cmd/server/main.go` is the route map.
   - Database: `services/battery-api/internal/db/migrations/`.
   - Shared UI: `packages/ui/button.tsx`.

---

*Document generated from codebase analysis on 2026-06-15. Keep updated when major architectural decisions change.*
