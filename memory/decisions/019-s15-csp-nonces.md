# ADR 019: Nonce-based CSP without script unsafe-inline (S-15)

## Status
Accepted — 2026-08-05

## Context
Production CSP in `next.config.ts` allowed `script-src 'unsafe-inline'`, which greatly amplifies XSS impact. Razorpay checkout and Next.js hydration historically motivated that exception.

## Decision
1. **Per-request CSP** built in `proxy.ts` with a random **nonce** + `'strict-dynamic'` (Next.js 16 recommended pattern).
2. **No** `'unsafe-inline'` on **script-src** (dev still gets `'unsafe-eval'` for React HMR only).
3. Next.js reads the CSP/nonce from request headers and stamps framework scripts; root layout passes `nonce` to Razorpay via `next/script`.
4. Static CSP removed from `next.config.ts` headers (other security headers remain).
5. **style-src** still allows `'unsafe-inline'` for shadcn/Tailwind residual risk — out of S-15 script scope.
6. Matcher includes public `/p/*` so passport pages get CSP too.

## Consequences
- HTML for app routes is dynamic (nonce per request); static asset routes remain excluded.
- Third-party scripts must receive the nonce or be loaded by a nonced script (strict-dynamic).
- Residual: style inline still allowed; full style noncing is a future hardening step.
