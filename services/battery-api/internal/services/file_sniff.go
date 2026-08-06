package services

import (
	"bytes"
	"fmt"
	"net/http"
	"strings"
)

// PDF magic number (ISO 32000). Leading whitespace is rare but allowed by some
// producers; we only accept a strict leading "%PDF-" for predictability.
var pdfMagic = []byte("%PDF-")

// IsPDF reports whether data starts with the PDF file signature.
// Extension and Content-Type headers are ignored — callers must pass file bytes.
func IsPDF(data []byte) bool {
	if len(data) < len(pdfMagic) {
		return false
	}
	return bytes.HasPrefix(data, pdfMagic)
}

// SniffedImage is a validated image payload type for logo uploads.
type SniffedImage string

const (
	ImagePNG  SniffedImage = "image/png"
	ImageJPEG SniffedImage = "image/jpeg"
)

// DetectImageType returns PNG/JPEG from magic bytes, or empty if unsupported.
func DetectImageType(data []byte) SniffedImage {
	if len(data) >= 8 &&
		data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 &&
		data[4] == 0x0D && data[5] == 0x0A && data[6] == 0x1A && data[7] == 0x0A {
		return ImagePNG
	}
	if len(data) >= 3 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF {
		return ImageJPEG
	}
	return ""
}

// DetectAllowedDocMIME sniffs PDF/JPEG/PNG/TIFF for multi-type document uploads.
// Prefer this over trusting client Content-Type / filename.
func DetectAllowedDocMIME(data []byte) (mime string, ok bool) {
	if IsPDF(data) {
		return "application/pdf", true
	}
	if t := DetectImageType(data); t != "" {
		return string(t), true
	}
	// TIFF (little/big endian)
	if len(data) >= 4 {
		if (data[0] == 'I' && data[1] == 'I' && data[2] == 0x2A && data[3] == 0x00) ||
			(data[0] == 'M' && data[1] == 'M' && data[2] == 0x00 && data[3] == 0x2A) {
			return "image/tiff", true
		}
	}
	// Fallback: http.DetectContentType for edge cases already covered above
	sniffed := http.DetectContentType(data)
	base := strings.TrimSpace(strings.Split(sniffed, ";")[0])
	switch base {
	case "application/pdf", "image/jpeg", "image/png", "image/tiff":
		// Only accept DetectContentType if magic also matches for PDF/images
		if base == "application/pdf" && !IsPDF(data) {
			return "", false
		}
		return base, true
	default:
		return "", false
	}
}

// RequirePDF returns an error if data is not a PDF by magic bytes.
func RequirePDF(data []byte) error {
	if !IsPDF(data) {
		return fmt.Errorf("file content is not a valid PDF (missing %%PDF- signature)")
	}
	return nil
}
