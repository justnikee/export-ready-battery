package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/anvayalabs/textile-api/internal/models"
	"github.com/anvayalabs/textile-api/internal/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// ============================================================================
// PRODUCT-AWARE DTO VALIDATION TESTS
// ============================================================================

// TestCreateBatch_ProductMismatch verifies that a JWT-authorized battery tenant
// cannot create a batch with product_type=TEXTILE in the request body.
func TestCreateBatch_ProductMismatch(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()

	body := `{
		"tenant_id": "` + tenantID.String() + `",
		"batch_name": "Mixed Product Batch",
		"product_type": "TEXTILE",
		"market_region": "INDIA",
		"specs": {
			"material_profile": "100% organic cotton",
			"manufacturer": "Anvaya Mills"
		}
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "admin@test.com", models.ProductTypeElectronics)

	rr := httptest.NewRecorder()
	handler.CreateBatch(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !strings.Contains(resp["error"], "product_type mismatch") {
		t.Errorf("expected 'product_type mismatch' error, got %q", resp["error"])
	}
}

// TestCreateBatch_UnknownProductType verifies that creating a batch with an
// unrecognized product_type returns 400.
func TestCreateBatch_UnknownProductType(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()

	body := `{
		"tenant_id": "` + tenantID.String() + `",
		"batch_name": "Unknown Product Batch",
		"product_type": "INVALIDPRODUCT",
		"market_region": "GLOBAL",
		"specs": {
			"chemistry": "LFP"
		}
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/batches", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "admin@test.com", models.ProductTypeTextile)

	rr := httptest.NewRecorder()
	handler.CreateBatch(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !strings.Contains(resp["error"], "unknown or unsupported product_type") {
		t.Errorf("expected 'unknown or unsupported product_type' error, got %q", resp["error"])
	}
}

// TestUpdateProfile_MixedFields verifies that the embedded struct design of
// UpdateProfileRequest allows both battery and textile fields to coexist in
// the same payload. The decoder populates both promoted structs independently.
func TestUpdateProfile_MixedFields(t *testing.T) {
	payload := map[string]interface{}{
		"company_name":    "Mixed Fields Corp",
		"address":         "123 Hybrid Lane",
		"bis_r_number":    "R-87654321",
		"iec_code":        "IEC9876543",
		"textile_facility_type": "dyeing_unit",
		"textile_supply_chain_tier": "tier_2",
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("failed to marshal payload: %v", err)
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(bytes.NewReader(jsonBody)).Decode(&req); err != nil {
		t.Fatalf("failed to decode UpdateProfileRequest: %v", err)
	}

	// Base fields
	if req.CompanyName != "Mixed Fields Corp" {
		t.Errorf("expected CompanyName 'Mixed Fields Corp', got %q", req.CompanyName)
	}
	if req.Address != "123 Hybrid Lane" {
		t.Errorf("expected Address '123 Hybrid Lane', got %q", req.Address)
	}

	// Battery-specific fields (embedded via *BatteryProfileUpdate)
	if req.BatteryProfileUpdate == nil {
		t.Fatal("expected BatteryProfileUpdate to be populated")
	}
	if req.BatteryProfileUpdate.BISRNumber != "R-87654321" {
		t.Errorf("expected BISRNumber 'R-87654321', got %q", req.BatteryProfileUpdate.BISRNumber)
	}
	if req.BatteryProfileUpdate.IECCode != "IEC9876543" {
		t.Errorf("expected IECCode 'IEC9876543', got %q", req.BatteryProfileUpdate.IECCode)
	}

	// Textile-specific fields (embedded via *TextileProfileUpdate)
	if req.TextileProfileUpdate == nil {
		t.Fatal("expected TextileProfileUpdate to be populated")
	}
	if req.TextileProfileUpdate.TextileFacilityType != "dyeing_unit" {
		t.Errorf("expected TextileFacilityType 'dyeing_unit', got %q", req.TextileProfileUpdate.TextileFacilityType)
	}
	if req.TextileProfileUpdate.TextileSupplyChainTier != "tier_2" {
		t.Errorf("expected TextileSupplyChainTier 'tier_2', got %q", req.TextileProfileUpdate.TextileSupplyChainTier)
	}
}

// TestGetBatch_CrossProductAccess verifies that a battery tenant cannot
// retrieve a textile batch by direct ID (cross-product IDOR protection).
func TestGetBatch_CrossProductAccess(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()

	// The batch exists but belongs to TEXTILE product type
	batch := &models.Batch{
		ID:          batchID,
		TenantID:    tenantID,
		BatchName:   "Textile Lot",
		ProductType: models.ProductTypeTextile,
		Status:      models.BatchStatusDraft,
	}

	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/batches/"+batchID.String(), nil)
	req.SetPathValue("id", batchID.String())
	req = setAuthContext(req, tenantID, "admin@test.com", models.ProductTypeElectronics)

	rr := httptest.NewRecorder()
	handler.GetBatch(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !strings.Contains(resp["error"], "product_type mismatch") {
		t.Errorf("expected 'product_type mismatch' error, got %q", resp["error"])
	}

	mockRepo.AssertExpectations(t)
}
