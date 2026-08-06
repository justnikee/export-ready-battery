# ADR 015: Upload content validation via magic bytes (S-11)

## Status
Accepted — 2026-08-05

## Context
Certificate and document uploads trusted client `Content-Type` and/or `.pdf` filename suffixes. A JPEG or HTML payload named `cert.pdf` was accepted and stored, then later served or reprocessed.

## Decision
1. **Shared sniff helpers** in `services/file_sniff.go`:
   - `IsPDF` / `RequirePDF` — strict leading `%PDF-`
   - `DetectImageType` — PNG/JPEG magic only
   - `DetectAllowedDocMIME` — PDF + PNG/JPEG/TIFF for multi-type uploads
2. **Never trust** extension or Content-Type alone for acceptance.
3. **Wire on upload paths:**
   - EPR/BIS/PLI certs → `RequirePDF`
   - Logo → `DetectImageType`
   - Passport docs / supplier docs → `DetectAllowedDocMIME`
   - DGFT claim PDFs, AI datasheet PDF → `RequirePDF`
4. Reject with **400** and a clear message when magic does not match.

## Consequences
- Spoofed non-PDF certs are rejected before storage.
- Scanned/image PDFs that still start with `%PDF-` remain valid.
- Due-diligence/CMRT/CSV paths are out of scope for this ADR (different formats).
- Antivirus / per-tenant quotas remain future work (audit note).
