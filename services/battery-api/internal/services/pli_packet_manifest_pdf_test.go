package services

import (
	"testing"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

func makeTestPLIBatch() *models.Batch {
	return &models.Batch{
		ID:               uuid.New(),
		BatchName:        "PLI-TEST-001",
		MarketRegion:     models.MarketRegionIndia,
		DomesticValueAdd: 55.0,
		Specs: models.BatchSpec{
			Chemistry: "LFP",
		},
	}
}

func TestGeneratePLIPacketManifest_AllDocumentsPresent(t *testing.T) {
	batchID := "b1"
	claim := &models.DGFTClaim{
		ID:         "claim-1",
		BatchID:    &batchID,
		SchemeType: "RODTEP",
		Status:     "submitted",
	}

	pdfBytes, err := GeneratePLIPacketManifest(PLIPacketManifestInput{
		Batch:               makeTestPLIBatch(),
		Tenant:              makeTestTenant(),
		HasDVAReport:        true,
		HasComplianceReport: true,
		HasBISCertificate:   true,
		HasPLICertificate:   true,
		DGFTClaim:           claim,
	})
	if err != nil {
		t.Fatalf("GeneratePLIPacketManifest failed: %v", err)
	}
	if len(pdfBytes) == 0 {
		t.Fatal("expected non-empty PDF output")
	}
	if string(pdfBytes[:4]) != "%PDF" {
		t.Fatalf("expected output to start with %%PDF magic bytes, got %q", pdfBytes[:4])
	}
}

func TestGeneratePLIPacketManifest_NothingOnFile(t *testing.T) {
	// Even with every document missing, the manifest must still render —
	// a manufacturer with nothing uploaded yet should still get a packet
	// that tells them what's missing, not a generation failure.
	pdfBytes, err := GeneratePLIPacketManifest(PLIPacketManifestInput{
		Batch:  makeTestPLIBatch(),
		Tenant: makeTestTenant(),
	})
	if err != nil {
		t.Fatalf("GeneratePLIPacketManifest failed: %v", err)
	}
	if len(pdfBytes) == 0 {
		t.Fatal("expected non-empty PDF output even with nothing on file")
	}
}

func TestCertFileExt(t *testing.T) {
	cases := []struct {
		url  string
		want string
	}{
		{"https://example.com/storage/bis-cert.pdf", ".pdf"},
		{"https://example.com/storage/bis-cert.png?token=abc123", ".png"},
		{"https://example.com/storage/bis-cert-no-extension", ".pdf"},
		{"", ".pdf"},
	}
	for _, c := range cases {
		if got := certFileExt(c.url); got != c.want {
			t.Errorf("certFileExt(%q) = %q, want %q", c.url, got, c.want)
		}
	}
}
