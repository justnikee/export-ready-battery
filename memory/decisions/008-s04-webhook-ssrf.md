# ADR 008: Outbound webhook SSRF protection (S-04)

## Status
Accepted — 2026-08-04

## Context
Tenants could register any `http(s)` webhook URL. The server POSTed lifecycle events to that URL with no block on loopback, RFC1918, link-local, or cloud metadata (`169.254.169.254`). Redirects and DNS rebinding were also unguarded.

## Decision
1. **`ValidateOutboundWebhookURL`** at create and before every delivery attempt.
2. Block: non-http(s), userinfo, fragments, blocked hostnames (`localhost`, `*.local`, `*.internal`, metadata hosts), private/loopback/link-local/CGNAT/doc IPs after DNS resolve.
3. Production (`APP_ENV=production`) requires **HTTPS**.
4. **`NewSafeWebhookHTTPClient`**: no env proxy, DialContext that only connects to non-blocked IPs, redirect check re-validates target (max 5 redirects).
5. Unit tests use `TestingOnlyBypassSSRF` solely for httptest loopback — never in production paths.

## Consequences
- Internal network and cloud metadata are not reachable via webhooks.
- Legacy rows pointing at private URLs fail at delivery with a logged error.
- Legitimate public HTTPS endpoints (Zapier, Slack, customer APIs) continue to work.
