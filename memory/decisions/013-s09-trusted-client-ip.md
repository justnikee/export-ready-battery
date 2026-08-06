# ADR 013: Trusted client IP for rate limits (S-09)

## Status
Accepted — 2026-08-04

## Context
Rate limiters used the **leftmost** `X-Forwarded-For` value, which is client-controlled. Attackers could rotate spoofed IPs to bypass auth rate limits or pin a victim IP.

## Decision
1. Central helper `middleware.ClientIP(r)`:
   - **Untrusted** (default in development): use only `RemoteAddr` (strip port).
   - **Trusted** (`TRUST_PROXY=true` or `APP_ENV=production|staging`): use **rightmost** valid `X-Forwarded-For` hop, then `X-Real-IP`, then `RemoteAddr`.
2. Wire `RateLimiter.Limit` and `TenantRateLimiter` IP fallback through `ClientIP`.
3. Align scan geo IP + lifecycle request IP with the same rules.
4. Document `TRUST_PROXY` in `.env.example`.

## Consequences
- Local/dev clients cannot bypass rate limits via header spoofing.
- Production behind Render/nginx gets real client IPs when trust is on.
- Misconfigured trust still fails safer in dev (ignore headers).
