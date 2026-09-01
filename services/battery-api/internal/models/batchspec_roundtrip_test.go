package models

import (
	"encoding/json"
	"testing"
)

// TestBatchSpec_JSONRoundTrip verifies that every field in BatchSpec
// survives JSON marshal → unmarshal. This catches missing json tags
// that silently drop fields sent by the frontend wizard.
func TestBatchSpec_JSONRoundTrip(t *testing.T) {
	expectedLifetime := 3000
	warrantyMonths := 24
	recycledContent := 15.5
	auditedDVA := 65.0

	original := BatchSpec{
		Chemistry:               "LFP",
		NominalVoltage:          "48V",
		Capacity:                "150Ah",
		Manufacturer:            "CATL",
		ManufacturerEmail:       "compliance@catl.com",
		Weight:                  "25kg",
		Recyclable:              true,
		CarbonFootprint:         "45 kg CO2e",
		CountryOfOrigin:         "IN",
		CellCountryOfOrigin:     "CN",
		MaterialProfile:         "High-nickel NMC",
		LotSize:                 "1000",
		ProductionStage:         "Cell Assembly",
		SalePriceINR:            50000,
		ImportCostINR:           15000,
		CellCostImportedINR:     8000,
		CellCostDomesticINR:     12000,
		BMSCostImportedINR:      2000,
		BMSCostDomesticINR:      3000,
		CasingCostImportedINR:   1000,
		CasingCostDomesticINR:   1500,
		LabourOverheadCostINR:   2500,
		CellSource:              "IMPORTED",
		DomesticValueAdd:        70.0,
		HSNCode:                 "8507.60.00",
		BISNumber:               "R-12345678",
		EPRNumber:               "EPR-BAT-001",
		BillOfEntryNo:           "BOE-2024-001",
		CustomsDate:             "2024-01-15",
		DVASource:               "AUDITED",
		AuditedDomesticValueAdd: &auditedDVA,
		PLICertificateURL:       "https://example.com/cert.pdf",
		MaterialComposition: &MaterialComposition{
			CobaltPct:          12.5,
			LithiumPct:         8.0,
			GraphitePct:        20.0,
			NickelPct:          15.0,
			LeadPct:            0,
			ManganesePct:       5.0,
			RecycledCobaltPct:  3.0,
			RecycledLithiumPct: 1.5,
			RecycledNickelPct:  2.0,
			RecycledLeadPct:    0,
		},
		Certifications:          []string{"CE", "UN38.3", "RoHS"},
		BISCertificateIssueDate: "2024-01-15",
		UN383TestDate:           "2024-03-20",
		IEC62133TestDate:        "2024-02-10",
		MSDSIssueDate:           "2024-01-01",
		ManufacturerAddress:     "123 Industrial Road, Ningde, China",
		EURepresentative:        "EU Rep GmbH",
		EURepresentativeEmail:   "rep@eurep.de",
		EURepresentativeAddress: "456 EU Street, Berlin, Germany",
		ExpectedLifetimeCycles:  &expectedLifetime,
		WarrantyMonths:          &warrantyMonths,
		RecycledContentPct:      &recycledContent,
		HazardousSubstances: &HazardousSubstances{
			LeadPresent:    false,
			MercuryPresent: false,
			CadmiumPresent: false,
			Declaration:    "RoHS compliant",
		},
		BatteryCategory: "EV",
		PerformanceSpec: &PerformanceSpec{
			CathodeMaterial: "LiFePO4",
			AnodeMaterial:   "Graphite",
		},
	}

	// Marshal to JSON (simulates what the repository does before INSERT)
	jsonBytes, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Failed to marshal BatchSpec: %v", err)
	}

	// Unmarshal back (simulates what GetBatch does after SELECT)
	var roundTripped BatchSpec
	if err := json.Unmarshal(jsonBytes, &roundTripped); err != nil {
		t.Fatalf("Failed to unmarshal BatchSpec: %v", err)
	}

	// Verify every field round-tripped correctly
	assertEq(t, "Chemistry", original.Chemistry, roundTripped.Chemistry)
	assertEq(t, "NominalVoltage", original.NominalVoltage, roundTripped.NominalVoltage)
	assertEq(t, "Capacity", original.Capacity, roundTripped.Capacity)
	assertEq(t, "Manufacturer", original.Manufacturer, roundTripped.Manufacturer)
	assertEq(t, "ManufacturerEmail", original.ManufacturerEmail, roundTripped.ManufacturerEmail)
	assertEq(t, "Weight", original.Weight, roundTripped.Weight)
	assertEq(t, "Recyclable", original.Recyclable, roundTripped.Recyclable)
	assertEq(t, "CarbonFootprint", original.CarbonFootprint, roundTripped.CarbonFootprint)
	assertEq(t, "CountryOfOrigin", original.CountryOfOrigin, roundTripped.CountryOfOrigin)
	assertEq(t, "CellCountryOfOrigin", original.CellCountryOfOrigin, roundTripped.CellCountryOfOrigin)
	assertEq(t, "MaterialProfile", original.MaterialProfile, roundTripped.MaterialProfile)
	assertEq(t, "LotSize", original.LotSize, roundTripped.LotSize)
	assertEq(t, "ProductionStage", original.ProductionStage, roundTripped.ProductionStage)
	assertEq(t, "SalePriceINR", original.SalePriceINR, roundTripped.SalePriceINR)
	assertEq(t, "ImportCostINR", original.ImportCostINR, roundTripped.ImportCostINR)
	assertEq(t, "CellCostImportedINR", original.CellCostImportedINR, roundTripped.CellCostImportedINR)
	assertEq(t, "CellCostDomesticINR", original.CellCostDomesticINR, roundTripped.CellCostDomesticINR)
	assertEq(t, "BMSCostImportedINR", original.BMSCostImportedINR, roundTripped.BMSCostImportedINR)
	assertEq(t, "BMSCostDomesticINR", original.BMSCostDomesticINR, roundTripped.BMSCostDomesticINR)
	assertEq(t, "CasingCostImportedINR", original.CasingCostImportedINR, roundTripped.CasingCostImportedINR)
	assertEq(t, "CasingCostDomesticINR", original.CasingCostDomesticINR, roundTripped.CasingCostDomesticINR)
	assertEq(t, "LabourOverheadCostINR", original.LabourOverheadCostINR, roundTripped.LabourOverheadCostINR)
	assertEq(t, "CellSource", original.CellSource, roundTripped.CellSource)
	assertEq(t, "DomesticValueAdd", original.DomesticValueAdd, roundTripped.DomesticValueAdd)
	assertEq(t, "HSNCode", original.HSNCode, roundTripped.HSNCode)
	assertEq(t, "BISNumber", original.BISNumber, roundTripped.BISNumber)
	assertEq(t, "EPRNumber", original.EPRNumber, roundTripped.EPRNumber)
	assertEq(t, "BillOfEntryNo", original.BillOfEntryNo, roundTripped.BillOfEntryNo)
	assertEq(t, "CustomsDate", original.CustomsDate, roundTripped.CustomsDate)
	assertEq(t, "DVASource", original.DVASource, roundTripped.DVASource)
	assertEq(t, "PLICertificateURL", original.PLICertificateURL, roundTripped.PLICertificateURL)
	assertSliceEq(t, "Certifications", original.Certifications, roundTripped.Certifications)
	assertEq(t, "BISCertificateIssueDate", original.BISCertificateIssueDate, roundTripped.BISCertificateIssueDate)
	assertEq(t, "UN383TestDate", original.UN383TestDate, roundTripped.UN383TestDate)
	assertEq(t, "IEC62133TestDate", original.IEC62133TestDate, roundTripped.IEC62133TestDate)
	assertEq(t, "MSDSIssueDate", original.MSDSIssueDate, roundTripped.MSDSIssueDate)
	assertEq(t, "ManufacturerAddress", original.ManufacturerAddress, roundTripped.ManufacturerAddress)
	assertEq(t, "EURepresentative", original.EURepresentative, roundTripped.EURepresentative)
	assertEq(t, "EURepresentativeEmail", original.EURepresentativeEmail, roundTripped.EURepresentativeEmail)
	assertEq(t, "EURepresentativeAddress", original.EURepresentativeAddress, roundTripped.EURepresentativeAddress)
	assertEq(t, "BatteryCategory", original.BatteryCategory, roundTripped.BatteryCategory)

	// Pointer fields
	assertPtrEq(t, "ExpectedLifetimeCycles", original.ExpectedLifetimeCycles, roundTripped.ExpectedLifetimeCycles)
	assertPtrEq(t, "WarrantyMonths", original.WarrantyMonths, roundTripped.WarrantyMonths)
	assertPtrEq(t, "RecycledContentPct", original.RecycledContentPct, roundTripped.RecycledContentPct)
	assertPtrEq(t, "AuditedDomesticValueAdd", original.AuditedDomesticValueAdd, roundTripped.AuditedDomesticValueAdd)

	// Nested structs
	if roundTripped.MaterialComposition == nil {
		t.Fatal("MaterialComposition is nil after round-trip")
	}
	assertEq(t, "MaterialComposition.CobaltPct", original.MaterialComposition.CobaltPct, roundTripped.MaterialComposition.CobaltPct)
	assertEq(t, "MaterialComposition.LithiumPct", original.MaterialComposition.LithiumPct, roundTripped.MaterialComposition.LithiumPct)
	assertEq(t, "MaterialComposition.GraphitePct", original.MaterialComposition.GraphitePct, roundTripped.MaterialComposition.GraphitePct)
	assertEq(t, "MaterialComposition.NickelPct", original.MaterialComposition.NickelPct, roundTripped.MaterialComposition.NickelPct)
	assertEq(t, "MaterialComposition.LeadPct", original.MaterialComposition.LeadPct, roundTripped.MaterialComposition.LeadPct)
	assertEq(t, "MaterialComposition.ManganesePct", original.MaterialComposition.ManganesePct, roundTripped.MaterialComposition.ManganesePct)
	assertEq(t, "MaterialComposition.RecycledCobaltPct", original.MaterialComposition.RecycledCobaltPct, roundTripped.MaterialComposition.RecycledCobaltPct)
	assertEq(t, "MaterialComposition.RecycledLithiumPct", original.MaterialComposition.RecycledLithiumPct, roundTripped.MaterialComposition.RecycledLithiumPct)
	assertEq(t, "MaterialComposition.RecycledNickelPct", original.MaterialComposition.RecycledNickelPct, roundTripped.MaterialComposition.RecycledNickelPct)
	assertEq(t, "MaterialComposition.RecycledLeadPct", original.MaterialComposition.RecycledLeadPct, roundTripped.MaterialComposition.RecycledLeadPct)

	if roundTripped.HazardousSubstances == nil {
		t.Fatal("HazardousSubstances is nil after round-trip")
	}
	assertEq(t, "HazardousSubstances.LeadPresent", original.HazardousSubstances.LeadPresent, roundTripped.HazardousSubstances.LeadPresent)
	assertEq(t, "HazardousSubstances.MercuryPresent", original.HazardousSubstances.MercuryPresent, roundTripped.HazardousSubstances.MercuryPresent)
	assertEq(t, "HazardousSubstances.CadmiumPresent", original.HazardousSubstances.CadmiumPresent, roundTripped.HazardousSubstances.CadmiumPresent)
	assertEq(t, "HazardousSubstances.Declaration", original.HazardousSubstances.Declaration, roundTripped.HazardousSubstances.Declaration)

	if roundTripped.PerformanceSpec == nil {
		t.Fatal("PerformanceSpec is nil after round-trip")
	}
	assertEq(t, "PerformanceSpec.CathodeMaterial", original.PerformanceSpec.CathodeMaterial, roundTripped.PerformanceSpec.CathodeMaterial)
	assertEq(t, "PerformanceSpec.AnodeMaterial", original.PerformanceSpec.AnodeMaterial, roundTripped.PerformanceSpec.AnodeMaterial)
}

func assertSliceEq(t *testing.T, name string, expected, actual []string) {
	t.Helper()
	if len(expected) != len(actual) {
		t.Errorf("%s: expected length %d, got %d", name, len(expected), len(actual))
		return
	}
	for i := range expected {
		if expected[i] != actual[i] {
			t.Errorf("%s[%d]: expected %q, got %q", name, i, expected[i], actual[i])
		}
	}
}

func assertEq[T comparable](t *testing.T, name string, expected, actual T) {
	t.Helper()
	if expected != actual {
		t.Errorf("%s: expected %v, got %v", name, expected, actual)
	}
}

func assertPtrEq[T comparable](t *testing.T, name string, expected, actual *T) {
	t.Helper()
	if expected == nil && actual == nil {
		return
	}
	if expected == nil || actual == nil {
		t.Errorf("%s: expected %v, got %v", name, expected, actual)
		return
	}
	if *expected != *actual {
		t.Errorf("%s: expected %v, got %v", name, *expected, *actual)
	}
}
