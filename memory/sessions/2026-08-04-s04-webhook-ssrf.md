# Session: 2026-08-04 — S-04 webhook SSRF

**Date:** 2026-08-04  
**User goal:** Fix outbound webhook SSRF (S-04).

## What we did

### Backend
- New `internal/services/ssrf.go`:
  - `ValidateOutboundWebhookURL` — scheme, userinfo, host blocklist, DNS + private/metadata IP checks, prod HTTPS
  - `NewSafeWebhookHTTPClient` — no proxy, SSRF DialContext, redirect re-validation
- Create handler + `OutboundWebhookService.Create` + every `attempt()` re-validate
- Tests for blocked IPs/hosts; handler rejects private URLs
- httptest unit tests use `TestingOnlyBypassSSRF` only

### Verification
- `go test` services + handlers webhook/SSRF paths OK
- `go build ./cmd/server` OK

## Next
- **S-05** supplier `localStorage` tokens
