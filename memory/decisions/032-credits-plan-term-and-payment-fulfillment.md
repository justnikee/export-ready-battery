# ADR 032: Passport credits survive plan expiry; fulfill captured payments once

- **Status:** Accepted for local implementation; provider sandbox and live UI verification pending
- **Date:** 2026-10-25

## Context

The product sells one-time 30/365-day plan access with upfront passport credits. It does not auto-renew. Expiry blocked batch work and even the renewal endpoints while unused credits remained. Browser verification trusted a client-supplied SKU; verify and webhook could each grant the same payment before writing an idempotency ledger row.

## Decision

Passport credits remain usable until consumed, regardless of plan term. Expiry still gates Growth/Enterprise-only features. A customer can purchase and verify a new term after expiry. The billing page presents plan term and credit balance separately. Early renewal of the same plan extends its existing expiry; changing tiers begins a new term from purchase.

Both Razorpay callback and webhook fetch the captured payment and original order. Tenant, SKU, exact amount, and INR currency must match the provider records and the package catalog. A single repository transaction records `payment_id` and grants credits/seats/plan under a tenant row lock. The unique payment index from migration 000093 makes retries and competing delivery paths idempotent. Failure rolls back the full grant.

## Consequences

Expired tenants can keep using paid passport credits for core batch operations and can renew. Existing issued passports stay accessible. The current model remains manually renewed, not recurring billing. Provider sandbox checkout, webhook replay, and a live billing UI pass are required before accepting self-service payments in production.
