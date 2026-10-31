# Session: 2026-10-31 — password reset hardening isolation

- Isolated normalized email lookup and SHA-256 reset-token storage from the original checkout. Kept billing, demo workflow, and marketing changes out.
- Battery-api `go test ./...` and `go vet ./...` pass; battery-web 312 Vitest tests and TypeScript pass.
- No migration. Already-sent plaintext reset links will not redeem after deployment; the user requests a new link. Manual request/email/redeem flow remains before merge.
- Graphify is unavailable; targeted source tracing was used.
