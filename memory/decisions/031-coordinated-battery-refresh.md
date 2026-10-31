# ADR 031 — Coordinate battery-web session refresh

Date: 2026-10-17. Status: accepted for D07.

## Decision

- Keep access tokens in memory and the rotating refresh token in an HttpOnly cookie.
- Share one refresh promise across requests in the same tab. Where Web Locks are available, serialize cookie rotation across tabs under `battery-api-refresh`.
- Bound each refresh HTTP call to 15 seconds. A refresh response may update memory only if no newer login, logout, or refresh has changed the session version.
- On a 401, retry with an already-installed newer access token before asking the server to rotate the cookie again. Retry an individual failed request at most once.

## Rationale and limits

The refresh cookie rotates on use. Simultaneous expired requests previously raced, and a late failed refresh could clear a successful access token. The lock and shared promise avoid normal concurrent rotation; the session-version guard prevents stale completion from overwriting current in-memory state. Browsers without Web Locks still get same-tab coordination, but cross-tab coordination is best-effort there. This does not change the server's cookie, JWT, or logout policy.

## Verification

Battery-web regression tests cover overlapping refresh requests and a stale refresh failure after a newer login. The full frontend suite and TypeScript check pass. Live multi-tab browser verification remains for the user's manual walkthrough.
