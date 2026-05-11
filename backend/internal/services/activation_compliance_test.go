package services

import (
	"testing"
	"time"

	"anvayalabs-battery/internal/models"
)

func makeBaseBatch(region models.MarketRegion) *models.Batch {
	now := time.Now()
	return &models.Batch{
		ModelName:              "TestModel",
		MarketRegion:           region,
		CellSource:             "DOMESTIC",
		DomesticValueAdd:       60,
		ManufacturingStartDate: &now,
		ManufacturingEndDate:   &now,
		Specs: models.BatchSpec{
			Chemistry: "LFP",
			Capacity:  "100 Ah",
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

// helper — strings.Contains without importing "strings" again
func containsStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
