package textile_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"anvayalabs-battery/internal/compliance/textile"
	"anvayalabs-battery/internal/models"
)

func TestIndiaValidator_ValidBatch_Passes(t *testing.T) {
	batch := validTextileBatch()
	batch.MarketRegion = models.MarketRegionIndia

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.True(t, result.Valid)
	assert.InDelta(t, 100.0, result.Score, 1.0)
}

func TestIndiaValidator_MissingOrigin_Fails(t *testing.T) {
	batch := validTextileBatch()
	batch.MarketRegion = models.MarketRegionIndia
	batch.Specs.CountryOfOrigin = ""

	v := textile.NewIndiaValidator()
	result, err := v.ValidateBatch(batch, validTextileTenant())
	require.NoError(t, err)
	assert.False(t, result.Valid)
	assert.Contains(t, result.Missing, "batch.specs.country_of_origin")
}