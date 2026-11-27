package handlers

import (
	"bytes"
	"context"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestBulkImportBatchesAllowsMissingOptionalColumns(t *testing.T) {
	for _, tt := range []struct {
		name, headerSuffix, rowSuffix string
	}{
		{name: "explicit market", headerSuffix: ",market_region", rowSuffix: ",INDIA"},
		{name: "default market"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			tenantID := uuid.New()
			repo := new(repository.MockRepository)
			repo.On("GetTenant", mock.Anything, tenantID).Return(&models.Tenant{}, nil).Once()
			repo.On("CreateBatch", mock.Anything, mock.MatchedBy(func(req repository.CreateBatchRequest) bool {
				return req.TenantID == tenantID && req.BatchName == "Assembly A" && req.ModelName == "Pack 48" &&
					req.MarketRegion == models.MarketRegionIndia && req.Specs.Chemistry == "LFP" && req.Specs.CountryOfOrigin == "IN" &&
					req.Specs.CustomsDate == "" && req.Specs.BillOfEntryNo == "" && req.Specs.Manufacturer == "" &&
					req.ManufacturingStartDate == nil && req.Specs.BMSCostDomesticINR == 0
			})).Return(&models.Batch{}, nil).Once()
			h := &Handler{repo: repo, validationService: services.NewValidationService()}

			var body bytes.Buffer
			form := multipart.NewWriter(&body)
			part, err := form.CreateFormFile("file", "batches.csv")
			require.NoError(t, err)
			_, err = io.WriteString(part, "batch_name,model_name,chemistry,capacity,cell_source,hsn_code,sale_price_inr,cell_cost_domestic_inr,country_of_origin"+tt.headerSuffix+
				"\nAssembly A,Pack 48,LFP,30 Ah,DOMESTIC,85076000,10000,6000,IN"+tt.rowSuffix+"\n")
			require.NoError(t, err)
			require.NoError(t, form.Close())
			req := httptest.NewRequest(http.MethodPost, "/api/v1/batches/bulk-import", &body)
			req.Header.Set("Content-Type", form.FormDataContentType())
			ctx := context.WithValue(req.Context(), middleware.TenantIDKey, tenantID.String())
			ctx = context.WithValue(ctx, middleware.ProductTypeKey, string(models.ProductTypeBattery))
			res := httptest.NewRecorder()
			h.BulkImportBatches(res, req.WithContext(ctx))
			require.Equal(t, http.StatusOK, res.Code, res.Body.String())
			require.JSONEq(t, `{"total":1,"created":1,"failed":0,"errors":[]}`, res.Body.String())
			repo.AssertExpectations(t)
		})
	}
}
