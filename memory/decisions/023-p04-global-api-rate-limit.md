# ADR 023: Global + per-tenant API rate limiting (P-04)

## Status
Accepted — 2026-08-05

## Context
`apiRateLimiter` only wrapped public passport/scan routes. Authenticated JWT users and other `/api/v1` traffic had no global throttle (AI had a separate strict tenant limiter; API keys had their own tiers). A single tenant could flood label PDF, analytics, and compliance report endpoints.

## Decision
1. **Per-tenant JWT limiter** (`NewTenantAPIRateLimiter`, ~300 req/min, burst 100) applied **inside** `Auth.Protect` after successful token validation — covers every `Protect()` route without rewiring each registration.
2. **Coarse per-IP limiter** (`NewGlobalAPIRateLimiter`, ~600 req/min, burst 150) via `LimitAPIPaths` on the outer handler chain for all `/api/*` and `/docs`, **skipping** `/health` and `/api/v1/health`.
3. Keep **stricter** auth (~5/min) and **AI** (~10/min) limiters as specialized layers.
4. Public passport/scan remain on the existing ~100/min IP limiter (plus the global IP layer).

## Consequences
- Legitimate multi-tab dashboards should fit under 300/min/tenant; AI still tighter.
- Health checks never 429.
- API-key traffic is limited by existing per-key counters + global IP layer (not the JWT tenant limiter).
