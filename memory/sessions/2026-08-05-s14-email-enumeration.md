# Session: 2026-08-05 — S-14 register email enumeration

**Date:** 2026-08-05  
**User goal:** Continue security sprint — S-14.

## What we did

### Backend
- Register no longer returns `409 Email already registered`
- Existing email → 202 + same success message; `SendAccountExistsEmail` to owner
- Password hashed before existence check (timing)
- Unique-violation races handled as existing-email path
- Invite + existing user → activate membership without oracle

### Tests
- `register_enumeration_test.go` — unique violation helper + no-409 self-signup path

## Next
- **S-15** CSP `unsafe-inline` on battery-web
