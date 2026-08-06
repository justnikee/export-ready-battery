# Session: 2026-08-05 — S-13 password policy

**Date:** 2026-08-05  
**User goal:** Implement S-13 password policy (v1).

## What we did

### Backend
- `services/password_policy.go` — ValidatePassword (12+, letter, digit, blocklist, email match)
- Wired: Register, ResetPassword (with email after token lookup), supplier AcceptInvitation
- Tests in `password_policy_test.go`

### Frontend
- `lib/password-policy.ts` + vitest
- register-form, reset-password-form, supplier accept page

## Next
- **S-14** email enumeration on register (or next open item)
