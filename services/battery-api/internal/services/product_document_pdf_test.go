package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/anvayalabs/battery-api/internal/models"
)

func TestGenerateComplianceDeclaration_BatteryStillRequiresCarbonData(t *testing.T) {
	batch := &models.Batch{ProductType: models.ProductTypeBattery}
	_, err := GenerateComplianceDeclaration(batch, &models.Tenant{})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no carbon footprint result")
}
