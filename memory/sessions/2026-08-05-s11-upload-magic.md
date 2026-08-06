# Session: 2026-08-05 — S-11 upload magic-byte validation

**Date:** 2026-08-05  
**User goal:** Continue security sprint; confirm direction; finish S-11.

## Direction check
Yes — remaining highest-impact storage/input validation after auth/tenancy (S-01…S-10).

## What we did

### Shared helpers
- `internal/services/file_sniff.go` — `IsPDF`, `RequirePDF`, `DetectImageType`, `DetectAllowedDocMIME`
- `file_sniff_test.go` — spoof/HTML/ZIP/JPEG rejection, PNG/JPEG/PDF accept

### Wired handlers
- `document_handlers.go` — cert PDF, logo image, passport multi-type docs
- `dgft_claim_handlers.go` — claim PDF
- `ai_handlers.go` — datasheet PDF
- `supplier_handlers.go` — supplier docs via `DetectAllowedDocMIME`

### Build fix
- Unused `header` in AI PDF upload → `_`
- Unused `path/filepath` import in document_handlers

### Verification
- `go test ./internal/services/ ./internal/handlers/` green

## Next
- **S-12** regulator key model (or next open security item user prefers)
