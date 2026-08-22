package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

func withAPIKeyAuth(req *http.Request, tenantID uuid.UUID, role string) *http.Request {
	ctx := context.WithValue(req.Context(), middleware.APIKeyTenantIDKey, tenantID.String())
	if role != "" {
		ctx = context.WithValue(ctx, middleware.APIKeyRoleKey, role)
	}
	return req.WithContext(ctx)
}

func newExternalLifecycleHandler(status string, tenantID uuid.UUID) (*Handler, *fakeLifecycleRepo, uuid.UUID) {
	repo := newFakeLifecycleRepo()
	passportID := uuid.New()
	batchID := uuid.New()
	repo.defaultTenantID = tenantID
	repo.batchTenants[batchID] = tenantID
	repo.passports[passportID] = &models.Passport{
		UUID:        passportID,
		BatchID:     batchID,
		Status:      status,
		ProductType: models.ProductTypeBattery,
		CreatedAt:   time.Now(),
	}
	return &Handler{lifecycleService: services.NewLifecycleService(repo)}, repo, passportID
}

func postExternalTransition(t *testing.T, h *Handler, passportID, tenantID uuid.UUID, role, action string, evidence models.Evidence) *httptest.ResponseRecorder {
	t.Helper()
	body, err := json.Marshal(ExternalTransitionPassportRequest{Action: action, Evidence: evidence})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/external/passports/{uuid}/transition", http.HandlerFunc(h.ExternalTransitionPassport))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/external/passports/"+passportID.String()+"/transition", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAPIKeyAuth(req, tenantID, role)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	return rr
}

func TestExternalTransition_APIKeyShipInstallRecycle(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	h, repo, passportID := newExternalLifecycleHandler(models.PassportStatusActive, tenantID)

	ship := postExternalTransition(t, h, passportID, tenantID, string(models.ActorRoleLogistics), "SHIP", models.Evidence{
		models.EvidenceShipmentReference: "AWB-9911",
		models.EvidenceShipmentDate:      "2026-08-17",
	})
	if ship.Code != http.StatusOK {
		t.Fatalf("SHIP: expected 200, got %d body=%s", ship.Code, ship.Body.String())
	}
	assertExternalTransition(t, ship, "SHIP", models.PassportStatusActive, models.PassportStatusShipped)
	if repo.passports[passportID].Status != models.PassportStatusShipped {
		t.Fatalf("passport status after SHIP = %s", repo.passports[passportID].Status)
	}

	install := postExternalTransition(t, h, passportID, tenantID, string(models.ActorRoleTechnician), "INSTALL", models.Evidence{
		models.EvidenceInstallationDate: "2026-08-18",
		models.EvidenceInstallerID:      "tech-42",
	})
	if install.Code != http.StatusOK {
		t.Fatalf("INSTALL: expected 200, got %d body=%s", install.Code, install.Body.String())
	}
	assertExternalTransition(t, install, "INSTALL", models.PassportStatusShipped, models.PassportStatusInService)

	recycle := postExternalTransition(t, h, passportID, tenantID, string(models.ActorRoleRecycler), "RECYCLE", models.Evidence{
		models.EvidenceRecyclerEprID:         "B-29016/2024-25/CPCB",
		models.EvidenceRecyclingDate:         "2026-08-19",
		models.EvidenceCertificateReference: "CERT-REC-1",
	})
	if recycle.Code != http.StatusOK {
		t.Fatalf("RECYCLE: expected 200, got %d body=%s", recycle.Code, recycle.Body.String())
	}
	assertExternalTransition(t, recycle, "RECYCLE", models.PassportStatusInService, models.PassportStatusRecycled)
	if len(repo.events[passportID]) != 3 {
		t.Fatalf("expected 3 hash-chained events, got %d", len(repo.events[passportID]))
	}
}

func TestExternalTransition_WrongRoleForbidden(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	h, _, passportID := newExternalLifecycleHandler(models.PassportStatusShipped, tenantID)

	rr := postExternalTransition(t, h, passportID, tenantID, string(models.ActorRoleLogistics), "INSTALL", models.Evidence{
		models.EvidenceInstallationDate: "2026-08-18",
		models.EvidenceInstallerID:      "tech-42",
	})
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for LOGISTICS INSTALL, got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestExternalTransition_MissingRoleForbidden(t *testing.T) {
	tenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	h, _, passportID := newExternalLifecycleHandler(models.PassportStatusActive, tenantID)

	rr := postExternalTransition(t, h, passportID, tenantID, "", "SHIP", models.Evidence{
		models.EvidenceShipmentReference: "AWB-1",
		models.EvidenceShipmentDate:      "2026-08-17",
	})
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 when API key has no role, got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestExternalTransition_ForeignTenantForbidden(t *testing.T) {
	owner := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	foreign := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	h, _, passportID := newExternalLifecycleHandler(models.PassportStatusActive, owner)

	rr := postExternalTransition(t, h, passportID, foreign, string(models.ActorRoleLogistics), "SHIP", models.Evidence{
		models.EvidenceShipmentReference: "AWB-1",
		models.EvidenceShipmentDate:      "2026-08-17",
	})
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for foreign tenant, got %d body=%s", rr.Code, rr.Body.String())
	}
}

func TestExternalTransition_InvalidUUID(t *testing.T) {
	h := &Handler{lifecycleService: services.NewLifecycleService(newFakeLifecycleRepo())}
	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/external/passports/{uuid}/transition", http.HandlerFunc(h.ExternalTransitionPassport))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/external/passports/not-a-uuid/transition", bytes.NewReader([]byte(`{"action":"SHIP"}`)))
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func assertExternalTransition(t *testing.T, rr *httptest.ResponseRecorder, action, from, to string) {
	t.Helper()
	var body map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v body=%s", err, rr.Body.String())
	}
	if body["success"] != true {
		t.Fatalf("expected success, got %#v", body)
	}
	if body["action"] != action {
		t.Fatalf("action=%v want %s", body["action"], action)
	}
	if body["previous_status"] != from {
		t.Fatalf("previous_status=%v want %s", body["previous_status"], from)
	}
	if body["new_status"] != to {
		t.Fatalf("new_status=%v want %s", body["new_status"], to)
	}
	if body["event_id"] == nil || body["event_id"] == "" {
		t.Fatal("expected event_id")
	}
}
