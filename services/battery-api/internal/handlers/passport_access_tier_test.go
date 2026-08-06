package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// mem store for passport tier tests (mirrors services test double)
type tierTestStore struct {
	byHash map[string]*repository.RegulatorAPIKey
}

func (m *tierTestStore) CreateRegulatorAPIKey(ctx context.Context, req repository.CreateRegulatorAPIKeyRequest) (*repository.RegulatorAPIKey, error) {
	k := &repository.RegulatorAPIKey{
		ID: uuid.New(), Name: req.Name, KeyHash: req.KeyHash, KeyPrefix: req.KeyPrefix,
		TenantIDs: req.TenantIDs, Markets: req.Markets, IsActive: true, CreatedAt: time.Now(),
	}
	if m.byHash == nil {
		m.byHash = map[string]*repository.RegulatorAPIKey{}
	}
	m.byHash[req.KeyHash] = k
	return k, nil
}
func (m *tierTestStore) GetRegulatorAPIKeyByHash(ctx context.Context, keyHash string) (*repository.RegulatorAPIKey, error) {
	k, ok := m.byHash[keyHash]
	if !ok {
		return nil, nil
	}
	return k, nil
}
func (m *tierTestStore) ListRegulatorAPIKeys(ctx context.Context) ([]*repository.RegulatorAPIKey, error) {
	return nil, nil
}
func (m *tierTestStore) RevokeRegulatorAPIKey(ctx context.Context, id uuid.UUID) error { return nil }
func (m *tierTestStore) TouchRegulatorAPIKeyLastUsed(ctx context.Context, id uuid.UUID) error {
	return nil
}
func (m *tierTestStore) InsertRegulatorAccessLog(ctx context.Context, req repository.InsertRegulatorAccessLogRequest) error {
	return nil
}
func (m *tierTestStore) ListRegulatorAccessLogs(ctx context.Context, limit int) ([]*repository.RegulatorAccessLogEntry, error) {
	return nil, nil
}

func TestDetectAccessTier_ScopedRegulatorKey(t *testing.T) {
	store := &tierTestStore{byHash: map[string]*repository.RegulatorAPIKey{}}
	svc := services.NewRegulatorKeyService(store, "")
	h := &Handler{regulatorKeyService: svc}

	tenantA := uuid.New()
	tenantB := uuid.New()
	passportID := uuid.New()

	resp, err := svc.GenerateKey(context.Background(), services.CreateRegulatorKeyRequest{
		Name: "Scoped", TenantIDs: []uuid.UUID{tenantA}, Markets: []string{"EU"},
	})
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/"+passportID.String(), nil)
	req.Header.Set("X-Regulator-Key", resp.Key)

	if tier := h.detectAccessTier(req, passportID, tenantA, "EU"); tier != models.AccessTierRegulator {
		t.Fatalf("in-scope key should be REGULATOR, got %v", tier)
	}
	if tier := h.detectAccessTier(req, passportID, tenantB, "EU"); tier == models.AccessTierRegulator {
		t.Fatal("out-of-scope tenant must not get REGULATOR")
	}
}

func TestDetectAccessTier_EnvBootstrap(t *testing.T) {
	svc := services.NewRegulatorKeyService(&tierTestStore{byHash: map[string]*repository.RegulatorAPIKey{}}, "env-global-secret")
	h := &Handler{regulatorKeyService: svc, regulatorAPIKey: "env-global-secret"}

	passportID := uuid.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Regulator-Key", "env-global-secret")

	tier := h.detectAccessTier(req, passportID, uuid.New(), "INDIA")
	if tier != models.AccessTierRegulator {
		t.Fatalf("env bootstrap should grant REGULATOR, got %v", tier)
	}
}

func TestDetectAccessTier_NoKeyIsPublic(t *testing.T) {
	h := &Handler{regulatorKeyService: services.NewRegulatorKeyService(&tierTestStore{}, "")}
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	tier := h.detectAccessTier(req, uuid.New(), uuid.New(), "EU")
	if tier != models.AccessTierPublic {
		t.Fatalf("expected PUBLIC, got %v", tier)
	}
}
