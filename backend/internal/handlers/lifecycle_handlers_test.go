package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
	"time"

	"anvayalabs-battery/internal/middleware"
	"anvayalabs-battery/internal/models"
	"anvayalabs-battery/internal/repository"
	"anvayalabs-battery/internal/services"

	"github.com/google/uuid"
)

// fakeLifecycleRepo is a minimal in-memory implementation for lifecycle tests.
type fakeLifecycleRepo struct {
	passports       map[uuid.UUID]*models.Passport
	events          map[uuid.UUID][]*models.PassportEvent
	marketRegions   map[uuid.UUID]models.MarketRegion
	batchTenants    map[uuid.UUID]uuid.UUID
	defaultTenantID uuid.UUID
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
	defaultTenantID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	return &fakeLifecycleRepo{
		passports:       make(map[uuid.UUID]*models.Passport),
		events:          make(map[uuid.UUID][]*models.PassportEvent),
		marketRegions:   make(map[uuid.UUID]models.MarketRegion),
		batchTenants:    make(map[uuid.UUID]uuid.UUID),
		defaultTenantID: defaultTenantID,
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
	if tenantID, ok := f.batchTenants[batchID]; ok {
		return tenantID, nil
	}
	return f.defaultTenantID, nil
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

func (f *fakeLifecycleRepo) AppendGeolocationHistory(ctx context.Context, passportID uuid.UUID, entryJSON []byte) error {
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

func (f *fakeLifecycleRepo) GetPassportIDsByBatch(ctx context.Context, batchID, tenantID uuid.UUID) ([]uuid.UUID, error) {
	var passportIDs []uuid.UUID
	for passportID, passport := range f.passports {
		if passport.BatchID != batchID {
			continue
		}
		if ownerTenantID, ok := f.batchTenants[batchID]; ok && ownerTenantID != tenantID {
			continue
		}
		passportIDs = append(passportIDs, passportID)
	}
	return passportIDs, nil
}

func (f *fakeLifecycleRepo) ListPassportsByTenant(ctx context.Context, tenantID uuid.UUID, status, search, batchID string, limit, offset int) ([]*repository.PassportListItem, int, error) {
	items := make([]*repository.PassportListItem, 0)
	for _, passport := range f.passports {
		batchTenantID, ok := f.batchTenants[passport.BatchID]
		if ok && batchTenantID != tenantID {
			continue
		}
		if status != "" && passport.Status != status {
			continue
		}
		if batchID != "" && passport.BatchID.String() != batchID {
			continue
		}
		needle := strings.ToLower(search)
		if needle != "" &&
			!strings.Contains(strings.ToLower(passport.SerialNumber), needle) &&
			!strings.Contains(strings.ToLower(passport.UUID.String()), needle) {
			continue
		}
		items = append(items, &repository.PassportListItem{
			UUID:         passport.UUID.String(),
			SerialNumber: passport.SerialNumber,
			Status:       passport.Status,
		})
	}
	total := len(items)
	if offset >= total {
		return []*repository.PassportListItem{}, total, nil
	}
	end := offset + limit
	if end > total {
		end = total
	}
	return items[offset:end], total, nil
}

func newLifecycleHandlerWithStatus(status string, teamRole string) (*LifecycleHandler, uuid.UUID) {
	repo := newFakeLifecycleRepo()
	passportID := uuid.New()
	batchID := uuid.New()
	repo.batchTenants[batchID] = repo.defaultTenantID
	repo.passports[passportID] = &models.Passport{
		UUID:      passportID,
		BatchID:   batchID,
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
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "operator@example.com"))
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

func TestGetPassportEvents_ForeignTenant(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusActive, "MEMBER")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/"+passportID.String()+"/events", nil)
	req = req.WithContext(contextWithAuthAndEmail("22222222-2222-2222-2222-222222222222", "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.GetPassportEvents(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rr.Code)
	}
}

func TestUpdateStateOfHealth_ForeignTenant(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusActive, "MEMBER")

	body := `{"state_of_health":94}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/soh", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("22222222-2222-2222-2222-222222222222", "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.UpdateStateOfHealth(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rr.Code)
	}
}

func TestGetAllowedActions_FiltersByActorRole(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusActive, "MEMBER")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/"+passportID.String()+"/transitions", nil)
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.GetAllowedActions(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp struct {
		AllowedActions []string `json:"allowed_actions"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !slices.Contains(resp.AllowedActions, string(models.ActionShip)) {
		t.Fatalf("expected SHIP to be allowed, got %v", resp.AllowedActions)
	}
	if slices.Contains(resp.AllowedActions, string(models.ActionRecall)) {
		t.Fatalf("did not expect RECALL for MEMBER, got %v", resp.AllowedActions)
	}
}

func TestGetBulkAllowedActions_FiltersFullDatasetByActorRole(t *testing.T) {
	repo := newFakeLifecycleRepo()
	ownerTenantID := repo.defaultTenantID
	ownedBatchID := uuid.New()
	foreignBatchID := uuid.New()
	repo.batchTenants[ownedBatchID] = ownerTenantID
	repo.batchTenants[foreignBatchID] = uuid.MustParse("22222222-2222-2222-2222-222222222222")

	repo.passports[uuid.New()] = &models.Passport{
		UUID:      uuid.New(),
		BatchID:   ownedBatchID,
		Status:    models.PassportStatusActive,
		CreatedAt: time.Now(),
	}
	repo.passports[uuid.New()] = &models.Passport{
		UUID:      uuid.New(),
		BatchID:   ownedBatchID,
		Status:    models.PassportStatusCreated,
		CreatedAt: time.Now(),
	}
	repo.passports[uuid.New()] = &models.Passport{
		UUID:      uuid.New(),
		BatchID:   foreignBatchID,
		Status:    models.PassportStatusActive,
		CreatedAt: time.Now(),
	}

	handler := NewLifecycleHandler(services.NewLifecycleService(repo), &fakeRoleResolver{role: "MEMBER"})
	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/bulk/allowed-actions", nil)
	req = req.WithContext(contextWithAuthAndEmail(ownerTenantID.String(), "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.GetBulkAllowedActions(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var resp struct {
		AllowedActions []string `json:"allowed_actions"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(resp.AllowedActions) != 0 {
		t.Fatalf("expected no shared allowed actions, got %v", resp.AllowedActions)
	}
}

func TestLogRepairEvent_RejectsForbiddenRole(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusInService, "VIEWER")

	body := `{"repair_date":"2026-02-05","technician_id":"TECH-1","component_repaired":"BMS board","repair_notes":"Reflashed firmware"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/repairs", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "viewer@example.com"))
	rr := httptest.NewRecorder()

	handler.LogRepairEvent(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", rr.Code)
	}
}

func TestLogRepairEvent_NormalizesAuditMetadata(t *testing.T) {
	repo := newFakeLifecycleRepo()
	passportID := uuid.New()
	batchID := uuid.New()
	repo.batchTenants[batchID] = repo.defaultTenantID
	repo.passports[passportID] = &models.Passport{
		UUID:      passportID,
		BatchID:   batchID,
		Status:    models.PassportStatusInService,
		CreatedAt: time.Now(),
	}
	handler := NewLifecycleHandler(services.NewLifecycleService(repo), &fakeRoleResolver{role: "MEMBER"})

	body := `{"repair_date":"2026-02-05","technician_id":"TECH-1","component_repaired":"BMS board","repair_notes":"Reflashed firmware"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/repairs", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail(repo.defaultTenantID.String(), "operator@example.com"))
	rr := httptest.NewRecorder()

	handler.LogRepairEvent(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}
	events := repo.events[passportID]
	if len(events) != 1 {
		t.Fatalf("expected one audit event, got %d", len(events))
	}
	event := events[0]
	if event.ActorRole != models.ActorRoleInternalOperator {
		t.Fatalf("expected actor role %s, got %s", models.ActorRoleInternalOperator, event.ActorRole)
	}
	if event.ActorID != "operator@example.com" {
		t.Fatalf("expected actor id operator@example.com, got %s", event.ActorID)
	}
	description, ok := event.Metadata["description"].(string)
	if !ok || description != "BMS board repaired: Reflashed firmware" {
		t.Fatalf("unexpected description metadata: %v", event.Metadata["description"])
	}
	timestamp, ok := event.Metadata["timestamp"].(string)
	if !ok || timestamp != "2026-02-05T00:00:00Z" {
		t.Fatalf("unexpected timestamp metadata: %v", event.Metadata["timestamp"])
	}
}

func TestLogReplacementEvent_RequiresInServiceStatus(t *testing.T) {
	handler, passportID := newLifecycleHandlerWithStatus(models.PassportStatusActive, "ADMIN")

	body := `{"replacement_date":"2026-02-05","technician_id":"TECH-1","component_replaced":"Module A","replacement_reason":"Capacity loss","new_component_serial":"MOD-22"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/passports/"+passportID.String()+"/replacements", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(contextWithAuthAndEmail("11111111-1111-1111-1111-111111111111", "admin@example.com"))
	rr := httptest.NewRecorder()

	handler.LogReplacementEvent(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected status 409, got %d", rr.Code)
	}
}
