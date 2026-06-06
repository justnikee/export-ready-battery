package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

// ============================================================================
// FAKE MASS BALANCE REPO
// ============================================================================

type fakeMassBalanceRepo struct {
	fakeTeamRepo
	ledgers     map[uuid.UUID]*models.MassBalanceLedger
	allocations map[uuid.UUID]*models.MassBalanceAllocation
}

func newFakeMassBalanceRepo() *fakeMassBalanceRepo {
	return &fakeMassBalanceRepo{
		fakeTeamRepo: *newFakeTeamRepo(),
		ledgers:      make(map[uuid.UUID]*models.MassBalanceLedger),
		allocations:  make(map[uuid.UUID]*models.MassBalanceAllocation),
	}
}

func (f *fakeMassBalanceRepo) CreateMassBalanceLedger(ctx context.Context, ledger *models.MassBalanceLedger) error {
	f.ledgers[ledger.ID] = ledger
	return nil
}

func (f *fakeMassBalanceRepo) GetMassBalanceLedgersByTenant(ctx context.Context, tenantID uuid.UUID, materialType string) ([]*models.MassBalanceLedger, error) {
	var result []*models.MassBalanceLedger
	for _, l := range f.ledgers {
		if l.TenantID == tenantID {
			if materialType == "" || l.MaterialType == materialType {
				result = append(result, l)
			}
		}
	}
	return result, nil
}

func (f *fakeMassBalanceRepo) GetMassBalanceLedgerByID(ctx context.Context, id uuid.UUID) (*models.MassBalanceLedger, error) {
	if l, ok := f.ledgers[id]; ok {
		return l, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeMassBalanceRepo) UpdateMassBalanceLedger(ctx context.Context, id uuid.UUID, incomingDelta, allocatedDelta float64) error {
	l, ok := f.ledgers[id]
	if !ok {
		return errors.New("not found")
	}
	newBalance := l.BalanceKg + incomingDelta - allocatedDelta
	if newBalance < 0 {
		return errors.New("insufficient balance: allocation would exceed available mass balance")
	}
	l.IncomingKg += incomingDelta
	l.AllocatedKg += allocatedDelta
	l.BalanceKg = newBalance
	return nil
}

func (f *fakeMassBalanceRepo) CreateMassBalanceAllocation(ctx context.Context, allocation *models.MassBalanceAllocation) error {
	f.allocations[allocation.ID] = allocation
	return nil
}

func (f *fakeMassBalanceRepo) GetMassBalanceAllocationsByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.MassBalanceAllocation, error) {
	var result []*models.MassBalanceAllocation
	for _, a := range f.allocations {
		if a.BatchID == batchID {
			result = append(result, a)
		}
	}
	return result, nil
}
func (f *fakeMassBalanceRepo) CreateRegistryVerification(ctx context.Context, v *models.RegistryVerification) error { return nil }
func (f *fakeMassBalanceRepo) GetRegistryVerificationsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryVerification, error) { return nil, nil }
func (f *fakeMassBalanceRepo) GetRegistryVerificationByBatchAndType(ctx context.Context, batchID uuid.UUID, registryType string, certificateNo string) (*models.RegistryVerification, error) { return nil, nil }
func (f *fakeMassBalanceRepo) DeleteExpiredRegistryVerifications(ctx context.Context) (int64, error) { return 0, nil }
func (f *fakeMassBalanceRepo) CreateRegistryJob(ctx context.Context, j *models.RegistryJob) error { return nil }
func (f *fakeMassBalanceRepo) GetPendingRegistryJobs(ctx context.Context, limit int) ([]models.RegistryJob, error) { return nil, nil }
func (f *fakeMassBalanceRepo) GetRegistryJobByID(ctx context.Context, id uuid.UUID) (*models.RegistryJob, error) { return nil, nil }
func (f *fakeMassBalanceRepo) GetRegistryJobsByBatch(ctx context.Context, batchID uuid.UUID) ([]models.RegistryJob, error) { return nil, nil }
func (f *fakeMassBalanceRepo) UpdateRegistryJobStatus(ctx context.Context, id uuid.UUID, status string, attemptCount int, nextAttemptAt *time.Time, resultStatus, resultTrustTier, resultID, errorMessage string) error { return nil }
func (f *fakeMassBalanceRepo) CreateRegistryAuditLog(ctx context.Context, a *models.RegistryAuditLog) error { return nil }
func (f *fakeMassBalanceRepo) GetRegistryAuditLogsByCertificate(ctx context.Context, registryType, certificateNo string) ([]models.RegistryAuditLog, error) { return nil, nil }
func (f *fakeMassBalanceRepo) GetRegistryAuditLogsByJob(ctx context.Context, jobID uuid.UUID) ([]models.RegistryAuditLog, error) { return nil, nil }
func (f *fakeMassBalanceRepo) GetComplianceDeadlines(ctx context.Context, productType, marketRegion string) ([]*models.ComplianceDeadline, error) { return nil, nil }

// ============================================================================
// TESTS
// ============================================================================

func TestCreateMassBalanceLedger_Success(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	handler := newTeamHandler(repo)

	body, _ := json.Marshal(map[string]interface{}{
		"material_type":   "cobalt",
		"incoming_kg":     1000.5,
		"incoming_source": "ISCC-Cert-12345",
		"notes":           "Q1 recycled cobalt",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/mass-balance/ledgers", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.CreateMassBalanceLedger(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.MassBalanceLedger
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.MaterialType != "cobalt" {
		t.Errorf("expected cobalt, got %s", resp.MaterialType)
	}
	if resp.IncomingKg != 1000.5 {
		t.Errorf("expected 1000.5 incoming, got %f", resp.IncomingKg)
	}
	if resp.BalanceKg != 1000.5 {
		t.Errorf("expected balance = incoming, got %f", resp.BalanceKg)
	}
	if resp.TenantID != tenantID {
		t.Errorf("expected tenant match")
	}
}

func TestCreateMassBalanceLedger_InvalidMaterial(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	handler := newTeamHandler(repo)

	body, _ := json.Marshal(map[string]interface{}{
		"material_type": "plutonium",
		"incoming_kg":   100,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/mass-balance/ledgers", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.CreateMassBalanceLedger(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestListMassBalanceLedgers_Success(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	// Seed two ledgers
	repo.CreateMassBalanceLedger(context.Background(), &models.MassBalanceLedger{
		ID: uuid.New(), TenantID: tenantID, MaterialType: "cobalt", IncomingKg: 100, BalanceKg: 100,
	})
	repo.CreateMassBalanceLedger(context.Background(), &models.MassBalanceLedger{
		ID: uuid.New(), TenantID: tenantID, MaterialType: "lithium", IncomingKg: 200, BalanceKg: 200,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/mass-balance/ledgers", nil)
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ListMassBalanceLedgers(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if int(resp["count"].(float64)) != 2 {
		t.Errorf("expected 2 ledgers, got %v", resp["count"])
	}
}

func TestGetMassBalanceLedger_Success(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	ledgerID := uuid.New()
	repo.ledgers[ledgerID] = &models.MassBalanceLedger{
		ID: ledgerID, TenantID: tenantID, MaterialType: "nickel", IncomingKg: 500, BalanceKg: 500,
	}

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/mass-balance/ledgers/"+ledgerID.String(), nil)
	req.SetPathValue("id", ledgerID.String())
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.GetMassBalanceLedger(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.MassBalanceLedger
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp.MaterialType != "nickel" {
		t.Errorf("expected nickel, got %s", resp.MaterialType)
	}
}

func TestUpdateMassBalanceLedger_Success(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	ledgerID := uuid.New()
	repo.ledgers[ledgerID] = &models.MassBalanceLedger{
		ID: ledgerID, TenantID: tenantID, MaterialType: "cobalt",
		IncomingKg: 1000, AllocatedKg: 200, BalanceKg: 800,
	}

	handler := newTeamHandler(repo)

	body, _ := json.Marshal(map[string]interface{}{
		"incoming_delta":  100,
		"allocated_delta": 50,
	})
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/mass-balance/ledgers/"+ledgerID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", ledgerID.String())
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.UpdateMassBalanceLedger(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.MassBalanceLedger
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp.BalanceKg != 850 {
		t.Errorf("expected balance 850, got %f", resp.BalanceKg)
	}
}

func TestUpdateMassBalanceLedger_InsufficientBalance(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	ledgerID := uuid.New()
	repo.ledgers[ledgerID] = &models.MassBalanceLedger{
		ID: ledgerID, TenantID: tenantID, MaterialType: "cobalt",
		IncomingKg: 100, AllocatedKg: 0, BalanceKg: 100,
	}

	handler := newTeamHandler(repo)

	body, _ := json.Marshal(map[string]interface{}{
		"incoming_delta":  0,
		"allocated_delta": 200,
	})
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/mass-balance/ledgers/"+ledgerID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", ledgerID.String())
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.UpdateMassBalanceLedger(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestCreateMassBalanceAllocation_Success(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	ledgerID := uuid.New()
	repo.ledgers[ledgerID] = &models.MassBalanceLedger{
		ID: ledgerID, TenantID: tenantID, MaterialType: "lithium",
		IncomingKg: 500, AllocatedKg: 0, BalanceKg: 500,
	}

	batchID := uuid.New()
	handler := newTeamHandler(repo)

	body, _ := json.Marshal(map[string]interface{}{
		"ledger_id":     ledgerID.String(),
		"batch_id":      batchID.String(),
		"material_type": "lithium",
		"allocated_kg":  150.5,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/mass-balance/allocations", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.CreateMassBalanceAllocation(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.MassBalanceAllocation
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp.AllocatedKg != 150.5 {
		t.Errorf("expected 150.5, got %f", resp.AllocatedKg)
	}

	// Verify ledger balance was decremented
	updatedLedger := repo.ledgers[ledgerID]
	if updatedLedger.BalanceKg != 349.5 {
		t.Errorf("expected ledger balance 349.5, got %f", updatedLedger.BalanceKg)
	}
}

func TestCreateMassBalanceAllocation_InsufficientBalance(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	ledgerID := uuid.New()
	repo.ledgers[ledgerID] = &models.MassBalanceLedger{
		ID: ledgerID, TenantID: tenantID, MaterialType: "lead",
		IncomingKg: 50, AllocatedKg: 0, BalanceKg: 50,
	}

	batchID := uuid.New()
	handler := newTeamHandler(repo)

	body, _ := json.Marshal(map[string]interface{}{
		"ledger_id":     ledgerID.String(),
		"batch_id":      batchID.String(),
		"material_type": "lead",
		"allocated_kg":  100,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/mass-balance/allocations", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.CreateMassBalanceAllocation(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestListMassBalanceAllocations_Success(t *testing.T) {
	repo := newFakeMassBalanceRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{ID: tenantID})

	batchID := uuid.New()
	repo.allocations[uuid.New()] = &models.MassBalanceAllocation{
		ID: uuid.New(), BatchID: batchID, MaterialType: "cobalt", AllocatedKg: 10,
	}
	repo.allocations[uuid.New()] = &models.MassBalanceAllocation{
		ID: uuid.New(), BatchID: batchID, MaterialType: "lithium", AllocatedKg: 20,
	}

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/mass-balance/allocations?batch_id="+batchID.String(), nil)
	req = setAuthContext(req, tenantID, "user@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ListMassBalanceAllocations(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if int(resp["count"].(float64)) != 2 {
		t.Errorf("expected 2 allocations, got %v", resp["count"])
	}
}
