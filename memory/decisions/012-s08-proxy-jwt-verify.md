# ADR 012: Edge proxy verifies JWT, not cookie presence (S-08)

## Status
Accepted — 2026-08-04

## Context
`apps/battery-web/proxy.ts` gated `/dashboard` and `/onboarding` on mere presence of the `auth_token` cookie. A forged value (`auth_token=garbage`) allowed the app shell HTML to load (API still 401’d). Verification helpers already existed for product claims but were not used for access control.

## Decision
1. `verifyAuthToken` checks HS256 signature + `exp` via Web Crypto (same secret as API: `JWT_SECRET`).
2. Protected routes (`/dashboard`, `/onboarding`, `/admin`) require a **valid** token, not a non-empty cookie.
3. Auth pages redirect to dashboard only when the token is valid (forged cookie does not bounce).
4. Invalid/expired cookies are cleared on redirect to login.
5. Dev without `JWT_SECRET`: presence-only fallback + warn (production requires secret).

## Consequences
- Forged cookies no longer unlock the dashboard shell.
- Expired access cookies send users to login; client `checkAuth` / refresh can still recover via HttpOnly refresh cookie on the login page load.
- Unit tests in `proxy.test.ts` cover valid/invalid/expired/forged cases.
