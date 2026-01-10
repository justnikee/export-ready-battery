# ExportReady-Battery Backend 🔋

> A robust, scalable backend for the Digital Battery Passport system, built with Go.

## 📖 Overview

**ExportReady-Battery** is the backend infrastructure powering a Digital Battery Passport solution. It enables manufacturers to generate, manage, and track unique battery passports, ensuring compliance with global regulations. The system handles secure batch management, high-volume CSV data ingestion, and bulk QR code generation.

## ✨ Key Features

-   **🔐 Secure Authentication**: JWT-based auth with access/refresh tokens and protected API endpoints.
-   **📦 Batch Management**: Organize passports into production batches with shared specifications.
-   **🚀 High-Performance Data Ingestion**:
    -   Stream processing for large CSV uploads.
    -   Parallel validation and database insertion.
-   **⚡ Bulk QR Code Generation**:
    -   Fast, parallelized QR code generation.
    -   Automatic ZIP archiving for easy download.
-   **📱 Public Verification**: Publicly accessible endpoints for consumers to scan and view passport data.
-   **🛡️ Robust Architecture**: Built with Go standard library and `pgx` for optimal PostgreSQL performance.

## 🛠️ Tech Stack

-   **Language**: Go 1.22+
-   **Database**: PostgreSQL (Supabase)
-   **Driver**: `pgx/v5` (High-performance connection pooling)
-   **Router**: Go Standard Library `http.ServeMux` (No external router deps)
-   **Auth**: `golang-jwt/jwt/v5` & `bcrypt`

## 🚀 Getting Started

### Prerequisites

-   Go 1.22 or higher
-   PostgreSQL database (or Supabase project)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/exportready-battery.git
    cd exportready-battery
    ```

2.  **Environment Setup:**
    Copy `.env.example` to `.env` and fill in your credentials.
    ```bash
    cp .env.example .env
    ```
    *Make sure to set a strong `JWT_SECRET`!*

3.  **Run Migrations:**
    Initialize the database schema.
    ```bash
    # Windows
    .\scripts\migrate.ps1 up
    
    # Linux/Mac
    make migrate-up
    ```

4.  **Start the Server:**
    ```bash
    go run ./cmd/server
    ```
    The server will start on `http://localhost:8080`.

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new tenant company | Public |
| `POST` | `/api/v1/auth/login` | Login and receive JWT | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Public |
| `GET` | `/api/v1/auth/me` | Get current tenant info | **Protected** |

### Batches & Passports
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/batches` | List all batches | **Protected** |
| `POST` | `/api/v1/batches` | Create a new batch | **Protected** |
| `GET` | `/api/v1/batches/{id}` | Get batch details | **Protected** |
| `POST` | `/api/v1/batches/{id}/upload` | Upload CSV for batch | **Protected** |
| `GET` | `/api/v1/batches/{id}/download`| Download QR Code ZIP | **Protected** |
| `GET` | `/api/v1/passports/{uuid}` | Public passport view | Public |

## 📂 Project Structure

```
exportready-battery/
├── cmd/server/          # Main entry point
├── internal/
│   ├── config/          # Configuration loader
│   ├── db/              # Database connection
│   ├── handlers/        # HTTP Handlers (API Logic)
│   │   ├── auth.go
│   │   ├── batch.go
│   │   └── ...
│   ├── middleware/      # Auth & Logging Middleware
│   ├── models/          # Data Structures
│   ├── repository/      # Database Operations
│   └── services/        # Business Logic (CSV, QR, Auth)
├── migrations/          # SQL Migration files
└── scripts/             # Utility scripts
```

## 🧪 Testing

Run the full test suite:
```bash
go test ./...
```
