# ADR 010: No session JWT in query strings (S-06)

## Status
Accepted — 2026-08-04

## Context
`middleware.Auth.Protect` accepted `?token=<JWT>`, and export downloads / OAuth callbacks put access tokens in URLs. Query tokens leak via access logs, `Referer`, browser history, and shared links.

## Decision
1. **Protect** accepts only: `Authorization: Bearer`, then `supplier_token` cookie, then `auth_token` cookie — **never** `?token=`.
2. **Export downloads** obtain a short-lived signed storage URL via authenticated `POST /export-jobs/{id}/refresh` (or existing `download_url`); no JWT in the browser navigation URL.
3. **OAuth callback** sets HttpOnly cookies on the API response and redirects with non-secret query params only (`oauth=1`, tenant/email metadata). Frontend rehydrates via `POST /auth/refresh`.
4. **One-time email tokens** (magic link, verify-email, invites, supplier accept) remain in URLs — they are not session JWTs and have dedicated validators.

## Consequences
- Session credentials no longer appear in URL-shaped telemetry.
- Magic-link / email deep links keep working.
- OAuth relies on cookie + refresh (same as password login rehydration).
