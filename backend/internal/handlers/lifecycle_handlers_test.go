package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"exportready-battery/internal/middleware"
	"exportready-battery/internal/models"
	"exportready-battery/internal/services"

	"github.com/google/uuid"
)

// fakeLifecycleRepo is a minimal in-memory implementation for lifecycle tests.
type fakeLifecycleRepo struct {
	passports     map[uuid.UUID]*models.Passport
	events        map[uuid.UUID][]*models.PassportEvent
	marketRegions map[uuid.UUID]models.MarketRegion
}

type fakeRoleResolver struct {
	role string
}

func (f *fakeRoleResolver) GetTeamMemberByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TeamMember, error) {
	return &models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    email,
		Role:     f.role,
		Status:   "ACTIVE",
	}, nil
}

func newFakeLifecycleRepo() *fakeLifecycleRepo {
	return &fakeLifecycleRepo{
		passports:     make(map[uuid.UUID]*models.Passport),
		events:        make(map[uuid.UUID][]*models.PassportEvent),
		marketRegions: make(map[uuid.UUID]models.MarketRegion),
	}
}

func (f *fakeLifecycleRepo) GetPassportByUUID(ctx context.Context, passportID uuid.UUID) (*models.Passport, error) {
	passport, ok := f.passports[passportID]
	if !ok {
		return nil, errors.New("passport not found")
	}
	return passport, nil
}

func (f *fakeLifecycleRepo) GetBatchMarketRegion(ctx context.Context, batchID uuid.UUID) (models.MarketRegion, error) {
	if region, ok := f.marketRegions[batchID]; ok {
		return region, nil
	}
	return models.MarketRegionGlobal, nil
}

func (f *fakeLifecycleRepo) GetBatchTenantID(ctx context.Context, batchID uuid.UUID) (uuid.UUID, error) {
	return uuid.Nil, nil
}

func (f *fakeLifecycleRepo) ApplyLifecycleTransition(ctx context.Context, params models.TransitionPersistence) error {
	if params.Event == nil {
		return errors.New("missing audit event")
	}
	passport, ok := f.passports[params.PassportID]
	if !ok {
		return errors.New("passport not found")
	}
	passport.Status = params.NewStatus
	if params.ShippedAt != nil {
		passport.ShippedAt = params.ShippedAt
	}
	if params.InstalledAt != nil {
		passport.InstalledAt = params.InstalledAt
	}
	if params.RecycledAt != nil {
		passport.RecycledAt = params.RecycledAt
	}
	if params.RecyclingStatus != "" {
		passport.RecyclingStatus = params.RecyclingStatus
	}
	if params.RecyclerEprID != "" {
		passport.RecyclerEprID = params.RecyclerEprID
	}
	if params.RecyclingDate != nil {
		passport.RecyclingDate = params.RecyclingDate
	}
	f.events[params.PassportID] = append(f.events[params.PassportID], params.Event)
	return nil
}

func (f *fakeLifecycleRepo) GetPassportEvents(ctx context.Context, passportID uuid.UUID) ([]*models.PassportEvent, error) {
	return f.events[passportID], nil
}

func (f *fakeLifecycleRepo) CreatePassportEvent(ctx context.Context, event *models.PassportEvent) error {
	f.events[event.PassportID] = append(f.events[event.PassportID], event)
	return nil
}

func (f *fakeLifecycleRepo) UpdatePassportOwner(ctx context.Context, passportID uuid.UUID, ownerIdentifier string) error {
	return nil
}

func (f *fakeLifecycleRepo) AppendOwnershipHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeLifecycleRepo) UpdatePassportOwnerID(ctx context.Context, passportID uuid.UUID, newOwnerID uuid.UUID) error {
	passport, ok := f.passports[passportID]
	if !ok {
		return errors.New("passport not found")
	}
	passport.OwnerID = &newOwnerID
	return nil
}

func (f *fakeLifecycleRepo) CreatePassportEventBatch(ctx context.Context, events []*models.PassportEvent) error {
	for _, event := range events {
		f.events[event.PassportID] = append(f.events[event.PassportID], event)
	}
	return nil
}

func (f *fakeLifecycleRepo) UpdateStateOfHealth(ctx context.Context, passportID uuid.UUID, soh float64, updatedAt time.Time) error {
	passport, ok := f.passports[passportID]
	if !ok {
		return errors.New("passport not found")
	}
	passport.StateOfHealth = &soh
	passport.LastSOHUpdateTimestamp = &updatedAt
	return nil
}

func (f *fakeLifecycleRepo) AppendSoHHistory(ctx context.Context, entry models.SoHHistoryEntry) error {
	return nil
}

func (f *fakeLifecycleRepo) GetSoHHistory(ctx context.Context, passportID uuid.UUID) ([]models.SoHHistoryEntry, error) {
	return nil, nil
}

func (f *fakeLifecycleRepo) AppendRepairEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func (f *fakeLifecycleRepo) AppendReplacementEvent(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
	return nil
}

func newLifecycleHandlerWithStatus(status string, teamRole string) (*LifecycleHandler, uuid.UUID) {
	repo := newFakeLifecycleRepo()
	passportID := uuid.New()
	repo.passports[passportID] = &models.Passport{
		UUID:      passportID,
		BatchID:   uuid.New(),
		Status:    status,
		CreatedAt: time.Now(),
	}
	service := services.NewLifecycleService(repo)
	roleResolver := &fakeRoleResolver{role: teamRole}
	return NewLifecycleHandler(service, roleResolver), passportID
}

func contextWithAuthAndEmail(tenantID, email string) context.Context {
	ctx := context.WithValue(context.Background(), middleware.TenantIDKey, tenantID)
	ctx = context.WithValue(ctx, middleware.EmailKey, email)
	return ctx
}

func TestTransitionPassport_RejectsToStatus(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusCreated, "MEMBER")

	statusField := "to" + "_status"
	body := `{"` + statusField + `":"ACTIVE"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestTransitionPassport_MissingActorRole(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusActive, "VIEWER")

	body := `{"action":"SHIP"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "viewer@example.com"))
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", rr.Code)
	}
}

func TestTransitionPassport_UnknownAction(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusCreated, "MEMBER")

	body := `{"action":"FLY"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestTransitionPassport_ActionNotAllowed(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusCreated, "MEMBER")

	body := `{"action":"SHIP"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", rr.Code)
	}
}

func TestTransitionPassport_ActionSkipState(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusCreated, "ADMIN")

	body := `{"action":"RECALL"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "admin@example.com"))
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", rr.Code)
	}
}

func TestTransitionPassport_ValidAction(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusActive, "MEMBER")

	body := `{"action":"SHIP","evidence":{"shipment_reference":"REF-1","shipment_date":"2026-01-15"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if result["new_status"] != models.PassportStatusShipped {
		t.Fatalf("expected new_status %s, got %v", models.PassportStatusShipped, result["new_status"])
	}
}

func TestTransitionPassport_MissingEvidence(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusActive, "MEMBER")

	body := `{"action":"SHIP","evidence":{"shipment_reference":"REF-1"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/transition", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.TransitionPassport(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}
