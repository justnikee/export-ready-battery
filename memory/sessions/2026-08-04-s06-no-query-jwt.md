# Session: 2026-08-04 — S-06 no session JWT in query

**Date:** 2026-08-04  
**User goal:** Stop accepting session JWT from `?token=` (S-06).

## What we did

### Backend
- `Protect`: removed query-string JWT; order is Bearer → supplier_token cookie → auth_token cookie
- Rewards: query `?token=` only validates as magic-link token, not session JWT
- OAuth redirect: no access token in callback URL; cookies only

### Frontend
- Export download: authenticated refresh → signed URL; no `?token=` JWT
- OAuth callback: `refreshAccessToken()` from HttpOnly cookie; no JS `document.cookie` for auth

### Left intentional (not session JWT)
- Magic-link action URLs, verify-email, invites, supplier accept — one-time tokens with dedicated handlers

### Tests
- Reject query JWT; accept Bearer; accept auth_token cookie

## Next
- **S-07** tenant-scope MarkAlertRead
