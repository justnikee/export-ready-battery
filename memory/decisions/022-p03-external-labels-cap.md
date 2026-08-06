# ADR 022: Cap external label PDF at maxDownloadLimit (P-03)

## Status
Accepted — 2026-08-05

## Context
`GET /api/v1/external/batches/{id}/labels` loaded up to **10,000** passports via `GetPassportsByBatch(..., 10000, 0)` then built a full PDF in memory. JWT `DownloadLabels` already enforced `maxDownloadLimit = 500` after counting rows.

## Decision
1. External path uses the **same** `maxDownloadLimit` (500) as authenticated downloads.
2. **Count first**; if `count > maxDownloadLimit`, return **400** with guidance to use `POST /api/v1/export-jobs` `job_type=LABELS_PDF`.
3. Fetch only `count` rows when under the limit — never a hard-coded 10k.

## Consequences
- API-key ERP integrations cannot sync-download labels for huge batches; they must use async export jobs.
- Memory DoS via external labels path is bounded the same as the manufacturer UI path.
