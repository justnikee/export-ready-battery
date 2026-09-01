# Session: 2026-09-01 — login-oauth-session

**Date:** 2026-09-01  
**Agent/tool:** Grok  
**User goal:** Diagnose production login failures on https://export-ready.vercel.app/login?error=oauth_session (Google) and 404s on credentials/magic-link emails.

## Context loaded
- [x] CURRENT.md
- [x] rules.md
- [ ] backlog (if relevant)
- [ ] prior session

## What we did
- Probed live login: frontend is Vercel (`export-ready.vercel.app`), API is Oracle (`https://130.210.34.184.nip.io`). CORS allows the Vercel origin. `POST /auth/login` and `POST /auth/refresh` exist. Refresh without cookie returns `Refresh token cookie missing`.
- Confirmed `/login?error=oauth_session` is set by `apps/battery-web/app/auth/callback/page.tsx` when `refreshAccessToken()` fails after a successful Google callback.
- Confirmed email/invite URLs still used `/battery/verify-email`, `/battery/reset-password`, `/battery/accept-invite` after routes were flattened. Those paths 404 on Vercel; `/verify-email` and `/reset-password` 200.
- Code fix: same-origin `/api/v1` rewrite so auth cookies are first-party; OAuth callback uses `FRONTEND_URL`; email/magic-link URLs flattened; `/battery/:path*` redirect for old emails; cookie SameSite=Lax.

## Decisions (link ADR if any)
- Auth cookies stay HttpOnly. Production session is first-party via Next.js rewrite to battery-api, not cross-site `SameSite=None` (Chrome third-party cookie blocking).
- Google redirect URI is the **frontend** origin (`https://export-ready.vercel.app/api/v1/auth/google/callback`), proxied to the API. Requires the URI in Google Cloud Console before backend deploy.

## Code / files touched
- `apps/battery-web/next.config.ts` — `/battery/:path*` redirect; `/api/v1/:path*` rewrite
- `apps/battery-web/lib/api-origin.ts` (+ test)
- `apps/battery-web/lib/api.ts`, `lib/supplier-api.ts`, login/register Google buttons
- `services/battery-api/internal/services/email.go` (+ test)
- `services/battery-api/internal/handlers/team_handlers.go`
- `services/battery-api/internal/handlers/auth_handlers.go` / `supplier_handlers.go` — SameSite=Lax
- `services/battery-api/internal/services/oauth_service.go` (+ test)
- `services/battery-api/cmd/server/main.go` — OAuth + email use FRONTEND_URL

## Tests / verification
- Commands run:
  - `pnpm --filter @anvaya/battery-web exec vitest run lib/api.test.ts lib/api-origin.test.ts lib/auth-api.test.ts context/auth-context.test.ts`
  - `go test ./internal/services/ ./internal/handlers/` (battery-api)
- Result: pass
- Could not click through Google OAuth in a browser (needs Google Console URI + deploy). Live 404s on `/battery/*` were verified with HTTP GET.

## Backlog updates
- None (production incident, not an audit ID)

## Open for next session
1. Add Google Cloud Console authorized redirect URI: `https://export-ready.vercel.app/api/v1/auth/google/callback` **before** deploying the API OAuth change.
2. Deploy battery-web (Vercel) then battery-api (Oracle). Confirm `FRONTEND_URL=https://export-ready.vercel.app` on the API.
3. Re-test Google login + password login + a verify-email / reset-password link.

## Graphify
- [ ] Updated (`graphify update .`)
- [x] N/A (auth URL/cookie wiring; no new modules)
