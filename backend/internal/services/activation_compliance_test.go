package services

import (
	"testing"
	"time"

	"anvayalabs-battery/internal/models"
)

func makeBaseBatch(region models.MarketRegion) *models.Batch {
	now := time.Now()
	return &models.Batch{
		ProductType:             models.ProductTypeBattery,
		ModelName:              "TestModel",
		MarketRegion:           region,
		DomesticValueAdd:       60,
		ManufacturingStartDate: &now,
		ManufacturingEndDate:   &now,
		Specs: models.BatchSpec{
			Chemistry:  "LFP",
			Capacity:   "100 Ah",
			CellSource: "DOMESTIC",
		},
	}
}

func makeBaseTextileBatch(region models.MarketRegion) *models.Batch {
	now := time.Now()
	return &models.Batch{
		ProductType:             models.ProductTypeTextile,
		ModelName:              "TextileModel",
		MarketRegion:           region,
		ManufacturingStartDate: &now,
		ManufacturingEndDate:   &now,
		Specs: models.BatchSpec{
			Manufacturer:    "Anvaya Textiles",
			MaterialProfile: "Organic Cotton",
			CountryOfOrigin: "India",
			ProductionStage: "finished_goods",
			LotSize:         "240 units",
			HazardousSubstances: &models.HazardousSubstances{
				Declaration: "No SVHC substances above threshold",
			},
		},
	}
}

func makeBaseTenant() *models.Tenant {
	return &models.Tenant{
		CompanyName:                       "TestCorp",
		Address:                           "123 Main St",
		EPRRegistrationNumber:             "EPR-123",
		BISRNumber:                        "BIS-456",
		IECCode:                           "1234567890",
		EUAuthorizedRepresentativeName:    "EU Rep",
		EUAuthorizedRepresentativeAddress: "EU Address",
		EUContactEmail:                    "eu@test.com",
	}
}

func TestAISCertGate_IndiaBatchWithoutCerts(t *testing.T) {
	batch := makeBaseBatch(models.MarketRegionIndia)
	tenant := makeBaseTenant()

	result := ValidateActivationCompliance(batch, tenant)

	if result.Valid {
		t.Fatal("expected validation to fail for India batch without AIS certs")
	}

	foundAIS156 := false
	foundAIS038 := false
	for _, m := range result.Missing {
		if containsStr(m, "AIS-156") {
			foundAIS156 = true
		}
		if containsStr(m, "AIS-038") {
			foundAIS038 = true
		}
	}
	if !foundAIS156 {
		t.Error("expected missing field for AIS-156 certificate")
	}
	if !foundAIS038 {
		t.Error("expected missing field for AIS-038 certificate")
	}
}

func TestAISCertGate_IndiaBatchWithBothCerts(t *testing.T) {
	batch := makeBaseBatch(models.MarketRegionIndia)
	batch.Specs.Certifications = []string{"AIS-156", "AIS-038", "BIS"}
	tenant := makeBaseTenant()

	result := ValidateActivationCompliance(batch, tenant)

	for _, m := range result.Missing {
		if containsStr(m, "AIS-156") || containsStr(m, "AIS-038") {
			t.Errorf("unexpected missing AIS cert when both are provided: %s", m)
		}
	}
}

func TestAISCertGate_EUBatchSkipsAISCheck(t *testing.T) {
	batch := makeBaseBatch(models.MarketRegionEU)
	batch.Specs.Certifications = []string{"CE"} // No AIS certs — should be fine for EU
	tenant := makeBaseTenant()

	result := ValidateActivationCompliance(batch, tenant)

	for _, m := range result.Missing {
		if containsStr(m, "AIS-156") || containsStr(m, "AIS-038") {
			t.Errorf("EU batch should not require AIS certs, but got: %s", m)
		}
	}
}

func TestAISCertGate_PartialCerts(t *testing.T) {
	batch := makeBaseBatch(models.MarketRegionIndia)
	batch.Specs.Certifications = []string{"AIS-156"} // Only AIS-156, missing AIS-038
	tenant := makeBaseTenant()

	result := ValidateActivationCompliance(batch, tenant)

	foundAIS038 := false
	for _, m := range result.Missing {
		if containsStr(m, "AIS-038") {
			foundAIS038 = true
		}
		if containsStr(m, "AIS-156") {
			t.Error("AIS-156 is provided but still reported missing")
		}
	}
	if !foundAIS038 {
		t.Error("expected missing field for AIS-038 when only AIS-156 is provided")
	}
}

func TestAISCertGate_GlobalBatchRequiresAIS(t *testing.T) {
	batch := makeBaseBatch(models.MarketRegionGlobal)
	// GLOBAL runs both India + EU validation
	tenant := makeBaseTenant()

	result := ValidateActivationCompliance(batch, tenant)

	foundAIS := false
	for _, m := range result.Missing {
		if containsStr(m, "AIS-156") || containsStr(m, "AIS-038") {
			foundAIS = true
		}
	}
	if !foundAIS {
		t.Error("GLOBAL batch should require AIS certs (India path)")
	}
}

func TestTextileEUActivationDoesNotRequireBatteryFields(t *testing.T) {
	batch := makeBaseTextileBatch(models.MarketRegionEU)
	tenant := makeBaseTenant()

	result := ValidateActivationCompliance(batch, tenant)

	if !result.Valid {
		t.Fatalf("expected textile EU batch to pass activation, got missing=%v errors=%v warnings=%v", result.Missing, result.Errors, result.Warnings)
	}
	if len(result.Warnings) == 0 {
		t.Fatal("expected textile EU activation to preserve non-blocking warnings")
	}
	for _, m := range result.Missing {
		if containsStr(m, "battery_category") || containsStr(m, "carbon_footprint_result") || containsStr(m, "expected_lifetime_cycles") || containsStr(m, "warranty_months") {
			t.Errorf("textile activation should not require battery-only field: %s", m)
		}
	}
}

func TestTextileEUActivationRequiresHazardousDeclaration(t *testing.T) {
	batch := makeBaseTextileBatch(models.MarketRegionEU)
	batch.Specs.HazardousSubstances = nil
	tenant := makeBaseTenant()

	result := ValidateActivationCompliance(batch, tenant)

	if result.Valid {
		t.Fatal("expected textile EU batch without hazardous declaration to fail activation")
	}

	found := false
	for _, m := range result.Missing {
		if containsStr(m, "hazardous_substances.declaration") {
			found = true
		}
	}
	if !found {
		t.Error("expected missing hazardous substances declaration for textile EU activation")
	}
}

// helper — strings.Contains without importing "strings" again
func containsStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
