# Session: 2026-08-05 — P-05 sync heavy exports

**Date:** 2026-08-05  
**User goal:** Gate synchronous heavy exports; prefer async for large batches.

## What we did
- Shared `syncExportTooLargeMsg` for QR/labels/CSV/audit (+ external labels)
- ExportBatchCSV + ExportBatchAuditCSV: reject if passports > 500
- Frontend CSV + audit use createExportJob when passportCount > 500
- Tests for oversize CSV/audit

## Residual
- Compliance/DD/DVA PDFs still sync (batch-level, not N-passport)
- ≤500 still sync-generates ZIP/PDF in-request

## Next
- P-06 multipart vs MaxBytes mismatch (optional)
