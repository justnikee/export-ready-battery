# ADR 014: Private compliance certificates + signed URLs (S-10)

## Status
Accepted — 2026-08-05

## Context
EPR/BIS/PLI PDFs were uploaded to `compliance-docs` and stored/returned as permanent **public** object URLs (`…/object/public/…`). If the bucket is public, registration documents are world-readable and path-guessable (`{tenant_id}/certificates/{type}.pdf`). Logo already used private-bucket + re-sign pattern.

## Decision
1. **Store** only a canonical public-URL-shaped reference (or bare object key) — never a long-lived signed URL.
2. **Upload response** returns a short-lived signed URL for immediate UX; DB keeps the canonical ref.
3. **ViewDocument** always re-signs (JSON `{url}` or redirect) — no direct public redirect.
4. **`/auth/me`** re-signs cert paths on every read (same as logo).
5. **Passport public/partner/regulator views** re-sign tenant cert paths in-place before JSON response.
6. Frontend view uses authenticated ViewDocument / absolute signed hrefs.

## Consequences
- Bucket should remain **private** in Supabase; service role signs on read.
- Legacy public URLs still extract path via `ExtractStoragePath` and re-sign.
- Ops must ensure `compliance-docs` is not public in Supabase dashboard.
