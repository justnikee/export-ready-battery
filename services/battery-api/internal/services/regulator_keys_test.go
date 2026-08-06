package services

import (
	"context"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

type memRegulatorStore struct {
	byHash map[string]*repository.RegulatorAPIKey
	logs   []repository.InsertRegulatorAccessLogRequest
}

func newMemStore() *memRegulatorStore {
	return &memRegulatorStore{byHash: make(map[string]*repository.RegulatorAPIKey)}
}

func (m *memRegulatorStore) CreateRegulatorAPIKey(ctx context.Context, req repository.CreateRegulatorAPIKeyRequest) (*repository.RegulatorAPIKey, error) {
	k := &repository.RegulatorAPIKey{
		ID:           uuid.New(),
		Name:         req.Name,
		Organization: req.Organization,
		KeyHash:      req.KeyHash,
		KeyPrefix:    req.KeyPrefix,
		TenantIDs:    req.TenantIDs,
		Markets:      req.Markets,
		IsActive:     true,
		ExpiresAt:    req.ExpiresAt,
		Notes:        req.Notes,
		CreatedAt:    time.Now(),
	}
	m.byHash[req.KeyHash] = k
	return k, nil
}

func (m *memRegulatorStore) GetRegulatorAPIKeyByHash(ctx context.Context, keyHash string) (*repository.RegulatorAPIKey, error) {
	k, ok := m.byHash[keyHash]
	if !ok || !k.IsActive {
		return nil, nil
	}
	return k, nil
}

func (m *memRegulatorStore) ListRegulatorAPIKeys(ctx context.Context) ([]*repository.RegulatorAPIKey, error) {
	return nil, nil
}
func (m *memRegulatorStore) RevokeRegulatorAPIKey(ctx context.Context, id uuid.UUID) error { return nil }
func (m *memRegulatorStore) TouchRegulatorAPIKeyLastUsed(ctx context.Context, id uuid.UUID) error {
	return nil
}
func (m *memRegulatorStore) InsertRegulatorAccessLog(ctx context.Context, req repository.InsertRegulatorAccessLogRequest) error {
	m.logs = append(m.logs, req)
	return nil
}
func (m *memRegulatorStore) ListRegulatorAccessLogs(ctx context.Context, limit int) ([]*repository.RegulatorAccessLogEntry, error) {
	return nil, nil
}

func TestTenantInScope(t *testing.T) {
	a := uuid.New()
	b := uuid.New()
	if !TenantInScope(nil, a) {
		t.Fatal("empty scope should allow all")
	}
	if !TenantInScope([]uuid.UUID{}, a) {
		t.Fatal("empty slice should allow all")
	}
	if !TenantInScope([]uuid.UUID{a, b}, a) {
		t.Fatal("listed tenant should be allowed")
	}
	if TenantInScope([]uuid.UUID{a}, b) {
		t.Fatal("foreign tenant must be denied")
	}
}

func TestMarketInScope(t *testing.T) {
	if !MarketInScope(nil, "EU") {
		t.Fatal("empty markets allow all")
	}
	if !MarketInScope([]string{"EU", "INDIA"}, "eu") {
		t.Fatal("case-insensitive match")
	}
	if MarketInScope([]string{"EU"}, "INDIA") {
		t.Fatal("INDIA not in EU-only scope")
	}
}

func TestAuthorizeRegulatorKey_ScopedDB(t *testing.T) {
	store := newMemStore()
	svc := NewRegulatorKeyService(store, "")

	tenantOK := uuid.New()
	tenantOther := uuid.New()
	passportID := uuid.New()

	resp, err := svc.GenerateKey(context.Background(), CreateRegulatorKeyRequest{
		Name:      "BAFA DE",
		TenantIDs: []uuid.UUID{tenantOK},
		Markets:   []string{"EU"},
	})
	if err != nil {
		t.Fatal(err)
	}

	// Allowed: matching tenant + market
	got := svc.AuthorizeRegulatorKey(context.Background(), resp.Key, passportID, tenantOK, "EU", "1.2.3.4", "test")
	if !got.Allowed || got.KeySource != RegulatorSourceDB {
		t.Fatalf("expected allowed db key, got %+v", got)
	}

	// Denied: wrong tenant
	got = svc.AuthorizeRegulatorKey(context.Background(), resp.Key, passportID, tenantOther, "EU", "1.2.3.4", "test")
	if got.Allowed || got.Outcome != RegulatorOutcomeDeniedScope {
		t.Fatalf("expected denied_scope for wrong tenant, got %+v", got)
	}

	// Denied: wrong market
	got = svc.AuthorizeRegulatorKey(context.Background(), resp.Key, passportID, tenantOK, "INDIA", "1.2.3.4", "test")
	if got.Allowed || got.Outcome != RegulatorOutcomeDeniedScope {
		t.Fatalf("expected denied_scope for wrong market, got %+v", got)
	}

	// Invalid key
	got = svc.AuthorizeRegulatorKey(context.Background(), "reg_deadbeef", passportID, tenantOK, "EU", "1.2.3.4", "test")
	if got.Allowed || got.Outcome != RegulatorOutcomeDeniedInvalid {
		t.Fatalf("expected denied_invalid, got %+v", got)
	}
}

func TestAuthorizeRegulatorKey_EnvBootstrap(t *testing.T) {
	store := newMemStore()
	svc := NewRegulatorKeyService(store, "super-secret-env-key")
	passportID := uuid.New()
	tenantID := uuid.New()

	got := svc.AuthorizeRegulatorKey(context.Background(), "super-secret-env-key", passportID, tenantID, "EU", "9.9.9.9", "ua")
	if !got.Allowed || got.KeySource != RegulatorSourceEnv {
		t.Fatalf("env key should allow globally, got %+v", got)
	}

	// Wait briefly for async log
	time.Sleep(20 * time.Millisecond)
	if len(store.logs) == 0 {
		t.Fatal("expected access log for env key")
	}
}

func TestAuthorizeRegulatorKey_Expired(t *testing.T) {
	store := newMemStore()
	svc := NewRegulatorKeyService(store, "")
	past := time.Now().Add(-time.Hour)
	raw := "reg_" + "aa"
	// Manually insert expired key
	hash := HashRegulatorKey(raw)
	store.byHash[hash] = &repository.RegulatorAPIKey{
		ID: uuid.New(), Name: "expired", KeyHash: hash, IsActive: true, ExpiresAt: &past,
		TenantIDs: []uuid.UUID{}, Markets: []string{},
	}

	got := svc.AuthorizeRegulatorKey(context.Background(), raw, uuid.New(), uuid.New(), "EU", "", "")
	if got.Allowed || got.Outcome != RegulatorOutcomeDeniedInvalid {
		t.Fatalf("expired key must be denied, got %+v", got)
	}
}

func TestHashRegulatorKey_Stable(t *testing.T) {
	a := HashRegulatorKey("reg_abc")
	b := HashRegulatorKey("reg_abc")
	if a != b || len(a) != 64 {
		t.Fatalf("hash unstable or wrong length: %s", a)
	}
	if HashRegulatorKey("reg_abc") == HashRegulatorKey("reg_abd") {
		t.Fatal("different keys must not collide")
	}
}
