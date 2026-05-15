package models

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildPublicView_TextileMatchesGoldenJSON(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	passportID := uuid.MustParse("22222222-2222-2222-2222-222222222222")

	snapshot, err := json.Marshal(map[string]any{
		"batch_name": "Snapshot Textile Lot",
		"model_name": "Snapshot Garment",
		"product_type": ProductTypeTextile,
		"template_variant": PassportTemplateVariantTextileStandard,
		"market_region": MarketRegionEU,
		"specs": map[string]any{
			"manufacturer": "Anvaya Textile Works",
			"country_of_origin": "Italy",
			"material_profile": "Snapshot wool blend",
			"lot_size": "120 units",
			"production_stage": "garment_finishing",
		},
		"tenant": map[string]any{
			"tenant_id": tenantID.String(),
			"company_name": "Snapshot Textile Co",
			"textile_facility_type": "Dye house",
			"textile_supply_chain_tier": "Tier 2",
		},
	})
	require.NoError(t, err)

	view := BuildPublicView(&PassportWithSpecs{
		Passport: &Passport{
			UUID:            passportID,
			SerialNumber:    "TXT-0001",
			ManufactureDate: time.Date(2026, 5, 1, 0, 0, 0, 0, time.UTC),
			Status:          "ACTIVE",
			CreatedAt:       time.Date(2026, 5, 2, 0, 0, 0, 0, time.UTC),
			BatchSnapshot:   snapshot,
		},
		BatchName:    "Live Battery Batch",
		ModelName:    "Battery Pack",
		ProductType:  ProductTypeBattery,
		MarketRegion: MarketRegionIndia,
		Specs: &BatchSpec{
			Chemistry: "LFP",
		},
		Tenant: &Tenant{
			ID:          uuid.New(),
			CompanyName: "Live Battery Co",
		},
	})
	require.NotNil(t, view)

	raw, err := json.MarshalIndent(view, "", "  ")
	require.NoError(t, err)

	expected, err := os.ReadFile(filepath.Join("testdata", "textile_public_view.golden.json"))
	require.NoError(t, err)
	normalizedExpected := strings.ReplaceAll(string(expected), "\r\n", "\n")
	normalizedActual := strings.ReplaceAll(string(raw), "\r\n", "\n")
	assert.JSONEq(t, normalizedExpected, normalizedActual)
	assert.Equal(t, strings.TrimSpace(normalizedExpected), strings.TrimSpace(normalizedActual))
}