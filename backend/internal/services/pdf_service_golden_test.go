package services

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"anvayalabs-battery/internal/models"
)

func TestTextileLabelLinesMatchGolden(t *testing.T) {
	batch := &models.Batch{
		ProductType: models.ProductTypeTextile,
		ModelName:   "Premium Tee",
		Specs: models.BatchSpec{
			MaterialProfile: "Organic Cotton / Recycled Blend",
			ProductionStage: "finished_goods",
			LotSize:         "240 units",
			Manufacturer:    "Anvaya Textile Mill",
			CountryOfOrigin: "India",
			Certifications:  []string{"GOTS", "OEKO-TEX"},
		},
	}
	tenant := &models.Tenant{
		TextileFacilityType:    "Cut and sew",
		TextileSupplyChainTier: "Tier 1",
	}

	actual := strings.Join([]string{
		labelPrimaryText(batch, GetLabelTranslations("en")),
		labelDetailText(batch, nil, nil),
		labelSpecText(batch),
		strings.Join(labelTextileFooterLines(batch, tenant), "\n"),
	}, "\n")

	expected, err := os.ReadFile(filepath.Join("testdata", "textile_label_lines.golden.txt"))
	require.NoError(t, err)
	normalizedExpected := strings.ReplaceAll(string(expected), "\r\n", "\n")
	normalizedActual := strings.ReplaceAll(actual, "\r\n", "\n")
	assert.Equal(t, strings.TrimSpace(normalizedExpected), strings.TrimSpace(normalizedActual))
}