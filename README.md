# ExportReady-Battery 🔋

> **Digital Battery Passport Platform for Global Regulatory Compliance**

[![Go](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go&logoColor=white)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

ExportReady-Battery is a full-stack Digital Battery Passport platform helping battery manufacturers comply with **EU Battery Regulation (2023/1542)** and India's **Battery Aadhaar** initiative. Generate unique digital passports, QR codes, and maintain complete traceability for every battery unit.

---

## ✨ Features

### 🎫 Digital Battery Passports
- UUID-based unique identifiers per battery
- QR code generation (256×256 PNG)
- Public verification pages (no auth required)
- Lifecycle tracking (manufactured → shipped → in-service → recycled)

### 📦 Batch Management
- Create batches with detailed specifications (chemistry, voltage, capacity)
- Bulk CSV upload with parallel processing
- Auto-generate serial numbers with market-specific prefixes
- Download QR codes as ZIP archives

### 🌍 Multi-Market Compliance
- **EU Market**: EU Battery Regulation 2023/1542 compliant
- **India Market**: PLI compliance, BIS/EPR certification tracking
- Market-specific form fields and validation

### 👥 Team Management
- Invite team members via email
- Role-based access (Owner, Admin, Member)
- Seat limits enforced by billing plan

### 💳 Subscription & Billing
- Tiered plans (Free, Starter, Growth, Enterprise)
- Quota-based passport generation
- Razorpay payment integration (India)

### 📊 Analytics Dashboard
- Real-time production statistics
- QR scan tracking with geolocation
- Export activity feeds

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS | App Router, SSR, RSC |
| **Backend** | Go 1.24, Chi Router | REST API, Worker pools |
| **Database** | PostgreSQL (Supabase) | Data persistence |
| **Storage** | Supabase Storage | QR ZIPs, Label PDFs |
| **Email** | Resend API | Transactional emails |
| **Payments** | Razorpay | Subscription billing |

---

## 🚀 Quick Start

### Prerequisites

- **Go** 1.24+
- **Node.js** 20+ 
- **PostgreSQL** 16+ (or Supabase account)
- **Make** (optional, for convenience)

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

# Start the server
make run
```

Backend runs on **http://localhost:8080**

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

Frontend runs on **http://localhost:3000**

---

## 📁 Project Structure

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
├── frontend/                # Next.js 16 App
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── context/             # Auth context
│   └── lib/                 # Utilities
├── db/                      # Database migrations
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

---

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret for JWT signing | ✅ |
| `PORT` | Server port (default: 8080) | ❌ |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |
| `QR_BASE_URL` | Base URL for QR code links | ✅ |
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | ✅ |
| `RESEND_API_KEY` | Resend API key for emails | ❌ |
| `EMAIL_FROM` | Sender email address | ❌ |
| `RAZORPAY_KEY_ID` | Razorpay API key | ❌ |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | ❌ |
| `TEMPLATES_DIR` | Email templates directory | ❌ |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | ✅ |

---

## 📖 API Documentation

Full OpenAPI 3.0 specification available at:
- **File**: `backend/api/openapi.yaml`
- **Swagger UI**: Coming soon

### Key Endpoints

```
# Authentication
POST /api/v1/auth/register     - Register new company
POST /api/v1/auth/login        - Login and get JWT
POST /api/v1/auth/refresh      - Refresh access token
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

# Batches
POST   /api/v1/batches              - Create batch
GET    /api/v1/batches              - List batches (paginated)
GET    /api/v1/batches/{id}         - Get batch details
POST   /api/v1/batches/{id}/upload  - Upload CSV
GET    /api/v1/batches/{id}/download - Download QR ZIP

# Passports (Public)
GET    /api/v1/p/{uuid}             - View passport details

# Team
GET    /api/v1/team                 - List members
POST   /api/v1/team/invite          - Send invitation
POST   /api/v1/team/accept          - Accept invite
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
go test ./...

# Run with verbose output
go test -v ./...

# Run specific package tests
go test -v ./internal/services/...
```

### Frontend Tests

```bash
cd frontend

# Lint check
npm run lint

# Type check
npm run build
```

---

## 🗃️ Database Migrations

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

---

## 📝 CSV Upload Format

Upload batteries to a batch using CSV:

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

## 🏗️ Deployment

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

## 🔐 Security

- **Authentication**: bcrypt password hashing, JWT tokens
- **Authorization**: Tenant-scoped resource isolation
- **Transport**: HTTPS enforced in production
- **Database**: Prepared statements (SQL injection prevention)
- **CORS**: Configured for specific origins
- **Token Expiry**: Access (15 min), Refresh (7 days)

---

## 📜 Compliance Support

### EU Battery Regulation (2023/1542)

| Requirement | Status |
|-------------|--------|
| Battery Passport (Article 77) | ✅ Implemented |
| Unique Identifier | ✅ UUID + QR |
| Material Composition | ✅ JSONB specs |
| Manufacturer Info | ✅ Tenant profiles |
| Carbon Footprint | 🔄 Schema ready |
| Recycled Content | 🔄 Schema ready |

### India Battery Aadhaar

| Requirement | Status |
|-------------|--------|
| Unique ID per Battery | ✅ UUID system |
| PLI Compliance | ✅ Tracking |
| BIS Certification | ✅ Tracking |
| EPR Registration | ✅ Tracking |

---

## 📚 Documentation

Detailed documentation available in `docs/`:

- [Project Documentation](docs/PROJECT_DOCUMENTATION.md) - Complete technical docs
- [API Reference](backend/api/openapi.yaml) - OpenAPI specification
- [Feature Status](docs/FEATURE_STATUS_REVIEW.md) - Current feature status
- [Technical Debt](docs/TECHNICAL_DEBT.md) - Known issues & improvements

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [EU Battery Regulation](https://eur-lex.europa.eu/eli/reg/2023/1542/oj) for compliance requirements
- [Supabase](https://supabase.com) for database and storage
- [Resend](https://resend.com) for transactional emails
- [Razorpay](https://razorpay.com) for payment processing

---

<p align="center">
  Made with ❤️ for sustainable battery manufacturing
</p>
