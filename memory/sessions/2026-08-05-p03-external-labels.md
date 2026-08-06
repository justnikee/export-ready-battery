# Session: 2026-08-05 — P-03 external labels cap

**Date:** 2026-08-05  
**User goal:** Cap external label download memory (was 10k passports).

## What we did
- `ExternalDownloadLabels`: count → reject if > `maxDownloadLimit` (500) → fetch `count` only
- Error points to async `export-jobs` LABELS_PDF
- Tests: oversize rejects without GetPassportsByBatch; empty; count error

## Next
- **P-04** global API rate limit for authenticated traffic
