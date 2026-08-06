# ADR 009: Supplier portal HttpOnly session (S-05)

## Status
Accepted — 2026-08-04

## Context
Supplier portal stored JWT + ids in `localStorage`, so any XSS could steal long-lived API access. Manufacturer auth already used in-memory access token + HttpOnly cookies.

## Decision
1. On `POST /supplier/login`, set **HttpOnly** cookie `supplier_token` (Path=/, Secure in production, SameSite Strict/Lax).
2. Still return `token` once in the JSON body for in-memory use on the client.
3. Auth middleware `Protect` accepts `supplier_token` cookie when Authorization is absent.
4. `POST /supplier/logout` clears the cookie.
5. Frontend: `lib/supplier-session.ts` (memory) + `lib/supplier-api.ts` (`withCredentials: true`); **no localStorage**.
6. Supplier document upload no longer requires tenant onboarding complete (external suppliers).

## Consequences
- XSS cannot read the session cookie via `document.cookie`.
- Page reload works via cookie without re-login (until JWT expiry).
- Manufacturer and supplier cookies remain separate (`auth_token` / `refresh_token` vs `supplier_token`).
