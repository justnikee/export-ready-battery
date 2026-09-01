# ADR 029: No tenant JWT quota mint

- **Status**: Accepted
- **Date**: 2026-08-22

## Context

`POST /api/v1/billing/top-up` (`TopUpQuota`) was a mock that credited `amount` quota units from a tenant JWT (`protectWriteOnboard`). No Razorpay order, payment id, or webhook. Any onboarded OWNER/ADMIN/MEMBER could mint unlimited passport credits.

Paid credits already exist: `POST /billing/razorpay/verify` and the Razorpay webhook.

## Decision

Delete the mock route and handler. Quota is minted only after a verified Razorpay payment (verify handler or webhook). Refunds of a failed activation/upload may still call `AddQuota` to put back what was deducted.

Do not reintroduce a free-mint path on tenant JWT. If ops needs to gift credits for a concierge pilot, that is a new platform-admin endpoint (`X-Admin-API-Key` + `tenant_id` in the body) — not this route.

## Consequences

- Tenant curl of `/billing/top-up` is 404.
- Billing UI is unchanged (it never called this route).
- Manual quota for demos must go through Razorpay or a future admin-key tool.
