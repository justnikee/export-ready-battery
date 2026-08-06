# ADR 024: Gate synchronous heavy exports (P-05)

## Status
Accepted — 2026-08-05

## Context
QR ZIP and label PDF already rejected batches with >500 passports. Serial CSV and audit CSV still loaded **all** passports/events on the request goroutine — large batches could OOM or starve workers. Frontend only routed QR/labels to async export jobs.

## Decision
1. **Single threshold:** `maxDownloadLimit` / `ThresholdForAsyncExport` = **500** passports for all passport-bound sync exports.
2. **Sync endpoints that load passports or full audit trails** reject with 400 + pointer to `POST /api/v1/export-jobs` when over limit:
   - QR ZIP → `QR_ZIP`
   - Labels PDF → `LABELS_PDF`
   - Serial CSV → `CSV` (new gate)
   - Audit CSV → `AUDIT_CSV` (new gate; count passports before loading events)
3. **Frontend** (`useBatchDetail`): CSV + audit CSV use async job path when `passportCount > 500` (same UX as QR/labels).
4. **Batch-level PDFs** (compliance declaration, due diligence, DVA, compliance report) stay sync — they do not load N passports into memory.

## Consequences
- Large-batch CSV/audit no longer works as direct browser download without export-jobs service (Supabase storage).
- Residual: mid-size batches (≤500) still generate ZIP/PDF on request path; further streaming/async defaults is future work.
