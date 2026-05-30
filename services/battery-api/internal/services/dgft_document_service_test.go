package services

import (
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

func TestGenerateClaimPDF(t *testing.T) {
	now := time.Now()
	claim := &models.DGFTClaim{
		ID:                   "claim-123e4567",
		SchemeType:           "RODTEP",
		Status:               "DRAFT",
		ClaimPeriodStart:     "2025-01-01",
		ClaimPeriodEnd:       "2025-03-31",
		HSNCode:              "8507.60",
		DestinationCountry:   "Germany",
		ExportValueINR:       5000000,
		ExportQuantity:       1000,
		EstimatedClaimAmount: 125000,
		Notes:                "Test claim for Q1 2025",
		CreatedAt:            now,
		UpdatedAt:            now,
	}
	scheme := &models.DGFTSchemeConfig{
		SchemeType:        "RODTEP",
		Name:              "RoDTEP",
		RequiredDocuments: []string{"shipping_bill", "ebrc", "invoice"},
	}

	buf, err := GenerateClaimPDF(claim, scheme, "Anvaya Labs Pvt Ltd")
	if err != nil {
		t.Fatalf("GenerateClaimPDF failed: %v", err)
	}
	if buf.Len() == 0 {
		t.Fatal("expected non-empty PDF buffer")
	}
	// Basic PDF magic number check
	if buf.Bytes()[0] != '%' || buf.Bytes()[1] != 'P' {
		t.Fatal("generated buffer does not start with PDF magic number")
	}
}

func TestGenerateClaimCSV(t *testing.T) {
	now := time.Now()
	claim := &models.DGFTClaim{
		ID:                   "claim-123e4567",
		SchemeType:           "DUTY_DRAWBACK",
		Status:               "SUBMITTED",
		ClaimPeriodStart:     "2025-04-01",
		ClaimPeriodEnd:       "2025-06-30",
		HSNCode:              "6109",
		DestinationCountry:   "USA",
		ExportValueINR:       2500000,
		ExportQuantity:       500,
		EstimatedClaimAmount: 50000,
		Documents: []models.DGFTClaimDocument{
			{DocType: "shipping_bill", Status: "UPLOADED", FileURL: "/uploads/test.pdf"},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
	scheme := &models.DGFTSchemeConfig{
		SchemeType:        "DUTY_DRAWBACK",
		Name:              "Duty Drawback",
		RequiredDocuments: []string{"shipping_bill", "bill_of_entry"},
	}

	buf, err := GenerateClaimCSV(claim, scheme, "Test Exports")
	if err != nil {
		t.Fatalf("GenerateClaimCSV failed: %v", err)
	}
	if buf.Len() == 0 {
		t.Fatal("expected non-empty CSV buffer")
	}
	csvStr := buf.String()
	if !contains(csvStr, "DGFT EXPORT INCENTIVE CLAIM") {
		t.Fatal("CSV missing header")
	}
	if !contains(csvStr, "50000.00") {
		t.Fatal("CSV missing estimated amount")
	}
	if !contains(csvStr, "UPLOADED") {
		t.Fatal("CSV missing document status")
	}
}

func TestFormatDateStr(t *testing.T) {
	cases := []struct {
		input, want string
	}{
		{"2025-01-15", "15-Jan-2025"},
		{"2024-12-01", "01-Dec-2024"},
		{"invalid", "invalid"},
	}
	for _, c := range cases {
		got := formatDateStr(c.input)
		if got != c.want {
			t.Errorf("formatDateStr(%q) = %q, want %q", c.input, got, c.want)
		}
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
