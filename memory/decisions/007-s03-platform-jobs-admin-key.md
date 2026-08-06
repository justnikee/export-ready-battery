# ADR 007: Platform admin key for global job triggers (S-03)

## Status
Accepted — 2026-08-04

## Context
`POST /api/v1/jobs/daily-alerts` and `POST /api/v1/jobs/upgrade-anchors` ran global, cross-tenant work but were gated only by tenant JWT (after S-02, any write role). Any MEMBER could stampede expensive jobs. Background tickers already run inside the API process.

## Decision
1. Protect both routes with `middleware.AdminAPIKey` (`X-Admin-API-Key` / `ADMIN_API_KEY`) — same as S-01.
2. Fail-closed when key unset (503).
3. Remove manufacturer dashboard “System Jobs” UI (cannot safely hold the secret in the browser).
4. Keep `runDailyAlerts` / `upgradeCertificateAnchors` client helpers for ops scripts only, requiring an explicit `adminApiKey` argument.
5. In-process tickers continue unchanged (no HTTP required for scheduled runs).

## Consequences
- Tenant JWTs cannot trigger global jobs.
- Ops/cron must send `X-Admin-API-Key`.
- Future admin-web should call jobs from a server route that holds `ADMIN_API_KEY`.
