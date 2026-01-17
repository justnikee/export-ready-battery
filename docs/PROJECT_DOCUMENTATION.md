# ExportReady-Battery: Digital Battery Passport Platform

> **Comprehensive Technical Documentation**
> *Version 1.0 | January 2026*

---

## Executive Summary

**ExportReady-Battery** is a full-stack Digital Battery Passport platform designed to help battery manufacturers comply with global regulatory requirements, particularly the **EU Battery Regulation (2023/1542)** and India's **Battery Aadhaar** initiative. The platform enables manufacturers to generate, manage, and track unique digital passports for each battery unit, ensuring traceability, sustainability compliance, and consumer transparency.

### Business Value Proposition

| Stakeholder | Benefit |
|-------------|---------|
| **Manufacturers** | Automated compliance, batch management, bulk passport generation |
| **Regulators** | Real-time traceability, audit trails, material composition tracking |
| **Consumers** | QR-scannable verification, authentic product validation |
| **Export Partners** | EU-compliant documentation, ready for cross-border trade |

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (Next.js 16)"
        A[Landing Page] --> B[Auth Flow]
        B --> C[Dashboard]
        C --> D[Batch Management]
        C --> E[Passport Viewer]
        C --> F[Analytics]
    end
    
    subgraph "Backend (Go 1.24)"
        G[API Gateway] --> H[Auth Handlers]
        G --> I[Batch Handlers]
        G --> J[Passport Handlers]
        H --> K[Auth Service]
        I --> L[CSV Service]
        I --> M[QR Service]
        J --> N[PDF Service]
        L --> O[Repository Layer]
        M --> O
        N --> O
    end
    
    subgraph "Database (PostgreSQL)"
        O --> P[(Tenants)]
        O --> Q[(Batches)]
        O --> R[(Passports)]
    end
    
    A -.->|Public Access| J
    C -->|Protected API| G
```

### Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 16.1.1 | App Router, SSR, RSC |
| **Frontend** | React | 19.2.3 | UI Components |
| **Frontend** | Tailwind CSS | 4.x | Styling |
| **Frontend** | Framer Motion | 12.25.0 | Animations |
| **Frontend** | Recharts | 3.6.0 | Data Visualization |
| **Backend** | Go | 1.24.3 | Server Runtime |
| **Backend** | pgx/v5 | 5.8.0 | PostgreSQL Driver |
| **Backend** | golang-jwt | 5.3.0 | JWT Authentication |
| **Database** | PostgreSQL | Latest | Supabase-hosted |
| **Infra** | Supabase | - | Database, Storage |

---

## 2. Features Implemented ✅

### 2.1 Authentication System

| Feature | Status | Details |
|---------|--------|---------|
| User Registration | ✅ Complete | Company registration with email/password |
| JWT Login | ✅ Complete | Access tokens (15min) + Refresh tokens |
| Token Refresh | ✅ Complete | Automatic token rotation |
| Forgot Password | ✅ Complete | Email-based reset tokens |
| Reset Password | ✅ Complete | Secure token validation |
| Profile Update | ✅ Complete | Company details, logo, contact info |
| Protected Routes | ✅ Complete | Middleware-based JWT validation |

**API Endpoints:**
```
POST /api/v1/auth/register        - New tenant registration
POST /api/v1/auth/login           - JWT authentication
POST /api/v1/auth/refresh         - Token refresh
POST /api/v1/auth/forgot-password - Password reset initiation
POST /api/v1/auth/reset-password  - Password reset completion
PUT  /api/v1/auth/profile         - Update profile (Protected)
GET  /api/v1/auth/me              - Get current user (Protected)
```

---

### 2.2 Batch Management System

| Feature | Status | Details |
|---------|--------|---------|
| Create Batch | ✅ Complete | With full specifications (chemistry, voltage, capacity) |
| List Batches | ✅ Complete | Paginated, filtered by tenant |
| Get Batch Details | ✅ Complete | Includes passport count, specs |
| CSV Upload | ✅ Complete | High-performance parallel processing |
| QR Code Download | ✅ Complete | Bulk ZIP generation |
| CSV Export | ✅ Complete | Export passport data to CSV |

**API Endpoints:**
```
POST /api/v1/batches              - Create new batch
GET  /api/v1/batches              - List all batches (paginated)
GET  /api/v1/batches/{id}         - Get batch details
POST /api/v1/batches/{id}/upload  - Upload CSV with serial numbers
GET  /api/v1/batches/{id}/download - Download QR codes as ZIP
GET  /api/v1/batches/{id}/export  - Export passports to CSV
GET  /api/v1/batches/{id}/passports - List batch passports (paginated)
```

---

### 2.3 Digital Passport System

| Feature | Status | Details |
|---------|--------|---------|
| UUID-based Passports | ✅ Complete | Unique identifier per battery |
| QR Code Generation | ✅ Complete | 256x256 PNG, Medium error correction |
| Parallel Processing | ✅ Complete | Worker pool (20 goroutines) |
| Public Verification | ✅ Complete | No auth required for scanning |
| Batch Specifications | ✅ Complete | Chemistry, voltage, capacity, weight |

**Public Passport URL Structure:**
```
https://your-domain.com/p/{passport-uuid}
```

---

### 2.4 CSV Data Ingestion

| Feature | Status | Details |
|---------|--------|---------|
| Stream Processing | ✅ Complete | Memory-efficient for large files |
| Parallel Validation | ✅ Complete | Worker pool pattern (10 workers) |
| BOM Handling | ✅ Complete | UTF-8 BOM detection and removal |
| Multi-format Dates | ✅ Complete | YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY |
| Error Reporting | ✅ Complete | Row-level error messages |

**Expected CSV Format:**
```csv
serial_number,manufacture_date
BAT-2026-001,2026-01-15
BAT-2026-002,2026-01-15
```

---

### 2.5 Dashboard & Analytics

| Component | Status | Details |
|-----------|--------|---------|
| Stats Cards | ✅ Complete | Total batches, passports, scans |
| Recent Batches Table | ✅ Complete | With progress indicators |
| Activity Feed | ✅ Complete | Real-time activity log |
| Production Chart | ✅ Complete | Recharts line visualization |
| Batch Status Chart | ✅ Complete | Status distribution |
| Quota Card | ✅ Complete | Usage tracking |

---

### 2.6 Frontend Pages

| Page | Route | Status |
|------|-------|--------|
| Landing Page | `/` | ✅ Complete |
| Pricing Page | `/pricing` | ✅ Complete |
| Login | `/login` | ✅ Complete |
| Register | `/register` | ✅ Complete |
| Dashboard | `/dashboard` | ✅ Complete |
| Batches List | `/batches` | ✅ Complete |
| Batch Details | `/batches/[id]` | ✅ Complete |
| Public Passport | `/p/[uuid]` | ✅ Complete |
| Settings | `/settings` | ✅ Complete |
| Privacy Policy | `/privacy` | ✅ Complete |
| Terms of Service | `/terms` | ✅ Complete |
| Onboarding | `/onboarding` | ✅ Complete |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    TENANTS {
        uuid id PK
        varchar company_name
        varchar email UK
        varchar password_hash
        varchar reset_token
        timestamp reset_token_expires
        timestamp last_login
        timestamp created_at
    }
    
    BATCHES {
        uuid id PK
        uuid tenant_id FK
        varchar batch_name
        jsonb specs
        timestamp created_at
    }
    
    PASSPORTS {
        uuid uuid PK
        uuid batch_id FK
        varchar serial_number
        date manufacture_date
        varchar status
        timestamp created_at
    }
    
    TENANTS ||--o{ BATCHES : "owns"
    BATCHES ||--o{ PASSPORTS : "contains"
```

### 3.2 Table Specifications

#### `tenants` Table
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `batches` Table
```sql
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    batch_name VARCHAR(100) NOT NULL,
    specs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `passports` Table
```sql
CREATE TABLE passports (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    manufacture_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_id, serial_number)
);
```

### 3.3 Indexes
```sql
CREATE INDEX idx_batches_tenant_id ON batches(tenant_id);
CREATE INDEX idx_passports_batch_id ON passports(batch_id);
CREATE INDEX idx_passports_serial_number ON passports(serial_number);
CREATE INDEX idx_passports_status ON passports(status);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_reset_token ON tenants(reset_token);
```

---

## 4. Backend Architecture

### 4.1 Project Structure

```
backend/
├── cmd/
│   └── server/           # Application entry point
├── internal/
│   ├── config/           # Configuration management
│   ├── db/               # Database connection & pooling
│   ├── handlers/         # HTTP request handlers
│   │   ├── auth_handlers.go
│   │   ├── batch_handlers.go
│   │   ├── dashboard_handlers.go
│   │   ├── passport_handlers.go
│   │   ├── scan_handlers.go
│   │   ├── template_handlers.go
│   │   └── upload_handlers.go
│   ├── middleware/       # JWT auth middleware
│   ├── models/           # Domain models
│   ├── repository/       # Data access layer
│   │   ├── batch.go
│   │   ├── passport.go
│   │   ├── scan.go
│   │   ├── template.go
│   │   └── tenant.go
│   └── services/         # Business logic
│       ├── auth_service.go
│       ├── csv_service.go
│       ├── geo_service.go
│       ├── pdf_service.go
│       └── qr_service.go
└── testdata/             # Test fixtures
```

### 4.2 Key Services

#### QR Service (`qr_service.go`)
- Generates 256x256 PNG QR codes
- Parallel generation with worker pool (20 workers)
- ZIP archive creation for bulk download
- URL format: `{BASE_URL}/p/{passport-uuid}`

#### CSV Service (`csv_service.go`)
- Stream processing for large files
- Worker pool validation (10 workers)
- BOM detection and removal
- Multiple date format support
- Row-level error reporting

#### Auth Service (`auth_service.go`)
- JWT token generation (access + refresh)
- bcrypt password hashing
- Token validation and refresh

---

## 5. Frontend Architecture

### 5.1 Project Structure

```
frontend/
├── app/
│   ├── (auth)/           # Auth group (login, register)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── batches/
│   │   ├── dashboard/
│   │   └── settings/
│   ├── api/              # API routes (if any)
│   ├── onboarding/
│   ├── p/[uuid]/         # Public passport page
│   ├── pricing/
│   ├── privacy/
│   ├── terms/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── components/
│   ├── auth/             # Login/Register forms
│   ├── batches/          # Batch management components
│   │   ├── create-batch-dialog.tsx
│   │   ├── passport-list.tsx
│   │   └── upload-csv.tsx
│   ├── dashboard/        # Dashboard components
│   │   ├── ActivityFeed.tsx
│   │   ├── BatchStatusChart.tsx
│   │   ├── ProductionChart.tsx
│   │   ├── QuotaCard.tsx
│   │   ├── RecentBatchesTable.tsx
│   │   ├── StatsCard.tsx
│   │   ├── TopNav.tsx
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── landing/          # Landing page components
│   │   ├── CTAFooter.tsx
│   │   ├── FeatureGrid.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HowItWorks.tsx
│   │   └── TrustBar.tsx
│   ├── passport/         # Passport display
│   ├── pricing/          # Pricing components
│   ├── ui/               # Radix UI primitives
│   └── providers.tsx
├── context/              # React context providers
└── lib/                  # Utilities
```

### 5.2 UI Component Library

Built on **Radix UI** primitives with custom styling:

| Component | Source | Usage |
|-----------|--------|-------|
| Avatar | @radix-ui/react-avatar | User profile |
| Dialog | @radix-ui/react-dialog | Modals |
| Dropdown Menu | @radix-ui/react-dropdown-menu | Navigation |
| Label | @radix-ui/react-label | Form labels |
| Progress | @radix-ui/react-progress | Batch progress |
| Tabs | Custom | Settings tabs |
| Button | Custom | Actions |
| Card | Custom | Data display |
| Input | Custom | Form inputs |
| Table | Custom | Data tables |

---

## 6. API Reference

### 6.1 Authentication Endpoints

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "company_name": "Acme Batteries",
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "refresh_token": "eyJhbGciOiJIUzI1NiI...",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@acme.com",
  "company_name": "Acme Batteries",
  "expires_in": 900
}
```

### 6.2 Batch Endpoints

#### Create Batch
```http
POST /api/v1/batches
Authorization: Bearer {token}
Content-Type: application/json

{
  "batch_name": "January 2026 Production",
  "specs": {
    "chemistry": "Li-ion NMC",
    "voltage": "48V",
    "capacity": "100Ah",
    "weight": "45kg",
    "form_factor": "Prismatic"
  },
  "market_region": "EU"
}
```

#### Upload CSV
```http
POST /api/v1/batches/{id}/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [CSV file]
```

---

## 7. Deployment Configuration

### 7.1 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/database

# JWT
JWT_SECRET=your-secure-random-secret-key

# Server
PORT=8080
FRONTEND_URL=http://localhost:3000

# QR Code Base URL
QR_BASE_URL=https://your-domain.com
```

### 7.2 Available Commands

```bash
# Development
make run              # Start backend server
make dev              # Start with hot reload (requires air)

# Build
make build            # Build binary to ./bin/server

# Testing
make test             # Run all tests

# Database
make migrate-up       # Run pending migrations
make migrate-down     # Rollback last migration
make migrate-reset    # Rollback ALL migrations
make migrate-version  # Show current version
make migrate-create   # Create new migration
```

### 7.3 Frontend Commands

```bash
cd frontend
npm install           # Install dependencies
npm run dev           # Start dev server (port 3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint check
```

---

## 8. Features Pending / Roadmap 🚧

### 8.1 High Priority

| Feature | Description | Status |
|---------|-------------|--------|
| **Scan Analytics** | Track QR scans with geolocation | 🔄 Partially Implemented |
| **PDF Labels** | Printable label sheets with QR codes | 🔄 Service exists, needs UI |
| **Template System** | Reusable batch specifications | 🔄 Backend complete, needs UI |
| **Email Notifications** | Password reset, batch completion | ⏳ Pending |
| **Bulk Actions** | Multi-select batch operations | ⏳ Pending |

### 8.2 Medium Priority

| Feature | Description | Status |
|---------|-------------|--------|
| **API Rate Limiting** | Prevent abuse | ⏳ Pending |
| **Webhook Notifications** | Real-time event callbacks | ⏳ Pending |
| **Batch Archiving** | Move old batches to archive | ⏳ Pending |
| **Advanced Filtering** | Filter batches by date, status | ⏳ Pending |
| **Export PDF Report** | Batch summary with all passports | ⏳ Pending |

### 8.3 Future Enhancements

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-tenant Admin** | Super-admin dashboard | 🔮 Planned |
| **API Keys** | Programmatic access for integrations | 🔮 Planned |
| **Blockchain Anchoring** | Immutable passport records | 🔮 Planned |
| **Mobile App** | Native iOS/Android scanner | 🔮 Planned |
| **SSO/SAML** | Enterprise authentication | 🔮 Planned |

---

## 9. Compliance & Regulations

### 9.1 EU Battery Regulation (2023/1542)

The platform is designed to support compliance with:

| Requirement | Platform Support |
|-------------|------------------|
| **Article 77** - Battery Passport | ✅ UUID-based passports |
| **Unique Identifier** | ✅ QR codes per battery |
| **Material Composition** | ✅ Specs JSONB (cobalt, lithium, nickel, lead) |
| **Manufacturer Info** | ✅ Tenant profile data |
| **Carbon Footprint** | 🔄 Schema supports, UI pending |
| **Recycled Content** | 🔄 Schema supports, UI pending |

### 9.2 India Battery Aadhaar

| Requirement | Platform Support |
|-------------|------------------|
| **Unique ID per Battery** | ✅ UUID system |
| **Manufacturer Registration** | ✅ Tenant system |
| **Production Tracking** | ✅ Batch management |
| **Traceability** | ✅ Full audit trail |

---

## 10. Security Measures

| Layer | Implementation |
|-------|----------------|
| **Authentication** | bcrypt password hashing, JWT tokens |
| **Authorization** | Tenant-scoped resource access |
| **Transport** | HTTPS enforced in production |
| **Database** | Prepared statements (SQL injection prevention) |
| **CORS** | Configured for frontend origin |
| **Token Expiry** | Access: 15min, Refresh: 7 days |

---

## 11. Performance Optimizations

| Area | Optimization |
|------|--------------|
| **CSV Upload** | Stream processing, worker pool (10 workers) |
| **QR Generation** | Parallel generation (20 workers) |
| **Database** | Connection pooling via pgx |
| **Frontend** | React 19 with Compiler, Next.js RSC |
| **Pagination** | Cursor-based for large datasets |

---

## 12. Testing

### Backend Tests
```bash
cd backend
go test -v ./...
```

### Test Data
Located in `backend/testdata/`:
- Sample CSV files for upload testing
- Test fixtures for various scenarios

---

## 13. Contact & Support

For technical questions or issues, refer to:
- **Repository Issues**: GitHub Issues tracker
- **Documentation**: This document + README.md

---

*Document generated: January 13, 2026*
*Last updated: v1.0*
