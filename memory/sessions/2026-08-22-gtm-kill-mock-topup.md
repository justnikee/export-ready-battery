# Session: 2026-08-22 — gtm-kill-mock-topup

**Date:** 2026-08-22
**Agent/tool:** Grok
**User goal:** Remove mock `POST /api/v1/billing/top-up` (tenant JWT minted quota with no payment).

## Context loaded
- [x] CURRENT.md
- [x] rules.md
- [x] PRODUCT_GTM_PLAN.md G2
- [x] prior session (spine PR 4)

## What we did
- Deleted `TopUpQuota` from `billing_handlers.go`.
- Unregistered `POST /api/v1/billing/top-up` in `cmd/server/main.go`.
- Regression test `TestMockTopUpRouteRemoved` so the route cannot be re-wired silently.
- ADR 029: quota mint only via Razorpay verify + webhook.

## Decisions (link ADR if any)
- [ADR 029](../decisions/029-no-mock-quota-topup.md) — kill, not admin-key. User asked to remove it.

## Code / files touched
- `services/battery-api/internal/handlers/billing_handlers.go`
- `services/battery-api/internal/handlers/billing_handlers_test.go`
- `services/battery-api/cmd/server/main.go`
- `memory/decisions/029-no-mock-quota-topup.md`
- `memory/rules.md`, `memory/CURRENT.md`, `memory/PRODUCT_GTM_PLAN.md`

## Tests / verification
- Commands run: `cd services/battery-api && go test ./internal/handlers -run "TestMockTopUpRouteRemoved|TestActivateBatch_"`
- Result: ok

## Backlog updates
- GTM G2 done. Next: G6 nav slim, G1 fake landing stats.

## Open for next session
1. Slim sidebar (hide Fleet / Telemetry / Regulatory / Analytics / Admin).
2. Strip fake landing stats (`10,000+` / `99.8%` / `50+`).
3. Oracle migrations 107/108; 15-account ICP.

## Graphify
- [ ] N/A (route deletion, no new module)
