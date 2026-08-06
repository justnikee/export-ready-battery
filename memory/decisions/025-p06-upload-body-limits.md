# ADR 025: Unified HTTP body / multipart upload limits (P-06)

## Status
Accepted — 2026-08-05

## Context
Global `MaxBytesReader` capped bodies at **10 MB**, but several handlers called `ParseMultipartForm(32 << 20)` (32 MB). Clients could believe 32 MB was allowed, then fail at 10 MB with an opaque parse error (often 400, not 413).

## Decision
1. Single source of truth: `internal/limits` — `MaxRequestBodyBytes = 10 MiB` and per-resource ceilings all **≤** that.
2. `cmd/server` uses `limits.MaxRequestBodyBytes` for `MaxBytesReader`.
3. Shared `parseMultipartForm` maps oversize errors to **HTTP 413** with a clear message.
4. Remove all 32 MB multipart advertisements; CSV/bulk/evidence use 10 MB max.

## Consequences
- CSV/bulk import cannot exceed 10 MB request body (same as before in practice; messages now honest).
- Per-type limits remain (cert 5 MB, logo 2 MB, etc.).
