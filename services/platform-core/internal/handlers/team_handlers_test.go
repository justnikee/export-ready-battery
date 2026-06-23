package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/platform-core/internal/middleware"
	"github.com/anvayalabs/platform-core/internal/models"
	"github.com/anvayalabs/platform-core/internal/repository"

	"github.com/google/uuid"
)

// setAuthContext injects tenant ID, email, and product type into the request context.
func setAuthContext(req *http.Request, tenantID uuid.UUID, email string, productType models.ProductType) *http.Request {
	ctx := context.WithValue(req.Context(), middleware.TenantIDKey, tenantID.String())
	ctx = context.WithValue(ctx, middleware.EmailKey, email)
	ctx = context.WithValue(ctx, middleware.ProductTypeKey, string(productType))
	return req.WithContext(ctx)
}

// ============================================================================
// FAKE TEAM REPO
// ============================================================================

type fakeTeamRepo struct {
	tenants        map[uuid.UUID]*models.Tenant
	members        map[uuid.UUID]*models.TeamMember
	membersByEmail map[string]*models.TeamMember
}

var _ repository.RepositoryInterface = (*fakeTeamRepo)(nil)

func newFakeTeamRepo() *fakeTeamRepo {
	return &fakeTeamRepo{
		tenants:        make(map[uuid.UUID]*models.Tenant),
		members:        make(map[uuid.UUID]*models.TeamMember),
		membersByEmail: make(map[string]*models.TeamMember),
	}
}

func (f *fakeTeamRepo) seedTenant(tenant *models.Tenant) {
	f.tenants[tenant.ID] = tenant
}

func (f *fakeTeamRepo) seedMember(member *models.TeamMember) {
	f.members[member.ID] = member
	key := member.TenantID.String() + ":" + member.Email
	f.membersByEmail[key] = member
}

// --- Real implementations for team handlers ---

func (f *fakeTeamRepo) GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	if t, ok := f.tenants[id]; ok {
		return t, nil
	}
	return nil, errors.New("tenant not found")
}

func (f *fakeTeamRepo) CountTeamMembers(ctx context.Context, tenantID uuid.UUID) (int, error) {
	count := 0
	for _, m := range f.members {
		if m.TenantID == tenantID && m.Status != models.TeamStatusRevoked {
			count++
		}
	}
	return count, nil
}

func (f *fakeTeamRepo) GetTeamMembers(ctx context.Context, tenantID uuid.UUID) ([]*models.TeamMember, error) {
	var out []*models.TeamMember
	for _, m := range f.members {
		if m.TenantID == tenantID {
			out = append(out, m)
		}
	}
	return out, nil
}

func (f *fakeTeamRepo) GetTeamMemberByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*models.TeamMember, error) {
	key := tenantID.String() + ":" + email
	if m, ok := f.membersByEmail[key]; ok {
		return m, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeTeamRepo) GetTeamMemberByID(ctx context.Context, id uuid.UUID) (*models.TeamMember, error) {
	if m, ok := f.members[id]; ok {
		return m, nil
	}
	return nil, errors.New("not found")
}

func (f *fakeTeamRepo) CreateTeamMember(ctx context.Context, member *models.TeamMember) error {
	f.members[member.ID] = member
	key := member.TenantID.String() + ":" + member.Email
	f.membersByEmail[key] = member
	return nil
}

func (f *fakeTeamRepo) UpdateTeamMemberRole(ctx context.Context, id uuid.UUID, role string) error {
	if m, ok := f.members[id]; ok {
		m.Role = role
		return nil
	}
	return errors.New("not found")
}

func (f *fakeTeamRepo) DeleteTeamMember(ctx context.Context, id uuid.UUID) error {
	if m, ok := f.members[id]; ok {
		m.Status = models.TeamStatusRevoked
		return nil
	}
	return errors.New("not found")
}

// --- Stubs for remaining RepositoryInterface methods ---

func (f *fakeTeamRepo) CreateAPIKey(ctx context.Context, key *models.APIKey) error { return nil }
func (f *fakeTeamRepo) ListAPIKeys(ctx context.Context, tenantID uuid.UUID) ([]*models.APIKey, error) { return nil, nil }
func (f *fakeTeamRepo) GetAPIKeyByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error) { return nil, nil }
func (f *fakeTeamRepo) GetAPIKeyByPrefix(ctx context.Context, prefix string) (*models.APIKey, error) { return nil, nil }
func (f *fakeTeamRepo) GetAllActiveAPIKeys(ctx context.Context) ([]*models.APIKey, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateAPIKeyLastUsed(ctx context.Context, keyID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) UpdateAPIKey(ctx context.Context, id uuid.UUID, name *string, isActive *bool) error { return nil }
func (f *fakeTeamRepo) DeleteAPIKey(ctx context.Context, id uuid.UUID) error { return nil }
func (f *fakeTeamRepo) GetOrCreateUsageWindow(ctx context.Context, keyID uuid.UUID, endpoint string) (*models.APIKeyUsage, error) { return nil, nil }
func (f *fakeTeamRepo) IncrementUsage(ctx context.Context, keyID uuid.UUID, endpoint string) (int, error) { return 0, nil }
func (f *fakeTeamRepo) CleanupOldUsage(ctx context.Context) error { return nil }

func (f *fakeTeamRepo) GetTeamMemberByToken(ctx context.Context, token string) (*models.TeamMember, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateTeamMemberStatus(ctx context.Context, id uuid.UUID, status string, userID *uuid.UUID) error { return nil }
func (f *fakeTeamRepo) GetPendingInvitesByEmail(ctx context.Context, email string) ([]models.TeamMember, error) { return nil, nil }

func (f *fakeTeamRepo) CreateTenant(ctx context.Context, companyName string) (*models.Tenant, error) { return nil, nil }
func (f *fakeTeamRepo) UpdateTenantProfile(ctx context.Context, id uuid.UUID, req models.UpdateProfileRequest) (*models.Tenant, error) { return nil, nil }
func (f *fakeTeamRepo) DeductQuota(ctx context.Context, tenantID uuid.UUID) error { return nil }
func (f *fakeTeamRepo) AddQuota(ctx context.Context, tenantID uuid.UUID, amount int) error { return nil }
func (f *fakeTeamRepo) GetQuotaBalance(ctx context.Context, tenantID uuid.UUID) (int, error) { return 0, nil }
func (f *fakeTeamRepo) UpdateLogoURL(ctx context.Context, tenantID uuid.UUID, logoURL string) error { return nil }
func (f *fakeTeamRepo) GetTenantByEmail(ctx context.Context, email string) (*models.Tenant, error) { return nil, nil }

func (f *fakeTeamRepo) CreateTransaction(ctx context.Context, tx *models.Transaction) error { return nil }
func (f *fakeTeamRepo) ListTransactions(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.Transaction, error) { return nil, nil }

// ============================================================================
// TEST HELPERS
// ============================================================================

func newTeamHandler(repo repository.RepositoryInterface) *Handler {
	return &Handler{repo: repo}
}

// ============================================================================
// TESTS
// ============================================================================

func TestInviteUser_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"new@example.com","role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if resp["message"] != "Invitation sent successfully" {
		t.Errorf("unexpected message: %v", resp["message"])
	}
}

func TestInviteUser_Success_TextileRole(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Textile Co",
		ProductType: models.ProductTypeTextile,
		PlanType:    models.PlanTypeStarter,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"supplier@example.com","role":"SUPPLIER"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeTextile)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestInviteUser_InvalidRoleForProduct(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"dye@example.com","role":"DYE_HOUSE"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["error"] != "Invalid role for battery tenant. Must be ADMIN, MEMBER, or VIEWER." {
		t.Errorf("unexpected error message: %s", resp["error"])
	}
}

func TestInviteUser_SeatLimit(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	// Seed 2 active members (STARTER limit is 2)
	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "a@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})
	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "b@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"new@example.com","role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp models.SeatLimitError
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode seat limit error: %v", err)
	}
	if resp.Error != "seat_limit_reached" {
		t.Errorf("expected error code seat_limit_reached, got %s", resp.Error)
	}
}

func TestInviteUser_DuplicateEmail(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "existing@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	body := `{"email":"existing@example.com","role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/team/invite", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.InviteUser(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUpdateTeamMemberRole_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	memberID := uuid.New()
	repo.seedMember(&models.TeamMember{
		ID:       memberID,
		TenantID: tenantID,
		Email:    "member@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	body := `{"role":"ADMIN"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/team/"+memberID.String()+"/role", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", memberID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.UpdateTeamMemberRole(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	updated, _ := repo.GetTeamMemberByID(context.Background(), memberID)
	if updated.Role != models.TeamRoleAdmin {
		t.Errorf("expected role ADMIN, got %s", updated.Role)
	}
}

func TestUpdateTeamMemberRole_InvalidRoleForProduct(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	memberID := uuid.New()
	repo.seedMember(&models.TeamMember{
		ID:       memberID,
		TenantID: tenantID,
		Email:    "member@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	body := `{"role":"SPINNING_MILL"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/team/"+memberID.String()+"/role", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", memberID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.UpdateTeamMemberRole(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["error"] != "Invalid role for battery tenant. Must be ADMIN, MEMBER, or VIEWER." {
		t.Errorf("unexpected error message: %s", resp["error"])
	}
}

func TestRemoveTeamMember_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	memberID := uuid.New()
	repo.seedMember(&models.TeamMember{
		ID:       memberID,
		TenantID: tenantID,
		Email:    "member@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/team/"+memberID.String(), nil)
	req.SetPathValue("id", memberID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.RemoveTeamMember(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	removed, _ := repo.GetTeamMemberByID(context.Background(), memberID)
	if removed.Status != models.TeamStatusRevoked {
		t.Errorf("expected status REVOKED, got %s", removed.Status)
	}
}

func TestRemoveTeamMember_CannotRemoveOwner(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeStarter,
	})

	memberID := uuid.New()
	repo.seedMember(&models.TeamMember{
		ID:       memberID,
		TenantID: tenantID,
		Email:    "owner@example.com",
		Role:     models.TeamRoleOwner,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/team/"+memberID.String(), nil)
	req.SetPathValue("id", memberID.String())
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.RemoveTeamMember(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestListTeamMembers_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	tenantID := uuid.New()
	repo.seedTenant(&models.Tenant{
		ID:          tenantID,
		CompanyName: "Battery Co",
		ProductType: models.ProductTypeBattery,
		PlanType:    models.PlanTypeGrowth,
	})

	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "owner@example.com",
		Role:     models.TeamRoleOwner,
		Status:   models.TeamStatusActive,
	})
	repo.seedMember(&models.TeamMember{
		ID:       uuid.New(),
		TenantID: tenantID,
		Email:    "member@example.com",
		Role:     models.TeamRoleMember,
		Status:   models.TeamStatusActive,
	})

	handler := newTeamHandler(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/team", nil)
	req = setAuthContext(req, tenantID, "owner@example.com", models.ProductTypeBattery)

	rr := httptest.NewRecorder()
	handler.ListTeamMembers(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	members, ok := resp["members"].([]interface{})
	if !ok {
		t.Fatalf("expected members array, got %T", resp["members"])
	}
	if len(members) != 2 {
		t.Errorf("expected 2 members, got %d", len(members))
	}
	if resp["seat_count"] != float64(2) {
		t.Errorf("expected seat_count 2, got %v", resp["seat_count"])
	}
	if resp["seat_limit"] != float64(models.GetSeatLimit(models.PlanTypeGrowth)) {
		t.Errorf("expected seat_limit %d, got %v", models.GetSeatLimit(models.PlanTypeGrowth), resp["seat_limit"])
	}
}
