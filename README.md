# ExportReady — AnvayaLabs Monorepo

Multi-tenant SaaS compliance platform for Indian battery manufacturers targeting EU export. Generates EU Battery Regulation 2023/1542-compliant Digital Product Passports, automates India-side filings (BIS, EPR, PLI DVA, DGFT), and produces the traceability artefacts required for EU market entry.

> **Build state:** Active development — no production users blocking. Break and ship freely.

---

## What This Product Does

Indian battery manufacturers face a two-sided compliance problem: India-side certifications (AIS-156, BIS, EPR/BWMR, PLI DVA ≥50%) and EU export requirements (Art.7 carbon footprint, Art.8 recycled content, Art.11 supply chain due diligence). ExportReady Battery handles both in a single platform:

- Issues **BPAN V2** serial numbers (`{REGION}-{MFR}-{CHEM}-{YYYY}-{NNNNN}`) and QR-backed Digital Product Passports
- Runs India + EU compliance validators and surfaces a pass/fail per regulatory article
- Signs passports as **W3C Verifiable Credentials** (Ed25519, did:key) and anchors certificate hashes to Bitcoin via OpenTimestamps
- Exports **GS1 EPCIS 2.0 JSON-LD** for supply chain traceability
- Tracks **mass balance** (cobalt, lithium, nickel, manganese, lead) with Book & Claim allocations per EU Art.8
- Calculates **JRC-aligned carbon footprint** (Class A–G) and **DGFT export incentives** (RoDTEP, Duty Drawback, Interest Equalization)
- Syncs with **Tally ERP** for invoice-level reconciliation
- Ingests **BMS telemetry** for SoH / cycle-count-driven lifecycle events
- Provides three-tier public passport access: tenant (JWT) / partner (magic link Bearer) / regulator (X-Regulator-Key header)

---

## Monorepo Structure

```
├── apps/
│   ├── battery-web/        Next.js 16 — primary Battery DPP dashboard (active)
│   ├── admin-web/          Next.js — internal admin panel
│   ├── marketing-web/      Static marketing site
│   ├── battery-desktop/    Tauri v2 desktop wrapper
│   ├── battery-mobile/     React Native (Expo) mobile app
│   ├── textile-web/        Next.js — Textile DPP dashboard (early stage)
│   ├── textile-desktop/    Tauri v2 desktop wrapper (early stage)
│   └── textile-mobile/     React Native (Expo) (early stage)
├── packages/
│   ├── ui/                 Shared shadcn/ui component library
│   ├── types/              Shared TypeScript types
│   ├── config/             Shared ESLint + Tailwind configs
│   └── typescript-config/  Shared tsconfig bases
├── services/
│   ├── battery-api/        Go 1.24 backend — ~90 REST routes, 187 migrations (active)
│   ├── textile-api/        Go backend for Textile DPP (early stage)
│   └── platform-core/      Go — Auth, Teams, Billing, JWT (shared)
├── docs/                   Product documentation
├── infra/                  Render blueprint (render.yaml in root)
├── Makefile                Convenience targets
└── turbo.json              Turborepo pipeline config
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.1, React 19, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | Go 1.24, stdlib `http.ServeMux`, pgx/v5 |
| Database | PostgreSQL (Supabase), JSONB `BatchSpec` for product-agnostic schema |
| Auth | JWT (15m access + 7d refresh), Google OAuth, Microsoft OAuth, Magic Link + OTP |
| Storage | Supabase Storage (`compliance-docs` bucket) |
| AI | Groq Llama-3.3-70b — datasheet parsing, AI batch creation |
| Payments | Razorpay |
| Blockchain | OpenTimestamps → Bitcoin (SHA-256 certificate anchoring) |
| VC Signing | Ed25519, W3C Verifiable Credential, LD-Proof, did:key |
| EPCIS | GS1 EPCIS 2.0 JSON-LD (ObjectEvent + TransactionEvent) |
| Monorepo | pnpm workspaces + Turborepo |
| Deployment | Render (Singapore region) |

---

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Go** 1.24+
- **PostgreSQL** 16+ (or a Supabase project)

---

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
# Backend
cp services/battery-api/.env.example services/battery-api/.env
# Edit: DATABASE_URL, JWT_SECRET, SUPABASE_*, GROQ_API_KEY, RAZORPAY_*

# Frontend
cp apps/battery-web/.env.local.example apps/battery-web/.env.local
# Edit: NEXT_PUBLIC_API_URL, JWT_SECRET (must match backend), NEXT_PUBLIC_SUPABASE_*
```

### 3. Run migrations

```bash
make migrate-up
```

### 4. Start in dev mode

```bash
# Everything at once
make dev

# Or individually
cd services/battery-api && go run ./cmd/server    # API on :8080
cd apps/battery-web && pnpm dev                   # Frontend on :3000
```

---

## App & Service Commands

### Battery Web (`apps/battery-web`)

```bash
pnpm --filter battery-web dev       # dev server on :3000
pnpm --filter battery-web build     # production build
pnpm --filter battery-web typecheck # tsc --noEmit
pnpm --filter battery-web test      # vitest (232 tests)
```

### Battery API (`services/battery-api`)

```bash
cd services/battery-api
go run ./cmd/server          # dev server on :8080
go build ./cmd/server        # compile binary
go test ./...                # run all tests
go vet ./...                 # static analysis
```

### Platform Core (`services/platform-core`)

```bash
cd services/platform-core
go run ./cmd/server          # shared auth/billing service on :8081
```

### Desktop Apps

```bash
pnpm --filter battery-desktop dev          # requires Tauri prerequisites
pnpm --filter battery-desktop tauri build  # native binary
```

> See [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### Mobile Apps

```bash
cd apps/battery-mobile && npx expo start   # requires Expo CLI
```

---

## Environment Variables

### `services/battery-api/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | HS256 signing secret (≥32 chars, must match frontend) |
| `JWT_EXPIRY` | Access token TTL (default `15m`) |
| `REFRESH_EXPIRY` | Refresh token TTL (default `168h`) |
| `BASE_URL` | Frontend base URL for QR code links |
| `VC_SIGNING_KEY` | Ed25519 private key (base64). Generate: `openssl rand -base64 32` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only) |
| `GROQ_API_KEY` | Groq API key for Llama-3.3-70b datasheet parsing |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay payment credentials |
| `REGISTRY_WORKER_COUNT` | Concurrent registry sync workers (default `3`) |

### `apps/battery-web/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:8080/api/v1`) |
| `JWT_SECRET` | Must match backend `JWT_SECRET` (used by Next.js proxy to verify token) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_BRAND_NAME` | Brand name shown on public passport page (default `ExportReady`) |

---

## Architecture Highlights

**Core data model:** `Tenant → Batch → Passport`. Each Passport gets a BPAN V2 serial and a lifecycle state machine (DRAFT → ACTIVE → SHIPPED → RETURNED → RECALLED → DECOMMISSIONED).

**Compliance engine:** `compliance.Registry` maps `(ProductType, MarketRegion)` to validators. India validator checks AIS-156, AIS-038, PLI DVA ≥50%, EPR/BWMR, BIS. EU validator checks Art.7 carbon, Art.8 recycled content, Art.11 due diligence, REACH.

**Background workers** run inside the Go binary at startup:
- Registry sync pool — validates external certs against BIS, CPCB, EU NANDO, UN38.3
- Anchor upgrade ticker (every 30m) — upgrades pending OTS proofs to confirmed
- Tally sync ticker (every 5m) — imports invoices from Tally ERP XML
- Regulatory intelligence worker (every 6h) — fetches regulatory updates
- Daily alert ticker (every 24h) — cert expiry and compliance deadline notifications

**Passport access tiers:**
- `Authorization: Bearer <jwt>` — tenant user (full access)
- `Authorization: Bearer <magic-link-token>` — partner read-only access
- `X-Regulator-Key: <key>` — regulator read-only access (EU Art.78 compliant)

**Audit trail:** Passport lifecycle events are hash-chained. Certificate hashes are anchored to Bitcoin via OpenTimestamps for tamper-evident proof-of-existence.

---

## Dashboard Pages (`apps/battery-web`)

| Route | Purpose |
|---|---|
| `/dashboard` | Overview stats + action queue |
| `/dashboard/batches` | Create and manage battery batches |
| `/dashboard/lifecycle` | Passport lifecycle transitions + bulk ops |
| `/dashboard/dispatch` | QR scan dispatch (ACTIVATE → SHIP flow) |
| `/dashboard/compliance` | India compliance hub (EPR, BIS, CPCB, PLI DVA) |
| `/dashboard/eu-compliance` | EU Battery Regulation compliance hub (Art.7/8/11) |
| `/dashboard/due-diligence` | Supply chain due diligence + corrective actions |
| `/dashboard/mass-balance` | Material mass balance ledger (EU Art.8) |
| `/dashboard/analytics` | Scan analytics + compliance metrics |
| `/dashboard/exports` | Export job queue (EPCIS, CSV, PDF) |
| `/dashboard/dgft-claims` | DGFT incentive claim management |
| `/dashboard/partners` | Trusted partners, partner codes, webhooks |
| `/dashboard/templates` | Saved batch templates + AI creation |
| `/dashboard/regulatory` | External regulatory intelligence feed |
| `/dashboard/settings` | Profile, compliance config, API tokens, suppliers |
| `/dashboard/billing` | Subscription and payment management |
| `/dashboard/team` | Team members and invitations |
| `/dashboard/developer` | API keys, webhook logs, docs |
| `/dashboard/admin` | Internal admin panel |

---

## Makefile Targets

| Command | Description |
|---|---|
| `make dev` | Start all apps and services in dev mode |
| `make build` | Build all frontends and backends |
| `make test` | Run all tests (frontend + backend) |
| `make migrate-up` | Run pending database migrations |
| `make lint` | Lint all code |
| `make format` | Format all code |
| `make clean` | Remove build artefacts |
| `make deps` | Download all dependencies |

---

## Deployment

Deployed on **Render** (Singapore region) via `render.yaml` blueprint:

```bash
# First deploy:
# 1. Push render.yaml to repo root
# 2. Render Dashboard → Blueprints → New Blueprint → connect repo
# 3. Set secret env vars in Render dashboard (DATABASE_URL, JWT_SECRET, etc.)
# 4. Deploy
```

Services: `platform-core` (`:8081`), `battery-api` (`:8080`), `textile-api` (`:8082`), frontend apps as static sites or web services.

---

## License

Private — AnvayaLabs
