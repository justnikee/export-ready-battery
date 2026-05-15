# AnvayaLabs Battery — Agent Guide

> This file is written for AI coding agents. Expect the reader to know nothing about the project. All instructions must be concrete and derived from actual codebase content — no assumptions.

---

## Project Overview

**AnvayaLabs Battery** is a Digital Battery Passport (DBP) SaaS platform for global regulatory compliance. It helps battery manufacturers comply with:

- **EU Battery Regulation 2023/1542** (Article 77 Digital Battery Passport, Article 78 regulator access)
- **India Battery Aadhaar / BIS / EPR** (BPAN unique IDs, IS 16046 certification, Extended Producer Responsibility)

The platform generates UUID-based digital passports with QR codes for every battery unit, tracks full lifecycle events (manufacturing → shipping → installation → recycling), and provides immutable audit trails.

The codebase is a **multi-tier monorepo** with three main applications:

| Application | Technology | Purpose |
|-------------|------------|---------|
| `backend/` | Go 1.24, stdlib `http.ServeMux` | REST API, business logic, workers |
| `frontend/` | Next.js 16, React 19, Tailwind CSS v4 | Web application (App Router, SSR) |
| `desktop/` | Tauri v2 (Rust) + Vite + React 19 | Cross-platform desktop app |

---

## Tech Stack Details

### Backend
- **Language:** Go 1.24+
- **Router:** stdlib `http.ServeMux` (Go 1.22+ pattern syntax)
- **Database:** PostgreSQL 16+ (managed via Supabase)
- **DB Driver:** `jackc/pgx/v5` (native driver, not ORM)
- **Migrations:** `golang-migrate` compatible sequential SQL files (`backend/internal/db/migrations/`)
- **Auth:** JWT (`golang-jwt/jwt/v5`) + OAuth 2.0 (Google, Microsoft)
- **Email:** Resend API
- **Payments:** Razorpay (India market)
- **QR Codes:** `skip2/go-qrcode` (256×256 PNG)
- **PDFs:** `jung-kurt/gofpdf` (labels, compliance declarations)
- **GeoIP:** MaxMind GeoLite2 + `oschwald/geoip2-golang`
- **Hashing:** BLAKE2b for immutable event hash chains

### Frontend
- **Framework:** Next.js 16.1.1 (App Router, React Server Components)
- **React:** 19.2.3
- **Styling:** Tailwind CSS v4 with `@tailwindcss/postcss`
- **UI Primitives:** Radix UI (dialog, dropdown, select, checkbox, etc.)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod v4
- **Server State:** TanStack Query (React Query) v5
- **HTTP Client:** Axios (with request/response interceptors for JWT refresh)
- **Themes:** `next-themes` (light/dark mode)
- **Toasts:** Sonner
- **Animations:** Framer Motion
- **Markdown:** `react-markdown` + `rehype-highlight`

### Desktop
- **Framework:** Tauri v2 (Rust backend)
- **Frontend:** Vite 7 + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 with `@tailwindcss/vite`
- **Router:** `react-router-dom` v7

---

## Directory Structure

```
AnvayaLabs-Battery/
├── backend/                    # Go REST API
│   ├── api/
│   │   └── openapi.yaml        # OpenAPI 3.0 spec + Swagger UI at /docs
│   ├── cmd/
│   │   ├── server/main.go      # API server entry point
│   │   ├── migration_runner/   # Up/down/version migrations (production-safe)
│   │   ├── migrate/            # LEGACY replay-all migrator (dev-only)
│   │   ├── worker/             # Background worker binary
│   │   └── test_pdf/           # PDF generation test binary
│   ├── internal/
│   │   ├── app/
│   │   │   └── bootstrap.go    # Shared init: env → logger → config → DB
│   │   ├── auth/               # JWT logic
│   │   ├── compliance/
│   │   │   ├── battery/        # EU & India battery validators
│   │   │   ├── textile/        # EU & India textile validators
│   │   │   └── registry.go     # Pluggable compliance registry
│   │   ├── config/             # Environment-based config (returns error in prod if secrets missing)
│   │   ├── db/
│   │   │   ├── postgres.go     # Connection pool
│   │   │   └── migrations/     # Sequential SQL migrations (000001_*.up.sql)
│   │   ├── events/             # Async event bus
│   │   ├── handlers/           # HTTP handlers (one file per domain)
│   │   ├── logger/             # Structured JSON logger
│   │   ├── middleware/         # JWT auth, CORS, RBAC, rate limiting, API key auth, device auth
│   │   ├── models/             # Domain models + types
│   │   ├── repository/         # Data access layer (interfaces + Postgres impl + mock)
│   │   ├── schema/             # JSON schema registry (DB-backed, seeded with battery_v1)
│   │   ├── serial/             # BPAN serial number generation
│   │   └── services/           # Business logic (PDF, QR, CSV, email, lifecycle, etc.)
│   ├── templates/              # HTML email templates
│   ├── testdata/               # Test fixtures
│   └── uploads/                # Static file uploads (logos, etc.)
├── frontend/                   # Next.js web app
│   ├── app/                    # App Router
│   │   ├── (admin)/            # Admin route group
│   │   ├── (marketing)/        # Marketing pages (landing, pricing, blog)
│   │   ├── [product]/          # Product-specific auth dashboard
│   │   │   ├── dashboard/
│   │   │   ├── onboarding/
│   │   │   ├── accept-invite/
│   │   │   └── verify-email/
│   │   ├── p/[uuid]/           # Public passport verification pages
│   │   ├── auth/               # Auth pages (login, register, etc.)
│   │   ├── actions/            # Server actions
│   │   ├── blog/
│   │   ├── docs/
│   │   ├── privacy/
│   │   └── terms/
│   ├── components/             # React components (grouped by feature)
│   ├── context/                # React context (auth-context, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities, API clients, types
│   ├── providers/              # QueryProvider, etc.
│   └── public/                 # Static assets
├── desktop/                    # Tauri desktop app
│   ├── src/
│   │   ├── pages/              # React Router pages
│   │   ├── components/
│   │   ├── context/
│   │   └── lib/
│   └── src-tauri/
│       ├── src/
│       │   ├── main.rs         # Binary entry
│       │   └── lib.rs          # Tauri commands
│       └── Cargo.toml
├── docs/                       # Comprehensive documentation
│   ├── DEVELOPER_ONBOARDING.md # Primary onboarding guide
│   ├── CODEBASE_REVIEW.md
│   ├── DEMO_READINESS_AUDIT.md
│   ├── ENTERPRISE_COMPLIANCE_ROADMAP.md
│   ├── PASSPORT_LIFECYCLE_TESTING.md
│   └── archived/               # Superseded docs
├── scripts/                    # Utility scripts (Python, PowerShell)
├── testing/                    # Manual test plans (markdown)
├── design-system/              # Design tokens and design.md
└── graphify-out/               # Knowledge graph output (see graphify section below)
```

---

## Build and Run Commands

### Backend
```bash
# Run server (requires backend/.env)
make run
# Equivalent: go run backend/cmd/server/main.go

# Build production binary
make build
# Equivalent: cd backend && go build -o ../bin/server ./cmd/server

# Hot reload development (requires air)
make dev
# Equivalent: cd backend && air

# Download + tidy dependencies
make deps
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

### Desktop
```bash
cd desktop
npm install
npm run dev      # Vite dev server + Tauri
npm run build    # TypeScript compile + Vite build
npm run tauri    # Tauri CLI
```

### Full Stack (typical dev)
```bash
# Terminal 1 — backend
make run

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — desktop (optional)
cd desktop && npm run tauri dev
```

---

## Database Migrations

**CRITICAL:** Use `make migrate-up` for normal operations. The legacy `cmd/migrate` replay-all migrator is **unsafe for existing databases** and is locked behind `ALLOW_REPLAY_MIGRATIONS=true`. Use it only on empty dev databases.

```bash
# Run pending migrations
make migrate-up

# Rollback last migration
make migrate-down

# Check current version
make migrate-version

# Force set version (when stuck)
make migrate-force

# Create new migration
make migrate-create
# Prompts for name; creates 000XXX_name.up.sql / .down.sql
```

Migration files live in `backend/internal/db/migrations/` and use sequential numbering (`000001_initial_schema.up.sql`).

---

## Testing Strategy

### Backend Tests
```bash
cd backend
go test ./...
```

**Test file patterns:**
- `*_test.go` — Unit tests alongside source files
- `integration_test.go` — Handler → service → mock-repo integration tests using `httptest`
- `*_golden_test.go` — Golden file tests for PDF rendering
- `mock_repository.go` — Central mock implementation of `repository.Interface` using `stretchr/testify/mock`

**Key test conventions:**
- Use `repository.MockRepository` for isolating handler tests
- `newTestHandler(mockRepo)` helper in `handlers/integration_test.go`
- `setAuthContext(req, tenantID, email)` injects auth context for protected routes
- `testdata/` directories contain fixtures (CSV samples, PDF baselines)

### Frontend Tests
- No Jest/Vitest test suite is currently configured
- Quality gate: `npm run lint` + `npm run build` (catches TypeScript errors)

### Manual Testing
- `testing/` contains step-by-step manual test plans (01-authentication-onboarding.md through 07-audit-export.md)
- `LIFECYCLE_MANUAL_TEST_PLAN.md` covers passport lifecycle flows

---

## Code Style Guidelines

### Go (Backend)
- **Standard Go formatting:** `gofmt` / `goimports`
- **Package comments:** Every internal package has a doc comment explaining its purpose (see `app/bootstrap.go`)
- **Error wrapping:** Use `fmt.Errorf("...: %w", err)` for error propagation
- **Structured logging:** Use `log/slog` with key-value pairs (`slog.Info("msg", "key", value)`)
- **Context passing:** Pass `context.Context` through repository and service layers
- **Interface segregation:** `repository.Interface` is the central contract; Postgres implementations live in `repository/*.go`
- **Handler organization:** One file per domain (`auth_handlers.go`, `batch_handlers.go`, `lifecycle_handlers.go`, etc.)
- **Constants for context keys:** Use typed `ContextKey` string constants (`middleware.TenantIDKey`, `RoleKey`, etc.)

### TypeScript / React (Frontend)
- **Formatting:** Follow existing Prettier/ESLint config (`eslint-config-next`)
- **Components:** Feature-grouped under `components/`, UI primitives under `components/ui/`
- **Server state:** Use TanStack Query for all API calls; avoid local state for server data
- **HTTP client:** Always use the configured `axios` instance from `lib/api.ts` (handles JWT refresh)
- **Forms:** React Hook Form + Zod resolvers for validation
- **Theming:** `next-themes` with `attribute="class"`; default theme is `light`

---

## Environment Configuration

### Backend (`backend/.env`)
```bash
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/anvayalabs?sslmode=disable
BASE_URL=http://localhost:3000          # Frontend URL for QR codes
BACKEND_URL=http://localhost:8080       # For OAuth callbacks
FRONTEND_URL=http://localhost:3000      # OAuth redirect target
JWT_SECRET=...                          # Min 32 chars; app exits on bootstrap in prod if missing
JWT_EXPIRY=15m
REFRESH_EXPIRY=168h
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
EMAIL_FROM=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
REGULATOR_API_KEY=...                   # Article 78 regulator access
```

**Security note:** `config.Load()` returns an error in `production` mode if `JWT_SECRET`, `CORS_ORIGINS`, `DATABASE_URL`, or `BACKEND_URL` are unset or invalid. The bootstrap caller logs the error and exits the process.

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## Security Considerations

1. **JWT Secret:** Must be ≥32 characters in production; app exits on bootstrap if missing.
2. **CORS:** Whitelist-based (not wildcard). App exits on bootstrap in production if `CORS_ORIGINS` is empty.
2a. **APP_ENV:** Must be one of `development`, `staging`, `production`.
2b. **Database URL:** In production, must be set and must not point to `localhost`.
2c. **Backend URL:** In production, must be set explicitly.
3. **Auth middleware:** `middleware.Protect` validates JWT and injects `tenant_id`, `email`, `role`, `product_type` into context.
4. **RBAC:** `middleware.RequireRole("owner", "admin")` chains after `Protect`. Returns 403 if role mismatch.
5. **Rate limiting:** Separate rate limiters for auth routes (`AuthRateLimiter`) and general API (`APIRateLimiter`).
6. **API Keys:** External ERP integration uses HMAC-SHA256 signed API keys (`middleware.APIKeyAuth`).
7. **Device Tokens:** BMS telemetry uses separate device token authentication (`middleware.DeviceAuth`).
8. **Path traversal guard:** Static uploads handler strips `..` segments before serving files.
9. **Password hashing:** `bcrypt` via `golang.org/x/crypto/bcrypt`.
10. **Payment webhooks:** Razorpay webhooks validate HMAC-SHA256 signatures.
11. **Magic links:** Time-limited, single-use (or multi-use for specific actions like SOH update), optionally OTP-protected.

---

## Key Architecture Patterns

### Bootstrap Pattern
Every binary entry point calls `app.Bootstrap("service-name")` which performs four steps in order:
1. Load `.env` file (`godotenv.Overload`)
2. Initialize structured JSON logger (`logger.Init`)
3. Load typed config (`config.Load`)
4. Connect to PostgreSQL (`db.Connect`)

Callers must `defer deps.Close()` to release the DB pool.

### Handler Constructor Pattern
Handlers are initialized via `handlers.New(...)` with functional options:
```go
h := handlers.New(
    database, cfg.BaseURL, geoDBPath,
    razorpayKeyID, razorpaySecret,
    emailService, dataAccessService, regulatorAPIKey,
    handlers.WithBatchService(batchService),
    handlers.WithPassportService(passportService),
    handlers.WithEventBus(eventBus),
)
```

### Pluggable Compliance
`compliance.Registry` maps `(ProductType, MarketRegion)` to a validator interface. Currently registered:
- Battery + India → `battery.NewIndiaValidator()`
- Battery + EU → `battery.NewEUValidator()`
- Textile + India → `textile.NewIndiaValidator()`
- Textile + EU → `textile.NewEUValidator()`

### Schema Registry
`schema.Registry` caches JSON schemas in memory (seeded from `internal/schema/seeds/`) and persists to `product_schemas` table. Used for batch field validation.

### Event Bus
`events.Bus` provides async domain event dispatch. Used for decoupling side effects (webhooks, exports) from HTTP request handlers.

### Lifecycle Engine
`services.LifecycleService` manages passport state transitions with:
- Role-guarded actions
- Evidence validation (documents, photos)
- Immutable audit logging with BLAKE2b hash chain
- Outbound webhook notifications

---

## Common Operations for Agents

### Adding a New API Endpoint
1. Add handler method to the appropriate `backend/internal/handlers/*_handlers.go` file.
2. Register route in `backend/cmd/server/main.go` under the correct route group (public, protected, or RBAC-guarded).
3. Add OpenAPI spec to `backend/api/openapi.yaml`.
4. If it touches the database, add repository method to `repository/interface.go` and implement in `repository/*.go`.
5. Write tests in `*_test.go` using `repository.MockRepository`.

### Adding a Database Migration
```bash
make migrate-create
# Enter migration name when prompted
```
Write both `.up.sql` and `.down.sql`. Test with `make migrate-up` / `make migrate-down`.

### Adding a New Frontend Page
1. Create route directory under `frontend/app/` (or `frontend/app/[product]/` for product-scoped pages).
2. Use existing feature components from `frontend/components/`.
3. Use `lib/api.ts` for backend calls; wrap in TanStack Query hooks.
4. Reuse UI primitives from `frontend/components/ui/`.

### Running After Code Changes
```bash
# Backend
go test ./...

# Frontend
npm run lint
npm run build

# Keep graphify knowledge graph current
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

---

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current.

---

## Reference Data

- `bis_battery_manufacturers.json` — 40+ verified Indian battery manufacturers with BIS certification data. Used for regulatory validation and onboarding verification.

---

## Documentation Index

For deeper context, refer to these docs (all in `docs/`):

| Document | Purpose |
|----------|---------|
| `DEVELOPER_ONBOARDING.md` | Complete onboarding guide (tech stack, architecture, data flow) |
| `PASSPORT_LIFECYCLE_TESTING.md` | Lifecycle testing guide and test matrix |
| `ENTERPRISE_COMPLIANCE_ROADMAP.md` | Compliance feature roadmap |
| `CODEBASE_REVIEW.md` | Architecture review and quality assessment |
| `DEMO_READINESS_AUDIT.md` | Pre-demo checklist and known issues |
| `PRODUCT_PASSPORT_ENGINE.md` | Passport engine design documentation |
| `PLATFORM_BLUEPRINT.md` | High-level platform architecture |

---

*Last updated: 2026-05-14. Keep this file accurate — update it when build commands, environment variables, or architecture patterns change.*
