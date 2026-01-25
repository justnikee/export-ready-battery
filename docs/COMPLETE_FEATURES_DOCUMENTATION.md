# ExportReady-Battery: Complete Features Documentation

> **Comprehensive Technical Reference**
> *Version 3.0 | January 25, 2026*

---

## 📋 Table of Contents

1. [System Overview](#1-system-overview)
2. [API Endpoints Reference](#2-api-endpoints-reference)
3. [Data Models & Database Schema](#3-data-models--database-schema)
4. [UI Pages & Routes](#4-ui-pages--routes)
5. [Dialogs & Popups](#5-dialogs--popups)
6. [User Flows](#6-user-flows)
7. [India Compliance](#7-india-compliance)
8. [DVA Calculator](#8-dva-calculator)
9. [Quota System & Batch Activation](#9-quota-system--batch-activation)
10. [Lifecycle Management](#10-lifecycle-management)
11. [Magic Link Authentication](#11-magic-link-authentication)
12. [Rewards & Gamification](#12-rewards--gamification)
13. [Public Battery Passport](#13-public-battery-passport)
14. [Developer API & API Keys](#14-developer-api--api-keys)
15. [Dashboard Components](#15-dashboard-components)

---

## 1. System Overview

### Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend [Next.js 16]"
        LP[Landing Page] --> AUTH[Auth Flow]
        AUTH --> DASH[Dashboard]
        DASH --> BATCH[Batch Management]
        DASH --> ANALYTICS[Analytics]
        BATCH --> PASSPORT[Passport Viewer]
    end
    
    subgraph "Backend [Go 1.24]"
        API[API Gateway] --> AH[Auth Handlers]
        API --> BH[Batch Handlers]
        API --> PH[Passport Handlers]
        API --> DH[Dashboard Handlers]
        API --> SH[Scan Handlers]
        API --> TH[Template Handlers]
        API --> UH[Upload Handlers]
    end
    
    subgraph "Database [PostgreSQL]"
        DB[(Supabase)]
    end
    
    PASSPORT -.->|Public Access| PH
    DASH -->|Protected API| API
    API --> DB
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 | App Router, SSR |
| **Styling** | Tailwind CSS 4.x + Framer Motion | Design + Animations |
| **Backend** | Go 1.24 + pgx/v5 | API Server |
| **Database** | PostgreSQL (Supabase) | Data Storage |
| **Auth** | JWT (golang-jwt v5) | Authentication |

---

## 2. API Endpoints Reference

### 2.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | New tenant registration | ❌ |
| `POST` | `/api/v1/auth/login` | JWT authentication | ❌ |
| `POST` | `/api/v1/auth/refresh` | Token refresh | ❌ |
| `POST` | `/api/v1/auth/forgot-password` | Password reset initiation | ❌ |
| `POST` | `/api/v1/auth/reset-password` | Password reset completion | ❌ |
| `PUT` | `/api/v1/auth/profile` | Update profile (incl. India compliance fields) | ✅ |
| `GET` | `/api/v1/auth/me` | Get current user | ✅ |

#### Register Request
```json
{
  "company_name": "Acme Batteries",
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

#### Login Response
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

#### Profile Update (with India Compliance)
```json
{
  "company_name": "Acme Batteries",
  "address": "Industrial Area, New Delhi",
  "support_email": "support@acme.com",
  "website": "https://acme.com",
  "epr_registration_number": "B-29016/2024-25/CPCB",
  "bis_r_number": "41001234",
  "iec_code": "0504012345"
}
```

---

### 2.2 Batch Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/batches` | Create new batch | ✅ |
| `GET` | `/api/v1/batches` | List all batches (paginated) | ✅ |
| `GET` | `/api/v1/batches/{id}` | Get batch details | ✅ |
| `POST` | `/api/v1/batches/{id}/upload` | Upload CSV with serial numbers | ✅ |
| `GET` | `/api/v1/batches/{id}/download` | Download QR codes as ZIP | ✅ |
| `GET` | `/api/v1/batches/{id}/export` | Export passports to CSV | ✅ |
| `GET` | `/api/v1/batches/{id}/passports` | List batch passports (paginated) | ✅ |

#### Create Batch Request (Dual-Mode)
```json
{
  "tenant_id": "uuid",
  "batch_name": "Q1-2026-Pro",
  "market_region": "INDIA",
  "specs": {
    "chemistry": "Li-ion NMC",
    "voltage": "48V",
    "capacity": "100Ah",
    "manufacturer": "Acme Batteries",
    "manufacturer_address": "Industrial Area, Delhi",
    "weight": "45kg",
    "carbon_footprint": "10 kg CO2e",
    "country_of_origin": "India",
    "recyclable": true
  },
  "pli_compliant": true,
  "domestic_value_add": 65.5,
  "cell_source": "DOMESTIC",
  "bill_of_entry_no": "1234567",
  "country_of_origin": "China",
  "customs_date": "2026-01-15"
}
```

---

### 2.3 Template Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/templates` | Create template | ✅ |
| `GET` | `/api/v1/templates` | List templates by tenant | ✅ |
| `GET` | `/api/v1/templates/{id}` | Get template details | ✅ |
| `DELETE` | `/api/v1/templates/{id}` | Delete template | ✅ |

---

### 2.4 Dashboard Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/dashboard/stats` | Get dashboard statistics | ✅ |
| `GET` | `/api/v1/dashboard/recent-batches` | Get recent batches | ✅ |

---

### 2.5 Scan Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/scan` | Record scan event | ❌ |
| `GET` | `/api/v1/scan/feed` | Get live scan feed | ✅ |

---

### 2.6 Public Passport Endpoint

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/passports/{uuid}` | Get public passport data | ❌ |

---

### 2.7 Lifecycle Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/passports/{uuid}/transitions` | Get allowed status transitions | ✅ |
| `POST` | `/api/v1/passports/{uuid}/transition` | Transition passport status | ✅ |
| `POST` | `/api/v1/passports/bulk/transition` | Bulk status transition | ✅ |
| `GET` | `/api/v1/passports/{uuid}/events` | Get passport audit trail | ✅ |

#### Transition Request
```json
{
  "to_status": "SHIPPED",
  "metadata": {
    "carrier": "FedEx",
    "tracking": "1234567890"
  }
}
```

---

### 2.8 Magic Link Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/magic-link` | Request magic link for lifecycle action | ❌ |
| `GET` | `/api/v1/passport/{uuid}/action-info` | Get action info (with token) | Token |
| `POST` | `/api/v1/passport/{uuid}/transition` | Complete transition via magic link | Token |

#### Magic Link Request
```json
{
  "passport_id": "uuid",
  "email": "mechanic@company.com",
  "role": "TECHNICIAN",
  "partner_code": "INSTALL-2026"
}
```

---

### 2.9 Batch Activation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/batches/{id}/activate` | Activate batch (consumes quota) | ✅ |
| `GET` | `/api/v1/batches/{id}/labels` | Download PDF labels (active only) | ✅ |

---

### 2.10 Partner Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/partners/domains` | List trusted domains | ✅ |
| `POST` | `/api/v1/partners/domains` | Add trusted domain | ✅ |
| `DELETE` | `/api/v1/partners/domains/{id}` | Remove trusted domain | ✅ |
| `GET` | `/api/v1/partners/codes` | List partner codes | ✅ |
| `POST` | `/api/v1/partners/codes` | Generate partner code | ✅ |
| `DELETE` | `/api/v1/partners/codes/{id}` | Revoke partner code | ✅ |

---

### 2.11 Developer API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/api-keys` | List API keys | ✅ |
| `POST` | `/api/v1/api-keys` | Create API key | ✅ |
| `DELETE` | `/api/v1/api-keys/{id}` | Revoke API key | ✅ |

---

### 2.12 Rewards Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/rewards/leaderboard` | Get points leaderboard | ✅ |
| `GET` | `/api/v1/rewards/balance` | Get user's reward balance | Token |

---

## 3. Data Models & Database Schema

### 3.1 Core Models

#### Tenant Model
```go
type Tenant struct {
    ID                    uuid.UUID  // Primary Key
    CompanyName           string     // Required
    Address               string     // Optional
    LogoURL               string     // Optional
    SupportEmail          string     // Optional
    Website               string     // Optional
    CreatedAt             time.Time
    
    // India Regulatory Compliance Fields (NEW)
    EPRRegistrationNumber string     // CPCB EPR registration
    BISRNumber            string     // BIS CRS registration (IS 16046)
    IECCode               string     // Import Export Code
}
```

#### Batch Model (Dual-Mode)
```go
type Batch struct {
    ID             uuid.UUID
    TenantID       uuid.UUID
    BatchName      string
    Specs          BatchSpec     // JSONB
    CreatedAt      time.Time
    
    // Dual-Mode Compliance Fields
    MarketRegion     MarketRegion  // "INDIA", "EU", or "GLOBAL"
    PLICompliant     bool          // India: PLI subsidy eligibility
    DomesticValueAdd float64       // India: % of local value
    CellSource       string        // "IMPORTED" or "DOMESTIC"
    Materials        *Materials    // EU: Material composition
    TotalPassports   int           // Computed count
    
    // India Import/Customs Fields (NEW)
    BillOfEntryNo   string         // Customs Bill of Entry number
    CountryOfOrigin string         // Source country for imported cells
    CustomsDate     *time.Time     // Date of customs clearance
}
```

#### BatchSpec (JSONB)
```go
type BatchSpec struct {
    Chemistry           string
    NominalVoltage      string
    Capacity            string
    Manufacturer        string
    Weight              string
    CarbonFootprint     string
    Recyclable          bool
    CountryOfOrigin     string
    
    // EU Regulatory Fields
    MaterialComposition   *MaterialComposition
    Certifications        []string
    ManufacturerAddress   string
    EURepresentative      string
    EURepresentativeEmail string
}
```

#### Passport Model
```go
type Passport struct {
    UUID            uuid.UUID
    BatchID         uuid.UUID
    SerialNumber    string     // Supports BPAN: IN-NKY-LFP-2026-00001
    ManufactureDate time.Time
    Status          string     // CREATED, SHIPPED, IN_SERVICE, RETURN_REQUESTED, RETURNED, RECALLED, RECYCLED, END_OF_LIFE
    CreatedAt       time.Time
    
    // Lifecycle tracking
    ShippedAt   *time.Time  // When battery left factory
    InstalledAt *time.Time  // When installed in device
    ReturnedAt  *time.Time  // When returned
    
    StateOfHealth float64    // 0-100%
    OwnerID       *uuid.UUID // Current owner
}
```

#### ScanEvent Model
```go
type ScanEvent struct {
    ID         uuid.UUID
    PassportID uuid.UUID
    IPAddress  string
    City       string
    Country    string
    DeviceType string
    UserAgent  string
    ScannedAt  time.Time
}
```

#### Template Model
```go
type Template struct {
    ID        uuid.UUID
    TenantID  uuid.UUID
    Name      string
    Specs     BatchSpec
    CreatedAt time.Time
}
```

#### PassportEvent Model (Lifecycle Audit)
```go
type PassportEvent struct {
    ID         uuid.UUID
    PassportID uuid.UUID
    EventType  string  // CREATED, SHIPPED, INSTALLED, RETURN_REQUESTED, RETURNED, RECALLED, RECYCLED
    Actor      string  // Email of person who triggered
    Metadata   map[string]interface{}
    CreatedAt  time.Time
}
```

#### TrustedDomain Model (Tier A Partners)
```go
type TrustedDomain struct {
    ID          uuid.UUID
    TenantID    uuid.UUID
    Domain      string  // e.g., "tatamotors.com"
    Role        string  // LOGISTICS, TECHNICIAN, RECYCLER
    Description string
    IsActive    bool
    CreatedAt   time.Time
}
```

#### PartnerCode Model (Tier B Access)
```go
type PartnerCode struct {
    ID        uuid.UUID
    TenantID  uuid.UUID
    Code      string    // e.g., "INSTALL-2026"
    Role      string
    MaxUses   int
    UsedCount int
    ExpiresAt time.Time
    IsActive  bool
}
```

#### RewardLedger Model (Gamification)
```go
type RewardLedger struct {
    ID             uuid.UUID
    TenantID       uuid.UUID
    RecipientEmail string
    PassportUUID   *uuid.UUID
    ActionType     string  // SCAN_INSTALL, SCAN_RECYCLE, SCAN_RETURN
    PointsEarned   int
    Metadata       map[string]interface{}
    CreatedAt      time.Time
}
```

#### APIKey Model
```go
type APIKey struct {
    ID          uuid.UUID
    TenantID    uuid.UUID
    KeyPrefix   string    // e.g., "sk_live_abc123"
    KeyHash     string    // Hashed secret
    Description string
    IsActive    bool
    CreatedAt   time.Time
    LastUsedAt  *time.Time
}
```

---

### 3.2 Database Tables

#### Entity Relationship Diagram
```mermaid
erDiagram
    TENANTS {
        uuid id PK
        varchar company_name
        varchar email UK
        varchar password_hash
        varchar epr_registration_number
        varchar bis_r_number
        varchar iec_code
        timestamp created_at
    }
    
    BATCHES {
        uuid id PK
        uuid tenant_id FK
        varchar batch_name
        jsonb specs
        varchar market_region
        boolean pli_compliant
        float domestic_value_add
        varchar cell_source
        varchar bill_of_entry_no
        varchar country_of_origin
        date customs_date
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
    
    TEMPLATES {
        uuid id PK
        uuid tenant_id FK
        varchar name
        jsonb specs
        timestamp created_at
    }
    
    SCAN_EVENTS {
        uuid id PK
        uuid passport_id FK
        varchar ip_address
        varchar city
        varchar country
        timestamp scanned_at
    }
    
    TENANTS ||--o{ BATCHES : "owns"
    TENANTS ||--o{ TEMPLATES : "creates"
    BATCHES ||--o{ PASSPORTS : "contains"
    PASSPORTS ||--o{ SCAN_EVENTS : "tracks"
```

---

### 3.3 Database Migrations

| Migration | Description |
|-----------|-------------|
| `000002_create_batch_templates` | Batch templates table |
| `000003_create_scan_events` | Scan event tracking |
| `000004_add_dual_mode` | Market region, PLI, DVA fields |
| `000005_add_tenant_details` | Tenant profile fields |
| `000006_add_soft_delete_batches` | Soft delete support |
| `000007_add_india_compliance` | EPR, BIS, IEC, customs fields |

---

## 4. UI Pages & Routes

### 4.1 Public Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Hero, features, trust bar, CTA |
| `/pricing` | Pricing Page | Pricing tiers and features |
| `/privacy` | Privacy Policy | Legal document |
| `/terms` | Terms of Service | Legal document |
| `/p/[uuid]` | Public Passport | QR-scannable battery passport |

### 4.2 Auth Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email/password authentication |
| `/register` | Register | Company registration |
| `/onboarding` | Onboarding | First-time setup wizard |

### 4.3 Dashboard Pages (Protected)

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard Overview | Stats, charts, recent activity |
| `/batches` | Batches List | All batches with search/filter |
| `/batches/[id]` | Batch Details | Passport list, CSV upload, QR download |
| `/settings` | Settings | Profile, India compliance fields |

---

## 5. Dialogs & Popups

### 5.1 Create Batch Dialog
**File:** `frontend/components/batches/create-batch-dialog.tsx`

**Features:**
- Target Market selection (India 🇮🇳 / EU 🇪🇺 / Global 🌍)
- Template loading with auto-fill animation
- Dynamic form fields based on market region
- India-specific: DVA Calculator, Cell Source, PLI checkbox
- Customs Declaration (for imported cells)
- Save as Template option

**Fields:**
| Field | Required | Market |
|-------|----------|--------|
| Batch Name | ✅ | All |
| Manufacturer | ✅ | All |
| Chemistry | ✅ | All |
| Capacity | ✅ | All |
| Voltage | ✅ | All |
| Weight | ❌ | All |
| Country of Origin | ❌ | All |
| Carbon Footprint | ✅ (EU) | EU/Global |
| Recyclable | ❌ | EU/Global |
| Domestic Value Add | ❌ | India |
| Cell Source | ❌ | India |
| PLI Compliant | ❌ | India |
| Bill of Entry No. | ✅ (if Imported) | India |
| Cell Country of Origin | ✅ (if Imported) | India |
| Customs Date | ✅ (if Imported) | India |

---

### 5.2 DVA Calculator Dialog (NEW)
**File:** `frontend/components/batches/dva-calculator.tsx`

**Purpose:** Calculate Domestic Value Add (DVA) for PLI eligibility

**Formula:**
```
DVA = ((Ex-Factory Sale Price - Cost of Imported Materials) / Ex-Factory Sale Price) × 100
```

**Features:**
- Real-time calculation as user types
- Visual PLI eligibility indicator (≥50% = Eligible)
- Progress bar with glow effect
- "Apply to Batch" button auto-fills form

**UI States:**
- 🟢 PLI Eligible (DVA ≥ 50%)
- 🔴 Low Value Add (DVA < 50%)

---

### 5.3 Upload CSV Dialog
**File:** `frontend/components/batches/upload-csv.tsx`

**Features:**
- Drag-and-drop file upload
- CSV format validation
- Progress indicator during upload
- Error reporting with row details

**Expected CSV Format:**
```csv
serial_number,manufacture_date
BAT-2026-001,2026-01-15
BAT-2026-002,2026-01-15
```

---

### 5.4 Download Labels Dialog
**File:** `frontend/components/batches/DownloadLabelsDialog.tsx`

**Features:**
- QR code preview
- Bulk ZIP download
- Label format options

---

## 6. User Flows

### 6.1 Batch Creation Flow

```mermaid
flowchart TD
    A[Click Create Batch] --> B[Select Target Market]
    B --> C{Market Region}
    C -->|India| D[Show India Fields]
    C -->|EU| E[Show EU Fields]
    C -->|Global| F[Show All Fields]
    D --> G{Cell Source?}
    G -->|Imported| H[Show Customs Declaration]
    G -->|Domestic| I[Skip Customs]
    H --> J[Fill DVA Calculator]
    I --> J
    J --> K[Submit Form]
    K --> L[Batch Created]
    L --> M[Upload CSV]
    M --> N[Passports Generated]
    N --> O[Download QR Codes]
```

### 6.2 Public Passport Scan Flow

```mermaid
flowchart TD
    A[User Scans QR Code] --> B[Load /p/uuid]
    B --> C[API: GET /passport/uuid]
    C --> D[Record Scan Event]
    D --> E{Market Region?}
    E -->|India| F[Show India Compliance View]
    E -->|EU| G[Show EU Compliance View]
    E -->|Global| H[Show Standard View]
    F --> I[Display DVA, EPR, BIS, Recycling Instructions]
    G --> J[Display Carbon Footprint, Materials, CE Mark]
    H --> K[Display Standard Specs]
```

### 6.3 India Compliance Setup Flow

```mermaid
flowchart TD
    A[Go to Settings] --> B[India Compliance Tab]
    B --> C[Enter EPR Registration Number]
    C --> D[Enter BIS R-Number]
    D --> E[Enter IEC Code if Importer]
    E --> F[Save Profile]
    F --> G[Compliance Data Shown on Passports]
```

---

## 7. India Compliance

### 7.1 Tenant-Level Fields

| Field | Description | Example |
|-------|-------------|---------|
| EPR Registration Number | CPCB EPR registration | `B-29016/2024-25/CPCB` |
| BIS R-Number | BIS CRS registration (IS 16046) | `R-41001234` |
| IEC Code | Import Export Code (for importers) | `0504012345` |

### 7.2 Batch-Level Fields

| Field | Description | Required |
|-------|-------------|----------|
| Market Region | INDIA / EU / GLOBAL | ✅ |
| PLI Compliant | PLI subsidy eligibility | ❌ |
| Domestic Value Add | % of local value (calculated server-side) | ❌ |
| Cell Source | IMPORTED / DOMESTIC | ❌ |
| HSN Code | Harmonized System code (e.g., `8507.60`) | ✅ (India) |
| Bill of Entry No. | Customs entry number | ✅ (if Imported) |
| Country of Origin | Source country | ✅ (if Imported) |
| Customs Date | Clearance date | ✅ (if Imported) |

### 7.3 Public Passport Display

For India batches, the public passport shows:
- 🇮🇳 PLI Eligible badge
- DVA percentage with progress bar
- Cell Source indicator (Domestic/Imported)
- EPR Registration details
- BIS R-Number
- Import Declaration (for imported cells)
- Recycling Instructions (BWM Rules 2022)

---

## 8. DVA Calculator

### 8.1 Purpose
Help Indian battery manufacturers calculate their Domestic Value Addition (DVA) percentage for PLI scheme compliance.

### 8.2 Formula
```
DVA = ((Sale Price - Imported Cost) / Sale Price) × 100
```

### 8.3 Server-Side Calculation
DVA is now calculated server-side to prevent client tampering. The backend validates:
- `sale_price_inr` and `import_cost_inr` in batch specs
- Automatically computes DVA on batch creation
- Enforces PLI eligibility rules (DVA ≥ 50% required for PLI claim)

### 8.4 HSN Code Validation
For India batches, HSN codes must follow format: `XXXX.XX` or `XXXXXXXX` (e.g., `8507.60`)

### 8.5 PLI Eligibility
- **DVA ≥ 50%**: Eligible for PLI subsidy ✅
- **DVA < 50%**: Not eligible ❌

---

## 9. Quota System & Batch Activation

### 9.1 Overview
Batches have three states: **DRAFT** → **ACTIVE** → **ARCHIVED**

| Status | Description | Downloads |
|--------|-------------|-----------|
| `DRAFT` | Data entry mode, free | 🔒 Locked |
| `ACTIVE` | Activated, consumes quota | ✅ Enabled |
| `ARCHIVED` | No longer in use | ✅ Enabled |

### 9.2 Activation Flow
1. Create batch (starts as DRAFT)
2. Upload CSV with serial numbers
3. Click "Activate Batch"
4. Quota deducted (1 quota per batch)
5. QR codes and labels become downloadable

### 9.3 Quota Balance
Tenants have a `quota_balance` field. Each activation consumes 1 quota unit.
- Initial quota: 5 (free tier)
- Purchase more via billing page

---

## 10. Lifecycle Management

### 10.1 Status States

```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> SHIPPED
    SHIPPED --> IN_SERVICE
    SHIPPED --> RETURN_REQUESTED
    SHIPPED --> RECALLED
    IN_SERVICE --> RETURN_REQUESTED
    IN_SERVICE --> RECALLED
    IN_SERVICE --> RECYCLED
    RETURN_REQUESTED --> RETURNED
    RETURN_REQUESTED --> IN_SERVICE
    RETURNED --> RECYCLED
    RETURNED --> SHIPPED
    RECALLED --> RECYCLED
    RECYCLED --> END_OF_LIFE
    END_OF_LIFE --> [*]
```

### 10.2 Valid Transitions

| From Status | Allowed Transitions |
|-------------|---------------------|
| `CREATED` | SHIPPED |
| `SHIPPED` | IN_SERVICE, RETURN_REQUESTED, RECALLED |
| `IN_SERVICE` | RETURN_REQUESTED, RECALLED, RECYCLED |
| `RETURN_REQUESTED` | RETURNED, IN_SERVICE |
| `RETURNED` | RECYCLED, SHIPPED |
| `RECALLED` | RECYCLED |
| `RECYCLED` | END_OF_LIFE |

### 10.3 Role-Based Permissions

| Role | Allowed Transitions |
|------|---------------------|
| `MANUFACTURER` | CREATED→SHIPPED, RETURNED→RECYCLED/SHIPPED |
| `LOGISTICS` | SHIPPED→IN_SERVICE |
| `TECHNICIAN` | SHIPPED→IN_SERVICE, IN_SERVICE→RETURN_REQUESTED |
| `RECYCLER` | Any→RECYCLED |

### 10.4 Event Logging
Every transition creates an immutable `PassportEvent`:
```go
type PassportEvent struct {
    ID         uuid.UUID
    PassportID uuid.UUID
    EventType  string    // SHIPPED, INSTALLED, RETURN_REQUESTED, etc.
    Actor      string    // Email of person who made change
    Metadata   map[string]interface{}
    CreatedAt  time.Time
}
```

---

## 11. Magic Link Authentication

### 11.1 Purpose
Allow external partners (mechanics, recyclers, logistics) to update battery status without full accounts.

### 11.2 Tiered Verification

```mermaid
flowchart TD
    A[User scans QR] --> B[Clicks Record Event]
    B --> C[Enters email & role]
    C --> D{Email domain known?}
    D -->|Yes| E[Tier A: Auto-approve]
    D -->|No| F{Has partner code?}
    F -->|Yes| G[Tier B: Code-approve]
    F -->|No| H[Rejected - Request code]
    E --> I[Magic link sent]
    G --> I
    I --> J[User clicks link]
    J --> K[Action page with token]
    K --> L[Select new status]
    L --> M[Confirm transition]
    M --> N[🎉 Confetti + Points!]
```

### 11.3 Trusted Domains (Tier A)
Pre-registered email domains that auto-approve:
```json
{
  "domain": "tatamotors.com",
  "role": "TECHNICIAN",
  "description": "Tata Motors Fleet"
}
```

### 11.4 Partner Codes (Tier B)
One-time or limited-use codes for unknown emails:
```json
{
  "code": "INSTALL-2026",
  "role": "TECHNICIAN",
  "max_uses": 100,
  "expires_at": "2026-12-31"
}
```

### 11.5 Public Action Page
**Route:** `/p/[uuid]/action?token=...`

Features:
- Shows allowed transitions based on current status
- Partner code input for unverified users
- Metadata fields (VIN, tracking number, reason)
- Confetti celebration on success 🎉
- Points display for gamification

---

## 12. Rewards & Gamification

### 12.1 Purpose
Incentivize mechanics and partners to update battery lifecycle data.

### 12.2 Points System

| Action | Points |
|--------|--------|
| Install battery (`IN_SERVICE`) | +50 |
| Return request (`RETURN_REQUESTED`) | +20 |
| Recycle battery (`RECYCLED`) | +100 |

### 12.3 Loyalty Levels

| Level | Points Required |
|-------|-----------------|
| Level 1 - Starter | 0 |
| Level 2 - Intermediate | 50 |
| Level 3 - Advanced | 200 |
| Level 4 - Senior | 500 |
| Level 5 - Expert | 1000 |

### 12.4 Leaderboard
Dashboard shows top contributors by company with:
- Total points
- Install/Recycle/Return counts
- Loyalty level badge

---

## 13. Public Battery Passport

### 13.1 Dynamic Market-Based Rendering

**File:** `frontend/components/passport/passport-view.tsx`

The passport view dynamically renders based on market region:

#### India View (🇮🇳)
- Battery Aadhaar Number (BPAN)
- DVA Progress Bar
- Cell Source indicator
- EPR Registration display
- BIS R-Number
- Import Declaration (if imported)
- Recycling Instructions (BWM Rules 2022)

#### EU View (🇪🇺)
- Passport Serial Number
- Carbon Footprint with certification
- Material Composition chips (Cobalt, Lithium, Nickel, Lead)
- Recyclability indicator
- CE Mark

#### Global View
- Standard specifications
- Sustainability data

### 13.2 UI Components

| Component | Purpose |
|-----------|---------|
| `GlowCard` | Animated gradient border wrapper |
| `StatusBadge` | ACTIVE/RECALLED/RECYCLED status |
| `MarketBadge` | 🇮🇳 PLI / 🇪🇺 EU Compliant |
| `VerifiedBadge` | Authenticity verification |
| `SpecCard` | Technical specification display |
| `GlowProgress` | Animated progress bar |
| `TimelineEvent` | Lifecycle milestone |
| `MaterialChip` | Material composition display |
| `CEMark` | EU CE marking SVG |
| `BISMark` | India BIS marking |

---

## 14. Developer API & API Keys

### 14.1 Overview
Tenants can create API keys for programmatic access to their data.

### 14.2 Key Features
- Multiple keys per tenant
- Key prefix visible (`sk_...`), secret shown once
- Revocation support
- Usage tracking

### 14.3 API Key Authentication
```http
Authorization: Bearer sk_live_xxxxxxxxxxxx
```

### 14.4 Developer Page
**Route:** `/developer`

Features:
- Create new API keys with description
- View key list with creation dates
- Copy key to clipboard
- Revoke keys
- API documentation links

---

## 15. Dashboard Components

### 15.1 Component List

| Component | File | Purpose |
|-----------|------|---------|
| StatsCard | `StatsCard.tsx` | Summary metrics |
| RecentBatchesTable | `RecentBatchesTable.tsx` | Latest batches with progress |
| ProductionChart | `ProductionChart.tsx` | Production trends (Recharts) |
| BatchStatusChart | `BatchStatusChart.tsx` | Status distribution |
| QuotaCard | `QuotaCard.tsx` | Usage tracking |
| ActivityFeed | `ActivityFeed.tsx` | Real-time activity log |
| Sidebar | `sidebar.tsx` | Navigation menu |
| Header | `header.tsx` | Top bar with user menu |
| TopNav | `TopNav.tsx` | Navigation tabs |

### 15.2 Dashboard Stats

```go
type DashboardStats struct {
    TotalPassports       int
    TotalBatches         int
    QuotaUsed            int
    QuotaLimit           int
    CarbonCompliancePct  float64
    PassportsThisWeek    int
    PendingExportBatches int
}
```

---

## 16. Backend Services

### 16.1 Service Overview

| Service | File | Purpose |
|---------|------|---------|
| Auth Service | `auth_service.go` | JWT tokens, password hashing |
| CSV Service | `csv_service.go` | Stream processing, validation |
| QR Service | `qr_service.go` | QR generation, ZIP archives |
| PDF Service | `pdf_service.go` | PDF label generation |
| Geo Service | `geo_service.go` | IP geolocation for scans |

### 16.2 Key Features

**QR Service:**
- 256x256 PNG QR codes
- Parallel generation (20 workers)
- ZIP archive creation
- URL: `{BASE_URL}/p/{passport-uuid}`

**CSV Service:**
- Stream processing for large files
- Worker pool validation (10 workers)
- BOM detection and removal
- Multi-format dates (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)

**Auth Service:**
- JWT access tokens (15 min expiry)
- Refresh tokens (7 days)
- bcrypt password hashing

---

## 17. Environment Variables

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

---

## 18. Commands Reference

### Backend
```bash
make run              # Start backend server
make build            # Build binary
make test             # Run tests
make migrate-up       # Run migrations
make migrate-down     # Rollback migration
```

### Frontend
```bash
npm install           # Install dependencies
npm run dev           # Dev server (port 3000)
npm run build         # Production build
npm run start         # Production server
```

---

*Document generated: January 25, 2026*
*Version: 3.0*

