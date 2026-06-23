# AnvayaLabs Monorepo

Battery & Textile Digital Product Passport (DPP) Platform — a unified monorepo for regulatory compliance SaaS.

## Monorepo Structure

```
├── apps/
│   ├── battery-web/        Next.js frontend for Battery Passport
│   ├── textile-web/        Next.js frontend for Textile DPP
│   ├── battery-desktop/    Tauri desktop app for Battery Passport
│   ├── textile-desktop/    Tauri desktop app for Textile DPP
│   ├── battery-mobile/     React Native (Expo) app for Battery Passport
│   ├── textile-mobile/     React Native (Expo) app for Textile DPP
│   └── marketing-web/      Static marketing site
├── packages/
│   ├── ui/                 Shared UI components (shadcn/ui based)
│   ├── types/              Shared TypeScript types
│   └── config/             Shared ESLint, TS, Tailwind configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
├── services/
│   ├── battery-api/        Go backend for Battery Passport
│   ├── textile-api/        Go backend for Textile DPP
│   └── platform-core/      Go shared services
├── infra/                  Terraform / Kubernetes configs
├── frontend/               Legacy unified frontend (migration in progress)
└── backend/                Legacy unified backend (migration in progress)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Web Frontends | Next.js 15+, React 19, Tailwind CSS v4, App Router |
| Desktop Apps | Tauri v2, Vite, React 19 |
| Mobile Apps | React Native, Expo |
| Backends | Go 1.24, stdlib `http.ServeMux`, PostgreSQL 16 |
| Monorepo Tooling | Turborepo, npm workspaces |
| Auth | JWT (`golang-jwt/jwt/v5`), OAuth 2.0 |

## Prerequisites

- **Node.js** 20+
- **Go** 1.24+
- **npm** 10+

## Quick Start

### Install dependencies

```bash
npm install
```

### Run everything in dev mode

```bash
make dev
# or
npm run dev
```

### Build everything

```bash
make build
# or
npm run build
```

### Run tests

```bash
make test
# or
npm run test
```

## App / Service Quick Starts

### Web Apps

| App | Dev Command | Build Command |
|---|---|---|
| `apps/battery-web` | `cd apps/battery-web && npm run dev` | `cd apps/battery-web && npm run build` |
| `apps/textile-web` | `cd apps/textile-web && npm run dev` | `cd apps/textile-web && npm run build` |
| `apps/marketing-web` | `cd apps/marketing-web && npm run dev` | `cd apps/marketing-web && npm run build` |

### Desktop Apps

| App | Dev Command | Build Command |
|---|---|---|
| `apps/battery-desktop` | `cd apps/battery-desktop && npm run dev` | `cd apps/battery-desktop && npm run tauri build` |
| `apps/textile-desktop` | `cd apps/textile-desktop && npm run dev` | `cd apps/textile-desktop && npm run tauri build` |

> Requires [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### Mobile Apps

| App | Dev Command |
|---|---|
| `apps/battery-mobile` | `cd apps/battery-mobile && npx expo start` |
| `apps/textile-mobile` | `cd apps/textile-mobile && npx expo start` |

> Requires [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Backend Services

| Service | Dev Command | Build Command |
|---|---|---|
| `services/battery-api` | `cd services/battery-api && go run ./cmd/server` | `cd services/battery-api && go build ./cmd/server` |
| `services/textile-api` | `cd services/textile-api && go run ./cmd/server` | `cd services/textile-api && go build ./cmd/server` |
| `services/platform-core` | `cd services/platform-core && go run ./cmd/server` | `cd services/platform-core && go build ./cmd/server` |

### Database Migrations

```bash
make migrate-up
```

## Architecture

- **Product registry pattern** — configuration-driven UI components across both product lines.
- **Separated tenant profiles** — `battery_tenant_profiles` and `textile_tenant_profiles` store product-specific compliance metadata.
- **Pluggable compliance** — `compliance.Registry` maps `(ProductType, MarketRegion)` to market validators (India / EU / Global).
- **Immutable audit trails** — Passport lifecycle events are hash-chained with BLAKE2b.
- **Monorepo caching** — Turborepo pipelines cache builds across apps and packages.

## Shared Packages

### `@anvayalabs/config`

Shared configuration for ESLint, TypeScript, and Tailwind CSS.

```bash
# Usage in an app/package package.json
dependencies: {
  "@anvayalabs/eslint-config": "*",
  "@anvayalabs/typescript-config": "*",
  "@anvayalabs/tailwind-config": "*"
}
```

## CI / CD

GitHub Actions workflow is defined in `.github/workflows/ci.yml`.

- Runs on every push to `main` and on pull requests
- Sets up Node.js 20 and Go 1.24
- Installs dependencies, builds all apps, and runs tests

## Scripts

| Command | Description |
|---|---|
| `make dev` | Run all apps in dev mode |
| `make build` | Build all apps and services |
| `make test` | Run all tests |
| `make migrate-up` | Run database migrations |
| `make lint` | Lint all code |
| `make format` | Format all code |
| `make clean` | Clean build artifacts |
| `make deps` | Download all dependencies |

## Contributing

1. Create a feature branch from `main`
2. Make changes in the relevant app/package/service
3. Ensure `make lint` and `make test` pass
4. Open a pull request

## License

Private — AnvayaLabs
