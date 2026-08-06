# ADR 017: Password policy on register/reset (S-13)

## Status
Accepted — 2026-08-05

## Context
Register and reset only required `len(password) >= 8`. Weak secrets (`password123`, digit-only strings) were accepted. Frontend checklist already hinted at stronger rules but did not match the server.

## Decision
1. Shared server validator `services.ValidatePassword(password, email)`:
   - minimum **12** characters (rune count)
   - at least one **letter** and one **digit**
   - offline **common-password blocklist**
   - reject password equal to email or email local-part when email is known
2. Apply on manufacturer **register**, **reset-password**, and **supplier accept**.
3. Client mirror in `apps/battery-web/lib/password-policy.ts` for register/reset/supplier UI.
4. No HaveIBeenPwned / captcha in v1 (optional later).

## Consequences
- Existing accounts with weak passwords are unchanged until they reset.
- Error messages are explicit so the UI can surface them from API responses.
