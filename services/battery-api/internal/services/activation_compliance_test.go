package services

import (
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
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

func makeBaseTenant() *models.Tenant {
	t := &models.Tenant{
		CompanyName: "TestCorp",
		Address:     "123 Main St",
	}
	t.EnsureBatteryProfile()
	t.BatteryProfile.EPRRegistrationNumber = "EPR-123"
	t.BatteryProfile.BISRNumber = "BIS-456"
	t.BatteryProfile.IECCode = "1234567890"
	t.BatteryProfile.EUAuthorizedRepresentativeName = "EU Rep"
	t.BatteryProfile.EUAuthorizedRepresentativeAddress = "EU Address"
	t.BatteryProfile.EUContactEmail = "eu@test.com"
	return t
}

func TestAISCertGate_IndiaBatchWithoutCerts(t *testing.T) {
	batch := makeBaseBatch(models.MarketRegionIndia)
	batch.Specs.BatteryCategory = models.BatteryCategoryLMT
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
	batch.Specs.BatteryCategory = models.BatteryCategoryEV
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

func TestAISCertGate_IndiaIndustrialSkipsAIS(t *testing.T) {
	batch := makeBaseBatch(models.MarketRegionIndia)
	batch.Specs.BatteryCategory = models.BatteryCategoryIndustrial
	tenant := makeBaseTenant()

	result := ValidateActivationCompliance(batch, tenant)

	for _, m := range result.Missing {
		if containsStr(m, "AIS-156") || containsStr(m, "AIS-038") {
			t.Errorf("industrial India batch should not require AIS, got: %s", m)
		}
	}
}

func TestAISCertGate_GlobalTractionRequiresAIS(t *testing.T) {
	batch := makeBaseBatch(models.MarketRegionGlobal)
	batch.Specs.BatteryCategory = models.BatteryCategoryLMT
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

func intPtr(v int) *int {
	return &v
}

func float64Ptr(v float64) *float64 {
	return &v
}
