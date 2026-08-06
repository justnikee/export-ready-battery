# ADR 018: No email-enumeration oracle on register (S-14)

## Status
Accepted — 2026-08-05

## Context
`POST /auth/register` returned `409 Email already registered` when the email existed, allowing account discovery for phishing.

Forgot-password already used a generic response; register did not.

## Decision
1. **Self-signup:** If email exists (or unique-violation race), return **202** with the **same message** as a new registration (“check your email…”). Do **not** return 409.
2. **Out-of-band notice:** Send `SendAccountExistsEmail` to the real owner (login + forgot-password links). Account is not modified.
3. **Timing:** Hash the submitted password before the existence check so taken/new paths both pay bcrypt cost.
4. **Invite flow:** Existing user + valid invite → activate membership, return same success as new invite register. Invalid invite → `400 Invalid or expired invitation` (token gate, not email oracle).

## Consequences
- Attackers cannot distinguish new vs existing emails from HTTP status/body alone.
- Legitimate re-registers see “check your email” but receive the account-exists notice instead of a verification link.
- Frontend needs no change if it already treats 202 as success + check-email UI.
