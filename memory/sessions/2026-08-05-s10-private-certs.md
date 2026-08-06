# Session: 2026-08-05 — S-10 private compliance certs

**Date:** 2026-08-05  
**User goal:** Private compliance document storage + signed URLs (S-10).

## What we did

### Backend
- UploadDocument: store canonical ref; return short-lived signed URL
- ViewDocument: always re-sign (JSON or redirect); no public redirect
- `/auth/me`: re-sign epr/bis/pli paths like logo
- GetPassport: re-sign tenant cert paths before public/partner/regulator views
- ExtractStoragePath: bare object keys supported

### Frontend
- document-upload view uses Accept: application/json → signed URL
- certificate-view: absolute signed hrefs without wrong base prefix

### Ops note
Ensure Supabase `compliance-docs` bucket is **private** in the dashboard.

## Next
- **S-11** PDF magic-byte validation on upload
