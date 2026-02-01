# Technical Debt & Pending Remediation

This document tracks technical debt and infrastructure tasks that need to be addressed to improve code quality, maintainability, and developer experience.

## 🔴 High Priority

### 1. Backend Testing Strategy
**Current Status:** 0% Coverage. No unit or integration tests exist for the Go backend.
**Action Items:**
- [ ] **Infrastructure**: Add `test` target to Makefile.
- [ ] **Unit Tests**: Create `internal/handlers/auth_handlers_test.go` as a baseline.
- [ ] **Integration Tests**: Create a mock Razorpay client to verify `verify-payment` webhook logic without external dependencies.

### 2. API Documentation
**Current Status:** No formal API documentation exists. Frontend developers rely on reading Go code.
**Action Items:**
- [ ] **OpenAPI Spec**: Generate `openapi.yaml` for core entities (Auth, Batches, Passports).
- [ ] **Swagger UI**: Mount Swagger UI middleware at `/server/docs` or `/swagger`.

## 🟡 Medium Priority

### 3. Email Service Refactoring
**Current Status:** Email HTML is hardcoded in strings within `internal/services/email.go`.
**Action Items:**
- [ ] **Templates**: Move HTML content to `internal/templates/*.html`.
- [ ] **Rendering**: Refactor `EmailService` to use Go's `html/template` package for dynamic rendering.

## 🟢 Low Priority

### 4. Logging
**Current Status:** Using standard `log.Printf`.
**Action Items:**
- [ ] Migrate to structured logging using `log/slog` (Go 1.21+).


Here is your revised Immediate Roadmap (The "Safety First" Sprint):

Billing Integrity: Implement real Razorpay Webhooks. (2 Days)

Audit Defense: Add the Hash column to PassportEvents. (1 Day)

Safety Net: Write 3 core Integration Tests (Batch Creation, Status Change, Quota Deduction). (2 Days)

Security Patch: Fix the String Interpolation in emails. (2 Hours)

Ignore (For Now): SSO, Redis, Blockchain, RabbitMQ.

Final Thought: This critique is a gift. It tells you exactly where the "landmines" are. Fix the landmines (Billing/Tests), ignore the noise (Blockchain/SSO), and ship.
