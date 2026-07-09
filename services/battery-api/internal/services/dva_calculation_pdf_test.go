package services

import (
	"testing"

	"github.com/google/uuid"

	"github.com/anvayalabs/battery-api/internal/models"
)

func makeTestTenant() *models.Tenant {
	return &models.Tenant{
		ID:          uuid.New(),
		CompanyName: "Test Battery Co",
	}
}

func TestGenerateDVACalculationReport_EstimatedWithBreakdown(t *testing.T) {
	batch := &models.Batch{
		ID:               uuid.New(),
		BatchName:        "DVA-TEST-001",
		MarketRegion:     models.MarketRegionIndia,
		PLICompliant:     true,
		DomesticValueAdd: 62.5,
		Specs: models.BatchSpec{
			Chemistry:             "LFP",
			CellSource:            "DOMESTIC",
			DVASource:             "ESTIMATED",
			SalePriceINR:          50000,
			CellCostDomesticINR:   20000,
			BMSCostDomesticINR:    5000,
			CasingCostDomesticINR: 3000,
			LabourOverheadCostINR: 3250,
			CellCostImportedINR:   1000,
		},
	}
	tenant := makeTestTenant()

	pdfBytes, err := GenerateDVACalculationReport(batch, tenant)
	if err != nil {
		t.Fatalf("GenerateDVACalculationReport failed: %v", err)
	}
	if len(pdfBytes) == 0 {
		t.Fatal("expected non-empty PDF output")
	}
	if string(pdfBytes[:4]) != "%PDF" {
		t.Fatalf("expected output to start with %%PDF magic bytes, got %q", pdfBytes[:4])
	}
}

func TestGenerateDVACalculationReport_EstimatedLegacyFallback(t *testing.T) {
	batch := &models.Batch{
		ID:               uuid.New(),
		BatchName:        "DVA-TEST-002",
		MarketRegion:     models.MarketRegionIndia,
		DomesticValueAdd: 30.0,
		Specs: models.BatchSpec{
			Chemistry:     "NMC_811",
			CellSource:    "DOMESTIC",
			DVASource:     "ESTIMATED",
			SalePriceINR:  40000,
			ImportCostINR: 28000,
			// No cost-breakdown fields set — legacy 2-field path.
		},
	}
	tenant := makeTestTenant()

	pdfBytes, err := GenerateDVACalculationReport(batch, tenant)
	if err != nil {
		t.Fatalf("GenerateDVACalculationReport failed: %v", err)
	}
	if len(pdfBytes) == 0 {
		t.Fatal("expected non-empty PDF output")
	}
}

func TestGenerateDVACalculationReport_Audited(t *testing.T) {
	auditedDVA := 71.3
	batch := &models.Batch{
		ID:               uuid.New(),
		BatchName:        "DVA-TEST-003",
		MarketRegion:     models.MarketRegionIndia,
		PLICompliant:     true,
		DomesticValueAdd: auditedDVA,
		Specs: models.BatchSpec{
			Chemistry:               "LFP",
			CellSource:              "DOMESTIC",
			DVASource:               "AUDITED",
			AuditedDomesticValueAdd: &auditedDVA,
			PLICertificateURL:       "https://example.com/ca-cert.pdf",
		},
	}
	tenant := makeTestTenant()

	pdfBytes, err := GenerateDVACalculationReport(batch, tenant)
	if err != nil {
		t.Fatalf("GenerateDVACalculationReport failed: %v", err)
	}
	if len(pdfBytes) == 0 {
		t.Fatal("expected non-empty PDF output")
	}
}

func TestGenerateDVACalculationReport_ImportedCellsIncludesCustoms(t *testing.T) {
	batch := &models.Batch{
		ID:           uuid.New(),
		BatchName:    "DVA-TEST-004",
		MarketRegion: models.MarketRegionIndia,
		Specs: models.BatchSpec{
			Chemistry:       "LFP",
			CellSource:      "IMPORTED",
			DVASource:       "ESTIMATED",
			BillOfEntryNo:   "BOE-2026-001",
			CountryOfOrigin: "CN",
			CustomsDate:     "2026-01-15",
		},
	}
	tenant := makeTestTenant()

	// Must not panic or error when CellSource is IMPORTED — exercises the
	// customs declaration section.
	pdfBytes, err := GenerateDVACalculationReport(batch, tenant)
	if err != nil {
		t.Fatalf("GenerateDVACalculationReport failed: %v", err)
	}
	if len(pdfBytes) == 0 {
		t.Fatal("expected non-empty PDF output")
	}
}
