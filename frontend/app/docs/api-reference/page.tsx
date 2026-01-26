'use client';

import { motion } from 'framer-motion';
import { CodeBlock, MethodBadge, ApiEndpoint } from '@/components/docs';
import {
    Shield,
    FileText,
    Zap,
    CreditCard,
    BarChart3,
    Code2,
    Lock
} from 'lucide-react';

// Section Header
function SectionHeader({
    id,
    icon,
    title,
    description
}: {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div id={id} className="scroll-mt-20 pt-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}

export default function ApiReferencePage() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <section>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                      bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm mb-4">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>API v1</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    API Reference
                </h1>

                <p className="text-lg text-gray-400 max-w-2xl">
                    Complete reference for all ExportReady-Battery API endpoints.
                    All endpoints use JSON for request and response bodies.
                </p>
            </section>

            {/* Base URL */}
            <section className="p-6 rounded-2xl border border-white/10 bg-white/5">
                <h3 className="text-lg font-semibold text-white mb-3">Base URL</h3>
                <CodeBlock
                    code={`https://api.exportready.com/api/v1`}
                    language="text"
                />
                <p className="mt-3 text-sm text-gray-400">
                    All endpoints are relative to this base URL. For local development, use{' '}
                    <code className="text-indigo-400">http://localhost:8080/api/v1</code>
                </p>
            </section>

            {/* Authentication Header */}
            <section className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
                <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Authentication</h3>
                </div>
                <p className="text-gray-300 mb-4">
                    Protected endpoints require a Bearer token in the Authorization header:
                </p>
                <CodeBlock
                    code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                    language="text"
                />
                <p className="mt-3 text-sm text-gray-400">
                    Access tokens expire after 15 minutes. Use the refresh token to obtain a new access token.
                </p>
            </section>

            {/* ============= AUTHENTICATION ============= */}
            <section>
                <SectionHeader
                    id="authentication"
                    icon={<Shield className="w-6 h-6 text-violet-400" />}
                    title="Authentication"
                    description="User registration, login, and password management endpoints."
                />

                <div className="space-y-6 mt-6">
                    <ApiEndpoint
                        method="POST"
                        path="/auth/register"
                        description="Register a new tenant/company account."
                        requestBody={`{
  "company_name": "Acme Batteries",
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}`}
                        responseBody={`{
  "message": "Registration successful",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000"
}`}
                    />

                    <ApiEndpoint
                        method="POST"
                        path="/auth/login"
                        description="Authenticate and receive access & refresh tokens."
                        requestBody={`{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}`}
                        responseBody={`{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "refresh_token": "eyJhbGciOiJIUzI1NiI...",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@acme.com",
  "company_name": "Acme Batteries",
  "expires_in": 900
}`}
                    />

                    <ApiEndpoint
                        method="POST"
                        path="/auth/refresh"
                        description="Exchange a refresh token for a new access token."
                        requestBody={`{
  "refresh_token": "eyJhbGciOiJIUzI1NiI..."
}`}
                        responseBody={`{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "expires_in": 900
}`}
                    />

                    <ApiEndpoint
                        method="POST"
                        path="/auth/forgot-password"
                        description="Initiate password reset by sending a reset email."
                        requestBody={`{
  "email": "admin@acme.com"
}`}
                        responseBody={`{
  "message": "Password reset email sent"
}`}
                    />

                    <ApiEndpoint
                        method="POST"
                        path="/auth/reset-password"
                        description="Complete password reset with token from email."
                        requestBody={`{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass456!"
}`}
                        responseBody={`{
  "message": "Password reset successful"
}`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/auth/me"
                        description="Get the current authenticated user's profile."
                        auth
                        responseBody={`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "company_name": "Acme Batteries",
  "email": "admin@acme.com",
  "address": "Industrial Area, Delhi",
  "epr_registration_number": "B-29016/2024-25/CPCB",
  "bis_r_number": "R-41001234",
  "created_at": "2026-01-15T10:00:00Z"
}`}
                    />

                    <ApiEndpoint
                        method="PUT"
                        path="/auth/profile"
                        description="Update the current user's profile and compliance fields."
                        auth
                        requestBody={`{
  "company_name": "Acme Batteries Inc.",
  "address": "Updated Address, Mumbai",
  "support_email": "support@acme.com",
  "website": "https://acme.com",
  "epr_registration_number": "B-29016/2024-25/CPCB",
  "bis_r_number": "R-41001234",
  "iec_code": "0504012345"
}`}
                        responseBody={`{
  "message": "Profile updated successfully"
}`}
                    />
                </div>
            </section>

            {/* ============= BATCHES ============= */}
            <section>
                <SectionHeader
                    id="batches"
                    icon={<FileText className="w-6 h-6 text-emerald-400" />}
                    title="Batches"
                    description="Create, manage, and export battery batches."
                />

                <div className="space-y-6 mt-6">
                    <ApiEndpoint
                        method="POST"
                        path="/batches"
                        description="Create a new battery batch with specifications."
                        auth
                        requestBody={`{
  "batch_name": "Q1-2026-Production",
  "market_region": "INDIA",
  "specs": {
    "chemistry": "Li-ion NMC",
    "voltage": "48V",
    "capacity": "100Ah",
    "manufacturer": "Acme Batteries",
    "weight": "45kg",
    "country_of_origin": "India"
  },
  "pli_compliant": true,
  "domestic_value_add": 65.5,
  "cell_source": "DOMESTIC"
}`}
                        responseBody={`{
  "id": "batch-uuid-here",
  "batch_name": "Q1-2026-Production",
  "created_at": "2026-01-15T10:00:00Z"
}`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/batches"
                        description="List all batches for the authenticated tenant with pagination."
                        auth
                        responseBody={`{
  "batches": [
    {
      "id": "batch-uuid-1",
      "batch_name": "Q1-2026-Production",
      "total_passports": 500,
      "market_region": "INDIA",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "per_page": 20
}`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/batches/{id}"
                        description="Get detailed information about a specific batch."
                        auth
                        responseBody={`{
  "id": "batch-uuid-here",
  "batch_name": "Q1-2026-Production",
  "market_region": "INDIA",
  "specs": { ... },
  "pli_compliant": true,
  "domestic_value_add": 65.5,
  "total_passports": 500,
  "created_at": "2026-01-15T10:00:00Z"
}`}
                    />

                    <ApiEndpoint
                        method="POST"
                        path="/batches/{id}/upload"
                        description="Upload a CSV file with serial numbers to generate passports."
                        auth
                        requestBody={`Content-Type: multipart/form-data

file: [CSV file with serial_number,manufacture_date columns]`}
                        responseBody={`{
  "message": "Successfully created 500 passports",
  "created": 500,
  "errors": []
}`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/batches/{id}/download"
                        description="Download all QR codes for the batch as a ZIP file."
                        auth
                        responseBody={`Content-Type: application/zip
Content-Disposition: attachment; filename="batch-qrcodes.zip"

[Binary ZIP file containing PNG QR codes]`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/batches/{id}/export"
                        description="Export all passports in the batch to a CSV file."
                        auth
                        responseBody={`Content-Type: text/csv

uuid,serial_number,manufacture_date,status,qr_url
uuid-1,BAT-001,2026-01-15,ACTIVE,https://example.com/p/uuid-1`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/batches/{id}/passports"
                        description="List all passports in a batch with pagination."
                        auth
                        responseBody={`{
  "passports": [
    {
      "uuid": "passport-uuid",
      "serial_number": "BAT-001",
      "manufacture_date": "2026-01-15",
      "status": "ACTIVE"
    }
  ],
  "total": 500,
  "page": 1
}`}
                    />
                </div>
            </section>

            {/* ============= PASSPORTS ============= */}
            <section>
                <SectionHeader
                    id="passports"
                    icon={<Zap className="w-6 h-6 text-amber-400" />}
                    title="Passports"
                    description="Public passport data and scan tracking."
                />

                <div className="space-y-6 mt-6">
                    <ApiEndpoint
                        method="GET"
                        path="/passport/{uuid}"
                        description="Get public passport data. No authentication required."
                        responseBody={`{
  "uuid": "passport-uuid",
  "serial_number": "BAT-2026-001",
  "manufacture_date": "2026-01-15",
  "status": "ACTIVE",
  "batch": {
    "batch_name": "Q1-2026-Production",
    "market_region": "INDIA",
    "specs": { ... },
    "pli_compliant": true,
    "domestic_value_add": 65.5
  },
  "tenant": {
    "company_name": "Acme Batteries",
    "address": "Industrial Area, Delhi",
    "epr_registration_number": "B-29016/2024-25/CPCB"
  }
}`}
                    />

                    <ApiEndpoint
                        method="POST"
                        path="/scan"
                        description="Record a scan event for a passport. Called automatically when QR is scanned."
                        requestBody={`{
  "passport_id": "passport-uuid"
}`}
                        responseBody={`{
  "message": "Scan recorded"
}`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/scan/feed"
                        description="Get real-time scan feed for the authenticated tenant."
                        auth
                        responseBody={`{
  "scans": [
    {
      "id": "scan-uuid",
      "passport_id": "passport-uuid",
      "serial_number": "BAT-001",
      "city": "Mumbai",
      "country": "India",
      "device_type": "Mobile",
      "scanned_at": "2026-01-15T14:30:00Z"
    }
  ]
}`}
                    />
                </div>
            </section>

            {/* ============= BILLING ============= */}
            <section>
                <SectionHeader
                    id="billing"
                    icon={<CreditCard className="w-6 h-6 text-pink-400" />}
                    title="Billing"
                    description="Quota management and Razorpay payment integration."
                />

                <div className="space-y-6 mt-6">
                    <ApiEndpoint
                        method="GET"
                        path="/billing/packages"
                        description="Get available quota packages for purchase."
                        responseBody={`{
  "packages": [
    {
      "id": "starter",
      "name": "Starter",
      "quota": 100,
      "price": 999,
      "currency": "INR"
    },
    {
      "id": "professional",
      "name": "Professional",
      "quota": 500,
      "price": 3999,
      "currency": "INR"
    }
  ]
}`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/billing/quota"
                        description="Get current quota balance for the authenticated tenant."
                        auth
                        responseBody={`{
  "quota_balance": 450,
  "quota_used": 50,
  "quota_limit": 500
}`}
                    />

                    <ApiEndpoint
                        method="POST"
                        path="/billing/razorpay/order"
                        description="Create a Razorpay order for quota purchase."
                        auth
                        requestBody={`{
  "package_id": "professional"
}`}
                        responseBody={`{
  "order_id": "order_xyz123",
  "amount": 399900,
  "currency": "INR",
  "key_id": "rzp_test_xxx"
}`}
                    />

                    <ApiEndpoint
                        method="POST"
                        path="/billing/razorpay/verify"
                        description="Verify Razorpay payment and add quota."
                        auth
                        requestBody={`{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_here"
}`}
                        responseBody={`{
  "message": "Payment verified, quota added",
  "new_balance": 950
}`}
                    />
                </div>
            </section>

            {/* ============= DASHBOARD ============= */}
            <section>
                <SectionHeader
                    id="dashboard"
                    icon={<BarChart3 className="w-6 h-6 text-cyan-400" />}
                    title="Dashboard"
                    description="Statistics and analytics endpoints."
                />

                <div className="space-y-6 mt-6">
                    <ApiEndpoint
                        method="GET"
                        path="/dashboard/stats"
                        description="Get dashboard statistics for the authenticated tenant."
                        auth
                        responseBody={`{
  "total_passports": 2500,
  "total_batches": 15,
  "quota_used": 2500,
  "quota_limit": 5000,
  "passports_this_week": 340,
  "pending_export_batches": 2,
  "carbon_compliance_pct": 85.5
}`}
                    />

                    <ApiEndpoint
                        method="GET"
                        path="/dashboard/recent-batches"
                        description="Get the most recent batches for quick access."
                        auth
                        responseBody={`{
  "batches": [
    {
      "id": "batch-uuid",
      "batch_name": "Q1-2026-Production",
      "total_passports": 500,
      "status": "ACTIVE",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}`}
                    />
                </div>
            </section>

            {/* Error Responses */}
            <section className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10">
                <h2 className="text-xl font-bold text-white mb-4">Error Responses</h2>
                <p className="text-gray-300 mb-4">
                    All error responses follow a consistent format:
                </p>
                <CodeBlock
                    code={`{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}`}
                    language="json"
                />
                <div className="mt-4 space-y-2 text-sm">
                    <div className="flex gap-4">
                        <span className="text-red-400 font-mono w-12">400</span>
                        <span className="text-gray-400">Bad Request - Invalid input data</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-red-400 font-mono w-12">401</span>
                        <span className="text-gray-400">Unauthorized - Missing or invalid token</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-red-400 font-mono w-12">403</span>
                        <span className="text-gray-400">Forbidden - Insufficient permissions</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-red-400 font-mono w-12">404</span>
                        <span className="text-gray-400">Not Found - Resource does not exist</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-red-400 font-mono w-12">500</span>
                        <span className="text-gray-400">Internal Server Error</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
