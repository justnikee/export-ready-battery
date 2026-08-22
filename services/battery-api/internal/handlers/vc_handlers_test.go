package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

func vcTenantContext(req *http.Request, tenantID uuid.UUID) *http.Request {
	ctx := context.WithValue(req.Context(), middleware.TenantIDKey, tenantID.String())
	return req.WithContext(ctx)
}

func TestGenerateVCHandle_PathValueUUID(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	passportID := uuid.New()
	batchID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetPassport", mock.Anything, passportID).Return(&models.Passport{
		UUID:            passportID,
		BatchID:         batchID,
		SerialNumber:    "IN-TEST-LFP-2026-00001",
		ManufactureDate: time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC),
		Status:          models.PassportStatusCreated,
		ProductType:     models.ProductTypeBattery,
	}, nil)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(&models.Batch{
		ID:       batchID,
		TenantID: tenantID,
	}, nil)

	h := &Handler{repo: repo}
	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/passports/{uuid}/vc", http.HandlerFunc(h.GenerateVCHandle))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/vc", nil)
	req = vcTenantContext(req, tenantID)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 with {uuid} path, got %d body=%s", rr.Code, rr.Body.String())
	}
	var body map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["status"] != "draft" {
		t.Fatalf("expected draft without crypto, got %#v", body["status"])
	}
}

func TestGenerateVCHandle_LegacyIDPath(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	passportID := uuid.New()
	batchID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetPassport", mock.Anything, passportID).Return(&models.Passport{
		UUID:            passportID,
		BatchID:         batchID,
		SerialNumber:    "IN-TEST-LFP-2026-00002",
		ManufactureDate: time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC),
		Status:          models.PassportStatusCreated,
		ProductType:     models.ProductTypeBattery,
	}, nil)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(&models.Batch{
		ID:       batchID,
		TenantID: tenantID,
	}, nil)

	h := &Handler{repo: repo}
	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/passports/{id}/vc", http.HandlerFunc(h.GenerateVCHandle))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/vc", nil)
	req = vcTenantContext(req, tenantID)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 with legacy {id} path, got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestGenerateVCHandle_InvalidUUID(t *testing.T) {
	h := &Handler{}
	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/passports/{uuid}/vc", http.HandlerFunc(h.GenerateVCHandle))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/not-a-uuid/vc", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestGetVCHandle_NotIssued(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	passportID := uuid.New()
	batchID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetPassport", mock.Anything, passportID).Return(&models.Passport{
		UUID:    passportID,
		BatchID: batchID,
	}, nil)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(&models.Batch{ID: batchID, TenantID: tenantID}, nil)
	repo.On("GetPassportVCByPassportID", mock.Anything, passportID).Return(nil, nil)

	h := &Handler{repo: repo}
	mux := http.NewServeMux()
	mux.Handle("GET /api/v1/passports/{uuid}/vc", http.HandlerFunc(h.GetVCHandle))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/"+passportID.String()+"/vc", nil)
	req = vcTenantContext(req, tenantID)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 when no VC stored, got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestGetVCHandle_Issued(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	passportID := uuid.New()
	batchID := uuid.New()
	vcID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetPassport", mock.Anything, passportID).Return(&models.Passport{
		UUID:    passportID,
		BatchID: batchID,
	}, nil)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(&models.Batch{ID: batchID, TenantID: tenantID}, nil)
	repo.On("GetPassportVCByPassportID", mock.Anything, passportID).Return(&models.PassportVC{
		ID:                vcID,
		PassportID:        passportID,
		VCType:            "BatteryPassportCredential",
		IssuerDID:         "did:key:z6Mktest",
		CredentialSubject: json.RawMessage(`{"serialNumber":"IN-TEST-00001"}`),
		Proof:             json.RawMessage(`{"type":"Ed25519Signature2020","created":"2026-08-11T12:00:00Z"}`),
		Status:            "issued",
		CreatedAt:         time.Date(2026, 8, 11, 12, 0, 0, 0, time.UTC),
	}, nil)

	h := &Handler{repo: repo}
	mux := http.NewServeMux()
	mux.Handle("GET /api/v1/passports/{uuid}/vc", http.HandlerFunc(h.GetVCHandle))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/"+passportID.String()+"/vc", nil)
	req = vcTenantContext(req, tenantID)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", rr.Code, rr.Body.String())
	}

	var body map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["status"] != "issued" {
		t.Fatalf("expected issued, got %#v", body["status"])
	}
	vc, ok := body["vc"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected vc object, got %#v", body["vc"])
	}
	if vc["issuer"] != "did:key:z6Mktest" {
		t.Fatalf("issuer: %#v", vc["issuer"])
	}
	if vc["issuanceDate"] != "2026-08-11T12:00:00Z" {
		t.Fatalf("issuanceDate: %#v", vc["issuanceDate"])
	}
	if vc["id"] != "urn:uuid:"+vcID.String() {
		t.Fatalf("id: %#v", vc["id"])
	}
}

func TestGetVCHandle_ForeignTenant(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	passportID := uuid.New()
	batchID := uuid.New()

	repo := new(repository.MockRepository)
	repo.On("GetPassport", mock.Anything, passportID).Return(&models.Passport{
		UUID:    passportID,
		BatchID: batchID,
	}, nil)
	repo.On("GetBatch", mock.Anything, batchID, tenantID).Return(nil, errors.New("batch not found"))

	h := &Handler{repo: repo}
	mux := http.NewServeMux()
	mux.Handle("GET /api/v1/passports/{uuid}/vc", http.HandlerFunc(h.GetVCHandle))

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/"+passportID.String()+"/vc", nil)
	req = vcTenantContext(req, tenantID)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for foreign passport, got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestGetVCHandle_InvalidUUID(t *testing.T) {
	h := &Handler{}
	mux := http.NewServeMux()
	mux.Handle("GET /api/v1/passports/{uuid}/vc", http.HandlerFunc(h.GetVCHandle))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/not-a-uuid/vc", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}
