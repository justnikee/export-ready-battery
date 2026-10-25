# Session: 2026-10-25 — billing credit and payment fix

**Goal:** Make paid passport credits usable after plan expiry and make Razorpay fulfillment safe.

## Changes

- Core writes and renewal routes no longer use expiry as a blanket gate; plan-only features still check expiry.
- `/auth/me` and billing UI show plan status/term separately from remaining credits.
- Callback and webhook fetch captured Razorpay payment and original order; shared repository transaction applies each payment once.
- Added provider binding tests, webhook test, and disposable PostgreSQL concurrency/rollback/early-renewal test.
- Updated proxy tests to use Vitest environment stubs because baseline assignment to `NODE_ENV` fails TypeScript's readonly typing.

## Verification

- Isolated branch: battery-api `go test ./...` and `go vet ./...` pass; battery-web Vitest and TypeScript pass.
- No live provider checkout or logged-in UI test. No production tenant/payment data changed.

## Decision

[ADR 032](../decisions/032-credits-plan-term-and-payment-fulfillment.md).

## Follow-up

Run Razorpay sandbox checkout, callback and webhook replay, then manually verify billing and expired-plan UI before production rollout.

## Graphify

Unavailable in this environment; regenerate when available.
