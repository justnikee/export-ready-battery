package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"exportready-battery/internal/models"
	"exportready-battery/internal/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

// ============================================================================
// BILLING HANDLER TESTS — ActivateBatch
// POST /api/v1/billing/activate/:id
// ============================================================================

func validBillingBatch(tenantID uuid.UUID) *models.Batch {
	mfgStart := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	mfgEnd := time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)
	return &models.Batch{
		ID:                     uuid.New(),
		TenantID:               tenantID,
		BatchName:              "Test Activation Batch",
		ModelName:              "ER-200",
		Status:                 models.BatchStatusDraft,
		MarketRegion:           models.MarketRegionIndia,
		ManufacturingStartDate: &mfgStart,
		ManufacturingEndDate:   &mfgEnd,
		CellSource:             "DOMESTIC",
		DomesticValueAdd:       60.0,
		Specs: models.BatchSpec{
			Chemistry:      "LFP",
			Capacity:       "100Ah",
			Certifications: []string{"AIS-156", "AIS-038", "BIS"},
		},
	}
}

func validBillingTenant(tenantID uuid.UUID) *models.Tenant {
	return &models.Tenant{
		ID:                    tenantID,
		CompanyName:           "Test Battery Co",
		EPRRegistrationNumber: "EPR/WP/2024/00001",
		BISRNumber:            "R-12345678",
		IECCode:               "IEC0123456",
		MorthManufacturerCode: "TBC",
	}
}

func activateBatchReq(batchID uuid.UUID, tenantID uuid.UUID) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/billing/activate/"+batchID.String(), nil)
	req.SetPathValue("id", batchID.String())
	return setAuthContext(req, tenantID, "admin@test.com")
}

// --- No auth ---

func TestActivateBatch_NoAuth(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	batchID := uuid.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/billing/activate/"+batchID.String(), nil)
	req.SetPathValue("id", batchID.String())
	// no auth context

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}

// --- Invalid batch ID ---

func TestActivateBatch_InvalidBatchID(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/billing/activate/not-a-uuid", nil)
	req.SetPathValue("id", "not-a-uuid")
	req = setAuthContext(req, tenantID, "admin@test.com")

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

// --- Batch not found ---

func TestActivateBatch_BatchNotFound(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()
	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(nil, errors.New("not found"))

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, activateBatchReq(batchID, tenantID))

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}

// --- Wrong tenant ---

func TestActivateBatch_WrongTenant(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	otherTenantID := uuid.New()
	batchID := uuid.New()

	batch := validBillingBatch(otherTenantID) // belongs to different tenant
	batch.ID = batchID
	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, activateBatchReq(batchID, tenantID))

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}

// --- Already active ---

func TestActivateBatch_AlreadyActive(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()

	batch := validBillingBatch(tenantID)
	batch.ID = batchID
	batch.Status = models.BatchStatusActive
	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, activateBatchReq(batchID, tenantID))

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["error"] != "Batch is already active" {
		t.Errorf("expected 'Batch is already active', got %v", resp["error"])
	}
	mockRepo.AssertExpectations(t)
}

// --- Compliance blocked ---

func TestActivateBatch_ComplianceBlocked(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()

	batch := validBillingBatch(tenantID)
	batch.ID = batchID
	batch.Specs.Certifications = []string{"BIS"} // missing AIS-156 and AIS-038
	tenant := validBillingTenant(tenantID)

	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, activateBatchReq(batchID, tenantID))

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["missing"] == nil {
		t.Error("expected 'missing' list in response body")
	}
	mockRepo.AssertExpectations(t)
}

// --- Insufficient quota ---

func TestActivateBatch_InsufficientQuota(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batchID := uuid.New()

	batch := validBillingBatch(tenantID)
	batch.ID = batchID
	tenant := validBillingTenant(tenantID)

	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(0, nil)

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, activateBatchReq(batchID, tenantID))

	if rr.Code != http.StatusPaymentRequired {
		t.Fatalf("expected 402, got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}

// --- Success ---

func TestActivateBatch_Success(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batch := validBillingBatch(tenantID)
	batchID := batch.ID
	tenant := validBillingTenant(tenantID)

	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(5, nil)
	mockRepo.On("DeductQuota", mock.Anything, tenantID).Return(nil)
	mockRepo.On("SetBatchStatus", mock.Anything, batchID, models.BatchStatusActive).Return(nil)
	mockRepo.On("CreateTransaction", mock.Anything, mock.AnythingOfType("*models.Transaction")).Return(nil)

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, activateBatchReq(batchID, tenantID))

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp["message"] != "Batch activated successfully" {
		t.Errorf("expected success message, got %v", resp["message"])
	}
	if resp["quota_balance"] != float64(4) {
		t.Errorf("expected quota_balance=4, got %v", resp["quota_balance"])
	}
	mockRepo.AssertExpectations(t)
}

// --- Quota refund on SetBatchStatus failure (edge case) ---

func TestActivateBatch_QuotaRefundOnActivationFailure(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batch := validBillingBatch(tenantID)
	batchID := batch.ID
	tenant := validBillingTenant(tenantID)

	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(3, nil)
	mockRepo.On("DeductQuota", mock.Anything, tenantID).Return(nil)
	mockRepo.On("SetBatchStatus", mock.Anything, batchID, models.BatchStatusActive).Return(errors.New("db error"))
	mockRepo.On("AddQuota", mock.Anything, tenantID, 1).Return(nil) // quota refund

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, activateBatchReq(batchID, tenantID))

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}

// --- Transaction failure is non-fatal (edge case) ---

func TestActivateBatch_TransactionLogFailureIsNonFatal(t *testing.T) {
	mockRepo := new(repository.MockRepository)
	handler := newTestHandler(mockRepo)

	tenantID := uuid.New()
	batch := validBillingBatch(tenantID)
	batchID := batch.ID
	tenant := validBillingTenant(tenantID)

	mockRepo.On("GetBatch", mock.Anything, batchID, tenantID).Return(batch, nil)
	mockRepo.On("GetTenant", mock.Anything, tenantID).Return(tenant, nil)
	mockRepo.On("GetQuotaBalance", mock.Anything, tenantID).Return(2, nil)
	mockRepo.On("DeductQuota", mock.Anything, tenantID).Return(nil)
	mockRepo.On("SetBatchStatus", mock.Anything, batchID, models.BatchStatusActive).Return(nil)
	mockRepo.On("CreateTransaction", mock.Anything, mock.AnythingOfType("*models.Transaction")).
		Return(errors.New("transaction log failed")) // non-fatal

	rr := httptest.NewRecorder()
	handler.ActivateBatch(rr, activateBatchReq(batchID, tenantID))

	// Should still return 200 — transaction logging is non-critical
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 (transaction failure is non-fatal), got %d: %s", rr.Code, rr.Body.String())
	}
	mockRepo.AssertExpectations(t)
}
