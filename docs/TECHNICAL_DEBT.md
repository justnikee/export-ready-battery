# Technical Debt and Pending Remediation

This document tracks technical debt and infrastructure tasks needed to improve code quality, maintainability, and developer experience.

## High Priority

### 1. Backend Testing Strategy
**Current Status:** Partial coverage. Lifecycle handlers/services and magic-link flows have tests, but auth/billing and integration coverage are still thin.
**Action Items:**
- Add baseline auth handler tests (e.g. `internal/handlers/auth_handlers_test.go`).
- Add end-to-end integration tests for batch creation, lifecycle transition, and quota deduction.
- Mock Razorpay client for webhook verification without external dependencies.

### 2. API Documentation
**Current Status:** OpenAPI spec exists at `backend/api/openapi.yaml` but is not wired to a UI.
**Action Items:**
- Mount Swagger UI at `/server/docs` or `/swagger`.
- Review coverage for lifecycle, evidence, and magic-link endpoints.

## Medium Priority

### 3. Email Service Refactoring
**Current Status:** Email HTML is hardcoded in strings within `internal/services/email.go`.
**Action Items:**
- Move HTML content to `internal/templates/*.html`.
- Refactor `EmailService` to use Go `html/template`.

## Low Priority

### 4. Logging
**Current Status:** Standard `log.Printf`.
**Action Items:**
- Migrate to structured logging using `log/slog` (Go 1.21+).

## Immediate Roadmap (Safety First Sprint)

- Billing Integrity: Implement real Razorpay webhooks. (2 days)
- Audit Defense: Passport event hash chain is implemented; expand verification coverage. (1 day)
- Safety Net: Add 3 core integration tests (batch creation, lifecycle transition, quota deduction). (2 days)
- Security Patch: Fix string interpolation in emails. (2 hours)
- Ignore (for now): SSO, Redis, Blockchain, RabbitMQ.

