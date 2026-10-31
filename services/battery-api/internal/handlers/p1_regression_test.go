package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
)

func TestBatchDocumentOwnershipAndPurpose(t *testing.T) {
	tenant := uuid.New()
	key := tenant.String() + "/batch-staging/doc/example.pdf"
	for _, ref := range []string{key, "https://storage.example/storage/v1/object/public/compliance-docs/" + key, "https://storage.example/storage/v1/object/sign/compliance-docs/" + key + "?token=expired"} {
		if got, err := batchDocumentKey(tenant, "doc", ref); err != nil || got != key {
			t.Fatalf("valid reference %q: %q %v", ref, got, err)
		}
	}
	for _, ref := range []string{uuid.NewString() + "/batch-staging/doc/example.pdf", tenant.String() + "/certificates/pli.pdf", tenant.String() + "/batch-staging/pli/example.pdf", tenant.String() + "/batch-staging/doc/../../certificates/pli.pdf", tenant.String() + "/batch-staging/doc/%252e%252e/pli.pdf", "https://external.example/file.pdf", key + "#bad"} {
		if _, err := batchDocumentKey(tenant, "doc", ref); err == nil {
			t.Errorf("accepted invalid reference %q", ref)
		}
	}
	repo := new(repository.MockRepository)
	h := newTestHandler(repo)
	batch := validBillingBatch(tenant)
	foreign := uuid.NewString() + "/batch-staging/doc/file.pdf"
	for _, body := range []string{`{"declaration_of_conformity_path":"` + foreign + `"}`, `{"specs":{"pli_certificate_url":"` + foreign + `"}}`} {
		req := httptest.NewRequest(http.MethodPatch, "/", strings.NewReader(body))
		req.SetPathValue("id", batch.ID.String())
		req = setAuthContext(req, tenant, "test@example.test", models.ProductTypeBattery)
		rr := httptest.NewRecorder()
		h.PatchBatch(rr, req)
		if rr.Code != 400 {
			t.Fatalf("patch foreign ref: %d %s", rr.Code, rr.Body.String())
		}
	}
	repo.On("GetTenant", mock.Anything, tenant).Return(validBillingTenant(tenant), nil)
	for _, field := range []string{"declaration_of_conformity_path", "pli_certificate_url"} {
		body := `{"tenant_id":"` + tenant.String() + `","` + field + `":"` + foreign + `"}`
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
		req = setAuthContext(req, tenant, "test@example.test", models.ProductTypeBattery)
		rr := httptest.NewRecorder()
		h.CreateBatch(rr, req)
		if rr.Code != 400 {
			t.Fatalf("create foreign ref: %d %s", rr.Code, rr.Body.String())
		}
	}
	repo.AssertNotCalled(t, "CreateBatch", mock.Anything, mock.Anything)
	repo.AssertNotCalled(t, "PatchBatchDraft", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
	batch.DeclarationOfConformityPath = foreign
	repo.On("GetBatch", mock.Anything, batch.ID, tenant).Return(batch, nil)
	req := httptest.NewRequest(http.MethodGet, "/?type=doc", nil)
	req.SetPathValue("id", batch.ID.String())
	req = setAuthContext(req, tenant, "test@example.test", models.ProductTypeBattery)
	rr := httptest.NewRecorder()
	h.GetBatchDocumentURL(rr, req)
	if rr.Code == 200 {
		t.Fatal("legacy foreign document was served")
	}
}

func TestPublicPassportVisibilityAndDocumentGate(t *testing.T) {
	tenantID, passportID := uuid.New(), uuid.New()
	repo := new(repository.MockRepository)
	h := newTestHandler(repo)
	full := &models.PassportWithSpecs{BatchStatus: models.BatchStatusActive, Passport: &models.Passport{UUID: passportID}, Specs: &models.BatchSpec{Chemistry: "private chemistry", MaterialComposition: &models.MaterialComposition{}, Components: []models.Component{{Manufacturer: "private supplier"}}}, Tenant: &models.Tenant{ID: tenantID, DataVisibility: json.RawMessage(`{"battery_composition":"REGULATOR","supply_chain":"REGULATOR","compliance_docs":"REGULATOR"}`), BatteryProfile: &models.BatteryTenantProfile{}}, DeclarationOfConformityPath: tenantID.String() + "/batch-staging/doc/test.pdf"}
	repo.On("GetPassportWithSpecs", mock.Anything, passportID).Return(full, nil)
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.SetPathValue("uuid", passportID.String())
	rr := httptest.NewRecorder()
	h.GetPassport(rr, req)
	if rr.Code != 200 {
		t.Fatalf("public: %d %s", rr.Code, rr.Body.String())
	}
	for _, secret := range []string{"private chemistry", "private supplier", "batch-staging"} {
		if strings.Contains(rr.Body.String(), secret) {
			t.Fatalf("public leaked %s", secret)
		}
	}
	req = httptest.NewRequest(http.MethodGet, "/?type=doc", nil)
	req.SetPathValue("uuid", passportID.String())
	rr = httptest.NewRecorder()
	h.GetPublicPassportDocumentURL(rr, req)
	if rr.Code != 404 {
		t.Fatalf("restricted document: %d", rr.Code)
	}
	full.BatchStatus = models.BatchStatusDraft
	rr = httptest.NewRecorder()
	h.GetPassport(rr, req)
	if rr.Code != 404 {
		t.Fatal("draft passport published")
	}
}

func TestIssuanceSnapshotIncludesCorrectedEUFields(t *testing.T) {
	tenant := validBillingTenant(uuid.New())
	batch := validBillingBatch(tenant.ID)
	batch.Specs.Capacity = "200"
	batch.CEMarking = true
	batch.CarbonPerformanceClass = "B"
	batch.RemovableAndReplaceable = true
	batch.NotifiedBodyNumber = "1234"
	batch.DeclarationOfConformityPath = tenant.ID.String() + "/batch-staging/doc/current.pdf"
	snapshot, err := services.BuildBatchSnapshot(batch, tenant)
	if err != nil {
		t.Fatal(err)
	}
	full := &models.PassportWithSpecs{Passport: &models.Passport{BatchSnapshot: snapshot}, Specs: &models.BatchSpec{Capacity: "old"}, Tenant: tenant}
	view := models.BuildPublicView(full)
	if view.Specs.Capacity != "200" || !view.CEMarking || view.CarbonPerformanceClass != "B" || !view.RemovableAndReplaceable || view.NotifiedBodyNumber != "1234" || view.DeclarationOfConformityPath != batch.DeclarationOfConformityPath {
		t.Fatalf("issued view lost corrected fields: %+v", view)
	}
}

func TestArchivedActivationRejectedBeforeTransaction(t *testing.T) {
	repo := new(repository.MockRepository)
	h := newTestHandler(repo)
	tenant := uuid.New()
	batch := validBillingBatch(tenant)
	batch.Status = models.BatchStatusArchived
	repo.On("GetTenant", mock.Anything, tenant).Return(validBillingTenant(tenant), nil)
	repo.On("GetBatch", mock.Anything, batch.ID, tenant).Return(batch, nil)
	rr := httptest.NewRecorder()
	h.ActivateBatch(rr, activateBatchReq(batch.ID, tenant))
	if rr.Code != 400 {
		t.Fatalf("archived: %d", rr.Code)
	}
	repo.AssertNotCalled(t, "ActivateBatchAtomic", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestIssuedSnapshotPreservesEmptyValuesAndResolvedContact(t *testing.T) {
	tenant := validBillingTenant(uuid.New())
	tenant.SupportEmail = "support@example.test"
	tenant.BatteryProfile.BISCertificatePath = "fresh-signed-test-url"
	batch := validBillingBatch(tenant.ID)
	batch.CEMarking = false
	batch.DeclarationOfConformityPath = ""
	batch.Specs.CustomsDate = "2026-10-01"
	batch.CarbonFootprintResult = json.RawMessage(`{"total_kg_co2e":12,"per_kwh_kg_co2e":3}`)
	snapshot, err := services.BuildBatchSnapshot(batch, tenant)
	if err != nil {
		t.Fatal(err)
	}
	full := &models.PassportWithSpecs{Passport: &models.Passport{BatchSnapshot: snapshot}, Specs: &models.BatchSpec{}, Tenant: tenant, CEMarking: true, DeclarationOfConformityPath: "later-live-document"}
	view := models.BuildPublicView(full)
	if view.CEMarking || view.DeclarationOfConformityPath != "" {
		t.Fatal("issued empty/false values replaced with later live values")
	}
	if view.Tenant.SupportEmail != tenant.SupportEmail || view.Tenant.BISCertificatePath != "fresh-signed-test-url" {
		t.Fatal("identity snapshot dropped permitted current contact/document")
	}
	if view.Specs.CarbonFootprint != "12.00 kg CO₂e (3.000 kg CO₂e/kWh)" || view.CustomsDate == nil {
		t.Fatal("snapshot lost calculator result or customs date")
	}
	models.ApplyDisplayConfigToPublicView(view, models.ParseDisplayConfig(nil))
	if view.Tenant.BISCertificatePath != "" {
		t.Fatal("snapshot docs bypassed visibility")
	}
}
