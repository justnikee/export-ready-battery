package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/anvayalabs/textile-api/internal/models"
)

func textileDocumentBatch() *models.Batch {
	return &models.Batch{
		ProductType:  models.ProductTypeTextile,
		MarketRegion: models.MarketRegionEU,
		BatchName:    "Organic Cotton Lot 24",
		ModelName:    "Crew Tee",
		Specs: models.BatchSpec{
			ManufacturerAddress: "Anvaya Textile Works",
			MaterialProfile:     "100% organic cotton",
			LotSize:             "500 units",
			ProductionStage:     "finished_goods",
		},
	}
}

func textileDocumentTenant() *models.Tenant {
	t := &models.Tenant{
		CompanyName: "Anvaya Labs Textile",
		Address:     "Surat, Gujarat, India",
	}
	t.EnsureTextileProfile()
	t.TextileProfile.FacilityType = "Cut and sew"
	t.TextileProfile.SupplyChainTier = "Tier 1"
	return t
}

func TestGenerateComplianceDeclaration_TextileSucceedsWithoutCarbonData(t *testing.T) {
	pdfBytes, err := GenerateComplianceDeclaration(textileDocumentBatch(), textileDocumentTenant())
	require.NoError(t, err)
	assert.NotEmpty(t, pdfBytes)
}

func TestGenerateDueDiligenceReport_TextileSucceeds(t *testing.T) {
	pdfBytes, err := GenerateDueDiligenceReport(textileDocumentBatch(), textileDocumentTenant())
	require.NoError(t, err)
	assert.NotEmpty(t, pdfBytes)
}
