# Session: 2026-08-05 — P-06 upload body limits

**Date:** 2026-08-05  
**User goal:** Unify multipart vs MaxBytes mismatch.

## What we did
- `internal/limits` package with MaxRequestBodyBytes + per-upload ceilings
- `parseMultipartForm` → 413 on oversize
- Replaced 32MB ParseMultipartForm across CSV/bulk/evidence
- main MaxBytesReader uses limits.MaxRequestBodyBytes

## Next
- P-07 client-side EU batch filter (optional)
