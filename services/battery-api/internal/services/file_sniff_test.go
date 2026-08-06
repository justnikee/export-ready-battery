package services

import (
	"testing"
)

func TestIsPDF(t *testing.T) {
	if !IsPDF([]byte("%PDF-1.4\n%âãÏÓ\n")) {
		t.Fatal("expected valid PDF magic")
	}
	if IsPDF([]byte("PK\x03\x04zip")) {
		t.Fatal("zip must not pass as PDF")
	}
	if IsPDF([]byte("<!DOCTYPE html>")) {
		t.Fatal("html must not pass as PDF")
	}
	if IsPDF([]byte("%PD")) {
		t.Fatal("truncated magic must fail")
	}
	if IsPDF(nil) {
		t.Fatal("nil must fail")
	}
	// Extension spoof: filename.pdf with JPEG body
	jpeg := []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10}
	if IsPDF(jpeg) {
		t.Fatal("JPEG body must not pass as PDF")
	}
}

func TestDetectImageType(t *testing.T) {
	png := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00}
	if DetectImageType(png) != ImagePNG {
		t.Fatal("expected PNG")
	}
	jpeg := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	if DetectImageType(jpeg) != ImageJPEG {
		t.Fatal("expected JPEG")
	}
	if DetectImageType([]byte("%PDF-1.4")) != "" {
		t.Fatal("PDF is not an image type")
	}
}

func TestDetectAllowedDocMIME(t *testing.T) {
	mime, ok := DetectAllowedDocMIME([]byte("%PDF-1.7\n"))
	if !ok || mime != "application/pdf" {
		t.Fatalf("pdf: got %q %v", mime, ok)
	}
	mime, ok = DetectAllowedDocMIME([]byte{0xFF, 0xD8, 0xFF, 0xDB})
	if !ok || mime != "image/jpeg" {
		t.Fatalf("jpeg: got %q %v", mime, ok)
	}
	// Spoof: .pdf name would have been client-side only — body is HTML
	if _, ok := DetectAllowedDocMIME([]byte("<html>not a pdf</html>")); ok {
		t.Fatal("html must be rejected")
	}
}

func TestRequirePDF(t *testing.T) {
	if err := RequirePDF([]byte("%PDF-1.4")); err != nil {
		t.Fatal(err)
	}
	if err := RequirePDF([]byte("not-pdf")); err == nil {
		t.Fatal("expected error")
	}
}
