package services_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
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

	// Mirrors services/battery-api/internal/schema/seeds/battery_v1.json: production does
	// NOT require battery_category at the generic product-schema level — EU enforcement is
	// a hardcoded check in BatchCreationValidator.Validate (see "10b" in batch_creation_validator.go).
	schemaReg := schema.NewRegistry(nil)
	schemaReg.Seed(&models.ProductSchema{
		ProductType: models.ProductTypeBattery,
		Version:     1,
		SchemaJSON: json.RawMessage(`{
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
				CustomsDate:     "2024-03-01",
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
			// Cost breakdown sums to exactly 50% domestic value (300+100+50+50)/1000.
			// Must take precedence over the legacy ImportCostINR shortcut (which
			// would otherwise compute (1000-1000)/1000 = 0% and fail PLI).
			name: "PLI via cost breakdown at exactly 50% — should pass",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionIndia,
				CellSource:   "DOMESTIC",
				HSNCode:      "85076000",
				PLICompliant: true,
				Specs: models.BatchSpec{
					BatteryCategory:       models.BatteryCategoryEV,
					SalePriceINR:          1000,
					ImportCostINR:         1000, // legacy field present but must be ignored
					CellCostDomesticINR:   300,
					CellCostImportedINR:   200,
					BMSCostDomesticINR:    100,
					BMSCostImportedINR:    50,
					CasingCostDomesticINR: 50,
					LabourOverheadCostINR: 50,
				},
			},
			tenant:    validTenant,
			wantValid: true,
		},
		{
			// Cost breakdown sums to 40% domestic value — below the 50% PLI floor.
			name: "PLI via cost breakdown below 50% — should fail",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionIndia,
				CellSource:   "DOMESTIC",
				HSNCode:      "85076000",
				PLICompliant: true,
				Specs: models.BatchSpec{
					BatteryCategory:       models.BatteryCategoryEV,
					SalePriceINR:          1000,
					CellCostDomesticINR:   250,
					BMSCostDomesticINR:    80,
					CasingCostDomesticINR: 40,
					LabourOverheadCostINR: 30,
				},
			},
			tenant:     validTenant,
			wantValid:  false,
			wantFields: []string{"pli_compliant"},
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
			tenant:    validTenant,
			wantValid: true,
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
			tenant:    validTenant,
			wantValid: true,
		},
		{
			name: "India IMPORTED missing CountryOfOrigin",
			req: models.CreateBatchRequest{
				TenantID:      tenantID,
				BatchName:     "TestBatch",
				ProductType:   models.ProductTypeBattery,
				MarketRegion:  models.MarketRegionIndia,
				CellSource:    "IMPORTED",
				HSNCode:       "85076000",
				BillOfEntryNo: "BOE123",
				DVASource:     services.DVASourceEstimated,
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryEV,
				},
			},
			tenant:    validTenant,
			wantValid: true,
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
			name: "India empty HSN allowed at create",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionIndia,
				CellSource:   "DOMESTIC",
				HSNCode:      "",
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryIndustrial,
				},
			},
			tenant:    validTenant,
			wantValid: true,
		},
		{
			name: "India invalid HSN still rejected at create",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionIndia,
				CellSource:   "DOMESTIC",
				HSNCode:      "12345678",
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryIndustrial,
				},
			},
			tenant:     validTenant,
			wantValid:  false,
			wantFields: []string{"hsn_code"},
		},
		{
			name: "India IMPORTED without tenant IEC allowed at create",
			req: models.CreateBatchRequest{
				TenantID:     tenantID,
				BatchName:    "TestBatch",
				ProductType:  models.ProductTypeBattery,
				MarketRegion: models.MarketRegionIndia,
				CellSource:   "IMPORTED",
				DVASource:    services.DVASourceEstimated,
				Specs: models.BatchSpec{
					BatteryCategory: models.BatteryCategoryIndustrial,
				},
			},
			tenant:    &models.Tenant{ID: tenantID},
			wantValid: true,
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

// TestBatchCreationValidatorSharedFixtures runs the cross-stack fixture set in
// test-fixtures/batch-validation-fixtures.json — the same cases are run against
// the frontend's batchFormSchema in batch-form-schema.test.ts. The fixtures are
// the source of truth for HSN-prefix, DVA>0%, PLI>=50%, IMPORTED-required-field,
// AUDITED-required-field and date-ordering rules; if one validator drifts from
// the other, this test (or its frontend counterpart) catches it.
func TestBatchCreationValidatorSharedFixtures(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("..", "..", "..", "..", "test-fixtures", "batch-validation-fixtures.json"))
	if err != nil {
		t.Fatalf("failed to read shared fixtures: %v", err)
	}

	var fixtureFile struct {
		Cases []struct {
			Name                   string   `json:"name"`
			MarketRegion           string   `json:"marketRegion"`
			CellSource             string   `json:"cellSource"`
			HSNCode                string   `json:"hsnCode"`
			SalePrice              float64  `json:"salePrice"`
			CellCostDomestic       float64  `json:"cellCostDomestic"`
			CellCostImported       float64  `json:"cellCostImported"`
			PLICompliant           bool     `json:"pliCompliant"`
			DVASource              string   `json:"dvaSource"`
			AuditedDva             *float64 `json:"auditedDva"`
			UploadedFileURL        string   `json:"uploadedFileUrl"`
			BatteryCategory        string   `json:"batteryCategory"`
			BillOfEntryNo          string   `json:"billOfEntryNo"`
			CellCountryOfOrigin    string   `json:"cellCountryOfOrigin"`
			CustomsDate            string   `json:"customsDate"`
			ManufacturingStartDate string   `json:"manufacturingStartDate"`
			ManufacturingEndDate   string   `json:"manufacturingEndDate"`
			ExpectValid            bool     `json:"expectValid"`
			ExpectErrors           []struct {
				Go string `json:"go"`
				TS string `json:"ts"`
			} `json:"expectErrors"`
		} `json:"cases"`
	}
	if err := json.Unmarshal(data, &fixtureFile); err != nil {
		t.Fatalf("failed to parse shared fixtures: %v", err)
	}

	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	tenant := &models.Tenant{
		ID:             tenantID,
		BatteryProfile: &models.BatteryTenantProfile{IECCode: "AAAPL1234C"},
	}
	validator, _ := setupBatchCreationValidator(t)

	for _, tc := range fixtureFile.Cases {
		t.Run(tc.Name, func(t *testing.T) {
			// Fixtures default to a valid battery category since it's irrelevant to the
			// India-market rules most cases exercise; cases testing EU's battery_category
			// requirement set batteryCategory explicitly (including "" for "missing").
			batteryCategory := models.BatteryCategoryEV
			if tc.BatteryCategory != "" {
				batteryCategory = models.BatteryCategory(tc.BatteryCategory)
			} else if tc.MarketRegion == "EU" {
				batteryCategory = ""
			}

			req := models.CreateBatchRequest{
				TenantID:                tenantID,
				BatchName:               "TestBatch",
				ProductType:             models.ProductTypeBattery,
				MarketRegion:            models.MarketRegion(tc.MarketRegion),
				CellSource:              tc.CellSource,
				HSNCode:                 tc.HSNCode,
				BillOfEntryNo:           tc.BillOfEntryNo,
				CountryOfOrigin:         tc.CellCountryOfOrigin,
				CustomsDate:             tc.CustomsDate,
				DVASource:               tc.DVASource,
				PLICompliant:            tc.PLICompliant,
				AuditedDomesticValueAdd: tc.AuditedDva,
				PLICertificateURL:       tc.UploadedFileURL,
				ManufacturingStartDate:  tc.ManufacturingStartDate,
				ManufacturingEndDate:    tc.ManufacturingEndDate,
				Specs: models.BatchSpec{
					BatteryCategory:     batteryCategory,
					SalePriceINR:        tc.SalePrice,
					CellCostDomesticINR: tc.CellCostDomestic,
					CellCostImportedINR: tc.CellCostImported,
				},
			}

			result := validator.Validate(context.Background(), req, tenant)

			if tc.ExpectValid {
				assert.True(t, result.Valid, "expected valid but got errors: %+v", result.Errors)
				return
			}

			assert.False(t, result.Valid, "expected invalid but got valid")
			errorFields := make([]string, len(result.Errors))
			for i, e := range result.Errors {
				errorFields[i] = e.Field
			}
			for _, expected := range tc.ExpectErrors {
				assert.Contains(t, errorFields, expected.Go, "expected error for field %q", expected.Go)
			}
		})
	}
}
