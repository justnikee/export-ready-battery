package services

import (
	"testing"
	"time"

	"github.com/anvayalabs/textile-api/internal/models"
)

func makeBaseTextileBatch(region models.MarketRegion) *models.Batch {
	now := time.Now()
	return &models.Batch{
		ProductType:             models.ProductTypeTextile,
		ModelName:              "TextileModel",
		MarketRegion:           region,
		ManufacturingStartDate: &now,
		ManufacturingEndDate:   &now,
		Specs: models.BatchSpec{
			ManufacturerAddress: "Anvaya Textiles",
			MaterialProfile:     "Organic Cotton",
			ProductionStage:     "finished_goods",
			LotSize:             "240 units",
			GSM:                 180,
			DyeProcess:          "reactive",
			WaterUsageLiters:    150,
			EnergyUsageKWh:      25,
			ExpectedLifetimeWashes: intPtr(100),
			BiodegradablePct:    float64Ptr(0),
			FiberComposition: &models.FiberComposition{
				CottonPct: 100,
			},
			LaborCompliance: &models.LaborCompliance{
				SA8000Certified: true,
				AuditScore:      85,
				AuditDate:       "2026-01-15",
			},
			ChemicalComplianceZDHC: &models.ChemicalComplianceZDHC{
				ZDHCLevel:  "2",
				MRSLTested: true,
			},
		},
	}
}

func makeBaseTenant() *models.Tenant {
	return &models.Tenant{
		CompanyName: "TestCorp",
		Address:     "123 Main St",
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
