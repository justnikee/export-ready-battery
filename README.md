# ExportReady-Battery

Digital Battery Passport platform for global regulatory compliance.

ExportReady-Battery helps battery manufacturers comply with EU Battery Regulation (2023/1542) and India's Battery Aadhaar initiative. Generate unique digital passports, QR codes, and maintain traceability for every battery unit.

---

## Features

### Digital Battery Passports

- UUID-based identifiers per battery
- QR code generation (256x256 PNG)
- Public verification pages (no auth required)
- Lifecycle tracking (action-based, role-guarded, evidence-validated, audit logged)

### Batch Management

- Create batches with detailed specifications (chemistry, voltage, capacity)
- Bulk CSV upload with parallel processing
- Auto-generate serial numbers with market-specific prefixes
- Download QR codes as ZIP archives

### Multi-Market Compliance

- EU Market: EU Battery Regulation 2023/1542 compliant
- India Market: PLI compliance, BIS/EPR certification tracking
- Market-specific form fields and validation

### Team Management

- Invite team members via email
- Role-based access (Owner, Admin, Member)
- Seat limits enforced by billing plan

### Subscription and Billing

- Tiered plans (Free, Starter, Growth, Enterprise)
- Quota-based passport generation
- Razorpay payment integration (India)

### Analytics Dashboard

- Real-time production statistics
- QR scan tracking with geolocation
- Export activity feeds

---

## Tech Stack

| Layer    | Technology                         | Purpose                |
| -------- | ---------------------------------- | ---------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS | App Router, SSR, RSC   |
| Backend  | Go 1.24, Chi Router                | REST API, Worker pools |
| Database | PostgreSQL (Supabase)              | Data persistence       |
| Storage  | Supabase Storage                   | QR ZIPs, Label PDFs    |
| Email    | Resend API                         | Transactional emails   |
| Payments | Razorpay                           | Subscription billing   |

---

## Quick Start

### Prerequisites

- Go 1.24+
- Node.js 20+
- PostgreSQL 16+ (or Supabase account)
- Make (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/ExportReady-Battery.git
cd ExportReady-Battery
```

### 2. Setup Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# DATABASE_URL, JWT_SECRET, SUPABASE_*, etc.

# Install dependencies
go mod download

# Run migrations
make migrate-up

# NOTE: The legacy replay-all migrator (cmd/migrate) is unsafe for existing databases.
# Use it only on empty dev DBs with ALLOW_REPLAY_MIGRATIONS=true.

# Start the server
make run
```

Backend runs on `http://localhost:8080`.

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your API URL
# NEXT_PUBLIC_API_URL=http://localhost:8080

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`.

---

## Project Structure

```
ExportReady-Battery/
├── backend/                 # Go REST API
│   ├── api/                 # OpenAPI specification
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── config/          # Configuration
│   │   ├── db/              # Database connection
│   │   ├── handlers/        # HTTP handlers
│   │   ├── middleware/      # JWT auth, CORS
│   │   ├── models/          # Domain models
│   │   ├── repository/      # Data access layer
│   │   └── services/        # Business logic
│   └── templates/           # Email HTML templates
├── frontend/                # Next.js App
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── context/             # Auth context
│   └── lib/                 # Utilities
├── db/                      # Database migrations
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

---

## Configuration

### Backend Environment Variables

| Variable             | Description                  | Required |
| -------------------- | ---------------------------- | -------- |
| DATABASE_URL         | PostgreSQL connection string | Yes      |
| JWT_SECRET           | Secret for JWT signing       | Yes      |
| PORT                 | Server port (default: 8080)  | No       |
| FRONTEND_URL         | Frontend URL for CORS        | Yes      |
| QR_BASE_URL          | Base URL for QR code links   | Yes      |
| SUPABASE_URL         | Supabase project URL         | Yes      |
| SUPABASE_SERVICE_KEY | Supabase service role key    | Yes      |
| RESEND_API_KEY       | Resend API key for emails    | No       |
| EMAIL_FROM           | Sender email address         | No       |
| RAZORPAY_KEY_ID      | Razorpay API key             | No       |
| RAZORPAY_KEY_SECRET  | Razorpay secret              | No       |
| TEMPLATES_DIR        | Email templates directory    | No       |

### Frontend Environment Variables

| Variable            | Description     | Required |
| ------------------- | --------------- | -------- |
| NEXT_PUBLIC_API_URL | Backend API URL | Yes      |

---

## API Documentation

OpenAPI spec: `backend/api/openapi.yaml`

### Key Endpoints

```
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/magic-link

# Batches
POST /api/v1/batches
GET  /api/v1/batches
GET  /api/v1/batches/{id}
POST /api/v1/batches/{id}/upload
GET  /api/v1/batches/{id}/download
GET  /api/v1/batches/{id}/export

# Passports (Public)
GET  /api/v1/p/{uuid}

# Lifecycle (Action-Based)
POST /api/v1/passports/{uuid}/transition
POST /api/v1/passports/bulk/transition
GET  /api/v1/passports/{uuid}/transitions
GET  /api/v1/passports/{uuid}/events

# Magic Link Lifecycle
GET  /api/v1/passport/{uuid}/action-info
POST /api/v1/passport/{uuid}/transition
```

---

## Testing

### Backend

```bash
cd backend
go test ./...
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

---

## Database Migrations

```bash
cd backend

# Create new migration
make migrate-create name=add_new_table

# Run pending migrations
make migrate-up

# Rollback last migration
make migrate-down

# Check current version
make migrate-version
```

Important: `cmd/migrate` replays all migrations and can mutate existing data. It is locked behind `ALLOW_REPLAY_MIGRATIONS=true` and should be used only on empty dev databases. Use `make migrate-up` for normal operation.

---

## CSV Upload Format

```csv
serial_number,manufacture_date
EU-BAT-2026-001,2026-01-15
EU-BAT-2026-002,2026-01-15
EU-BAT-2026-003,2026-01-16
```

### India Market (additional columns)

```csv
serial_number,manufacture_date,cell_source,domestic_value_add,bill_of_entry_no,country_of_origin
IN-BAT-2026-001,2026-01-15,DOMESTIC,75.5,,
IN-BAT-2026-002,2026-01-15,IMPORTED,0,BOE123456,China
```

---

## Deployment

### Production Build

```bash
# Backend
cd backend
go build -o bin/server ./cmd/server

# Frontend
cd frontend
npm run build
```

### Docker (Coming Soon)

```bash
docker-compose up -d
```

---

## Compliance Support

### EU Battery Regulation (2023/1542)

| Requirement                   | Status          |
| ----------------------------- | --------------- |
| Battery Passport (Article 77) | Implemented     |
| Unique Identifier             | UUID + QR       |
| Material Composition          | JSONB specs     |
| Manufacturer Info             | Tenant profiles |
| Carbon Footprint              | Schema ready    |
| Recycled Content              | Schema ready    |

### India Battery Aadhaar

| Requirement           | Status      |
| --------------------- | ----------- |
| Unique ID per Battery | UUID system |
| PLI Compliance        | Tracking    |
| BIS Certification     | Tracking    |
| EPR Registration      | Tracking    |

---

## Documentation

Start with `docs/README.md` for the current documentation map.

Recommended active docs:

- `docs/DEVELOPER_ONBOARDING.md`
- `docs/PASSPORT_LIFECYCLE_TESTING.md`
- `docs/ENTERPRISE_COMPLIANCE_ROADMAP.md`
- `docs/BATTERY_PASSPORT_PITCH_AND_COMPLIANCE.md`
- `docs/PRODUCT_PASSPORT_ENGINE.md`
- `docs/TECHNICAL_DEBT.md`

Historical reports and superseded analysis files are kept under `docs/archived/`.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT. See `LICENSE`.
