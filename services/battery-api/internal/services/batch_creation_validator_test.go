package services_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/anvayalabs/battery-api/internal/compliance"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/schema"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func setupBatchCreationValidator(t *testing.T) (*services.BatchCreationValidator, *repository.MockRepository) {
	mockRepo := new(repository.MockRepository)

	schemaReg := schema.NewRegistry(nil)
	schemaReg.Seed(&models.ProductSchema{
		ProductType: models.ProductTypeBattery,
		Version:     1,
		SchemaJSON: json.RawMessage(`{
			"required": ["battery_category"],
			"properties": {
				"battery_category": {"type": "string"}
			}
		}`),
	})

	complianceReg := compliance.NewRegistry()
	batchService := services.NewBatchService(schemaReg, complianceReg, mockRepo)
	validationService := services.NewValidationService()

	validator := services.NewBatchCreationValidator(batchService, validationService, mockRepo)
	return validator, mockRepo
}

func TestBatchCreationValidator(t *testing.T) {
	ctx := context.Background()
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")

	validTenant := &models.Tenant{
		ID: tenantID,
		BatteryProfile: &models.BatteryTenantProfile{
			IECCode: "AAAPL1234C",
		},
	}

	validator, _ := setupBatchCreationValidator(t)

	tests := []struct {
		name       string
		req        models.CreateBatchRequest
		tenant     *models.Tenant
		wantValid  bool
		wantFields []string
	}{
		{
			name: "Valid India DOMESTIC batch",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionIndia,
				CellSource:   "DOMESTIC",
				HSNCode:      "85076000",
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
					SalePriceINR:    1000,
					ImportCostINR:   400,
				},
			},
			tenant:    validTenant,
			wantValid: true,
		},
		{
			name: "Valid India IMPORTED batch",
			req: models.CreateBatchRequest{
				TenantID:        tenantID,
				BatchName:       "TestBatch",
				ProductType:     models.ProductTypeBattery,
				MarketRegion:    models.MarketRegionIndia,
				CellSource:      "IMPORTED",
				HSNCode:         "85076000",
				BillOfEntryNo:   "BOE123",
				CountryOfOrigin: "CN",
				DVASource:       services.DVASourceEstimated,
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
					SalePriceINR:    1000,
					ImportCostINR:   1000,
				},
			},
			tenant:    validTenant,
			wantValid: true,
		},
		{
			name: "Valid EU batch",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionEU,
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
				},
			},
			tenant:    validTenant,
			wantValid: true,
		},
		{
			name: "Valid GLOBAL batch",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionGlobal,
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
				},
			},
			tenant:    validTenant,
			wantValid: true,
		},
		{
			name: "India DOMESTIC missing DVA",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionIndia,
				CellSource:   "DOMESTIC",
				HSNCode:      "85076000",
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
					SalePriceINR:    0,
					ImportCostINR:   0,
				},
			},
			tenant:     validTenant,
			wantValid:  false,
			wantFields: []string{"domestic_value_add"},
		},
		{
			name: "India IMPORTED missing BillOfEntryNo",
			req: models.CreateBatchRequest{
				TenantID:        tenantID,
				BatchName:       "TestBatch",
				ProductType:     models.ProductTypeBattery,
				MarketRegion:    models.MarketRegionIndia,
				CellSource:      "IMPORTED",
				HSNCode:         "85076000",
				CountryOfOrigin: "CN",
				DVASource:       services.DVASourceEstimated,
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
				},
			},
			tenant:     validTenant,
			wantValid:  false,
			wantFields: []string{"bill_of_entry_no"},
		},
		{
			name: "India IMPORTED with PLICompliant=true",
			req: models.CreateBatchRequest{
				TenantID:        tenantID,
				BatchName:       "TestBatch",
				ProductType:     models.ProductTypeBattery,
				MarketRegion:    models.MarketRegionIndia,
				CellSource:      "IMPORTED",
				HSNCode:         "85076000",
				BillOfEntryNo:   "BOE123",
				CountryOfOrigin: "CN",
				DVASource:       services.DVASourceEstimated,
				PLICompliant:    true,
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
				},
			},
			tenant:     validTenant,
			wantValid:  false,
			wantFields: []string{"pli_compliant"},
		},
		{
			name: "EU missing battery_category",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionEU,
				Specs:        models.BatchSpec{}, // battery_category omitted
			},
			tenant:     validTenant,
			wantValid:  false,
			wantFields: []string{"battery_category"},
		},
		{
			name: "Invalid market region",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: "INVALID",
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
				},
			},
			tenant:     validTenant,
			wantValid:  false,
			wantFields: []string{"market_region"},
		},
		{
			name: "End date before start date",
			req: models.CreateBatchRequest{
				TenantID:               tenantID,
				BatchName:              "TestBatch",
				ProductType:            models.ProductTypeBattery,
				MarketRegion:           models.MarketRegionGlobal,
				ManufacturingStartDate: "2024-06-15",
				ManufacturingEndDate:   "2024-06-10",
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
				},
			},
			tenant:     validTenant,
			wantValid:  false,
			wantFields: []string{"manufacturing_end_date"},
		},
		{
			name: "Cross-market: EU batch with empty India fields should be VALID",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionEU,
				CellSource:   "",
				HSNCode:      "",
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
				},
			},
			tenant:    validTenant,
			wantValid: true,
		},
		{
			name: "Cross-market: India batch with empty EU fields should be VALID",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionIndia,
				CellSource:   "DOMESTIC",
				HSNCode:      "85076000",
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
					SalePriceINR:    1000,
					ImportCostINR:   400,
				},
			},
			tenant:    validTenant,
			wantValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.Validate(ctx, tt.req, tt.tenant)

			if tt.wantValid {
				assert.True(t, result.Valid, "expected valid but got errors: %+v", result.Errors)
				assert.Empty(t, result.Errors)
			} else {
				assert.False(t, result.Valid, "expected invalid but got valid")
				errorFields := make([]string, len(result.Errors))
				for i, e := range result.Errors {
					errorFields[i] = e.Field
				}
				for _, field := range tt.wantFields {
					assert.Contains(t, errorFields, field, "expected error for field %q", field)
				}
			}
		})
	}
}
