package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/google/uuid"
)

// Regulator key access outcomes (audit).
const (
	RegulatorOutcomeAllowed       = "allowed"
	RegulatorOutcomeDeniedScope   = "denied_scope"
	RegulatorOutcomeDeniedInvalid = "denied_invalid"
)

// Regulator key sources (audit attribution).
const (
	RegulatorSourceDB         = "db"
	RegulatorSourceEnv        = "env"
	RegulatorSourceDataAccess = "data_access"
)

// RegulatorKeyStore is the persistence surface used by RegulatorKeyService.
// Implemented by *repository.Repository; tests can supply a fake.
type RegulatorKeyStore interface {
	CreateRegulatorAPIKey(ctx context.Context, req repository.CreateRegulatorAPIKeyRequest) (*repository.RegulatorAPIKey, error)
	GetRegulatorAPIKeyByHash(ctx context.Context, keyHash string) (*repository.RegulatorAPIKey, error)
	ListRegulatorAPIKeys(ctx context.Context) ([]*repository.RegulatorAPIKey, error)
	RevokeRegulatorAPIKey(ctx context.Context, id uuid.UUID) error
	TouchRegulatorAPIKeyLastUsed(ctx context.Context, id uuid.UUID) error
	InsertRegulatorAccessLog(ctx context.Context, req repository.InsertRegulatorAccessLogRequest) error
	ListRegulatorAccessLogs(ctx context.Context, limit int) ([]*repository.RegulatorAccessLogEntry, error)
}

// RegulatorKeyService manages Art. 78 regulator credentials and access audit.
type RegulatorKeyService struct {
	store         RegulatorKeyStore
	envBootstrap  string // optional global REGULATOR_API_KEY for local/bootstrap only
}

// NewRegulatorKeyService creates a service. envBootstrap may be empty.
func NewRegulatorKeyService(store RegulatorKeyStore, envBootstrap string) *RegulatorKeyService {
	return &RegulatorKeyService{store: store, envBootstrap: envBootstrap}
}

// CreateRegulatorKeyRequest is the admin create payload.
type CreateRegulatorKeyRequest struct {
	Name         string      `json:"name"`
	Organization string      `json:"organization"`
	TenantIDs    []uuid.UUID `json:"tenant_ids"` // empty = all tenants
	Markets      []string    `json:"markets"`    // empty = all; e.g. EU, INDIA, GLOBAL
	ExpiresIn    *string     `json:"expires_in"` // optional Go duration, e.g. "720h"
	Notes        string      `json:"notes"`
}

// CreateRegulatorKeyResponse returns the raw key once.
type CreateRegulatorKeyResponse struct {
	Key      string                     `json:"key"` // raw secret — show once
	Metadata *repository.RegulatorAPIKey `json:"metadata"`
}

// RegulatorAuthResult is the outcome of validating X-Regulator-Key for a passport.
type RegulatorAuthResult struct {
	Allowed   bool
	KeyID     *uuid.UUID
	KeyName   string
	KeySource string
	Outcome   string
}

// HashRegulatorKey returns SHA-256 hex of a raw key (same scheme as data access tokens).
func HashRegulatorKey(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

// TenantInScope reports whether tenantID is allowed by the key's tenant_ids list.
// Empty list = all tenants.
func TenantInScope(allowed []uuid.UUID, tenantID uuid.UUID) bool {
	if len(allowed) == 0 {
		return true
	}
	if tenantID == uuid.Nil {
		return false
	}
	for _, id := range allowed {
		if id == tenantID {
			return true
		}
	}
	return false
}

// MarketInScope reports whether market is allowed by the key's markets list.
// Empty list = all markets. Comparison is case-insensitive.
func MarketInScope(allowed []string, market string) bool {
	if len(allowed) == 0 {
		return true
	}
	m := strings.ToUpper(strings.TrimSpace(market))
	if m == "" {
		return false
	}
	for _, a := range allowed {
		if strings.EqualFold(strings.TrimSpace(a), m) {
			return true
		}
	}
	return false
}

// GenerateKey creates a scoped regulator credential; raw key returned once.
func (s *RegulatorKeyService) GenerateKey(ctx context.Context, req CreateRegulatorKeyRequest) (*CreateRegulatorKeyResponse, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return nil, fmt.Errorf("name is required")
	}

	markets := normalizeMarkets(req.Markets)
	var expiresAt *time.Time
	if req.ExpiresIn != nil && strings.TrimSpace(*req.ExpiresIn) != "" {
		d, err := time.ParseDuration(strings.TrimSpace(*req.ExpiresIn))
		if err != nil {
			return nil, fmt.Errorf("invalid expires_in: %w", err)
		}
		if d <= 0 {
			return nil, fmt.Errorf("expires_in must be positive")
		}
		t := time.Now().Add(d)
		expiresAt = &t
	}

	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return nil, fmt.Errorf("generate key: %w", err)
	}
	rawKey := "reg_" + hex.EncodeToString(rawBytes)
	hash := HashRegulatorKey(rawKey)
	prefix := rawKey
	if len(prefix) > 12 {
		prefix = prefix[:12]
	}

	meta, err := s.store.CreateRegulatorAPIKey(ctx, repository.CreateRegulatorAPIKeyRequest{
		Name:         name,
		Organization: strings.TrimSpace(req.Organization),
		KeyHash:      hash,
		KeyPrefix:    prefix,
		TenantIDs:    req.TenantIDs,
		Markets:      markets,
		ExpiresAt:    expiresAt,
		Notes:        strings.TrimSpace(req.Notes),
	})
	if err != nil {
		return nil, err
	}

	return &CreateRegulatorKeyResponse{Key: rawKey, Metadata: meta}, nil
}

// ListKeys returns all regulator credentials (metadata only).
func (s *RegulatorKeyService) ListKeys(ctx context.Context) ([]*repository.RegulatorAPIKey, error) {
	return s.store.ListRegulatorAPIKeys(ctx)
}

// RevokeKey soft-revokes a credential.
func (s *RegulatorKeyService) RevokeKey(ctx context.Context, id uuid.UUID) error {
	return s.store.RevokeRegulatorAPIKey(ctx, id)
}

// ListAccessLogs returns recent regulator access audit rows.
func (s *RegulatorKeyService) ListAccessLogs(ctx context.Context, limit int) ([]*repository.RegulatorAccessLogEntry, error) {
	return s.store.ListRegulatorAccessLogs(ctx, limit)
}

// AuthorizeRegulatorKey validates X-Regulator-Key for a specific passport tenant/market.
// Order: DB-backed keys first, then env bootstrap (global, always audited).
func (s *RegulatorKeyService) AuthorizeRegulatorKey(
	ctx context.Context,
	rawKey string,
	passportID uuid.UUID,
	tenantID uuid.UUID,
	market string,
	clientIP, userAgent string,
) RegulatorAuthResult {
	rawKey = strings.TrimSpace(rawKey)
	if rawKey == "" {
		return RegulatorAuthResult{Allowed: false, Outcome: RegulatorOutcomeDeniedInvalid, KeySource: RegulatorSourceDB}
	}

	// 1) DB-backed scoped keys
	if s != nil && s.store != nil {
		rec, err := s.store.GetRegulatorAPIKeyByHash(ctx, HashRegulatorKey(rawKey))
		if err != nil {
			slog.Error("regulator key lookup failed", "error", err)
		} else if rec != nil {
			if rec.ExpiresAt != nil && time.Now().After(*rec.ExpiresAt) {
				s.logAccess(ctx, &rec.ID, RegulatorSourceDB, rec.Name, passportID, tenantID, market, clientIP, userAgent, RegulatorOutcomeDeniedInvalid)
				return RegulatorAuthResult{
					Allowed: false, KeyID: &rec.ID, KeyName: rec.Name, KeySource: RegulatorSourceDB, Outcome: RegulatorOutcomeDeniedInvalid,
				}
			}
			if !TenantInScope(rec.TenantIDs, tenantID) || !MarketInScope(rec.Markets, market) {
				s.logAccess(ctx, &rec.ID, RegulatorSourceDB, rec.Name, passportID, tenantID, market, clientIP, userAgent, RegulatorOutcomeDeniedScope)
				return RegulatorAuthResult{
					Allowed: false, KeyID: &rec.ID, KeyName: rec.Name, KeySource: RegulatorSourceDB, Outcome: RegulatorOutcomeDeniedScope,
				}
			}
			go func(id uuid.UUID) {
				_ = s.store.TouchRegulatorAPIKeyLastUsed(context.Background(), id)
			}(rec.ID)
			s.logAccess(ctx, &rec.ID, RegulatorSourceDB, rec.Name, passportID, tenantID, market, clientIP, userAgent, RegulatorOutcomeAllowed)
			return RegulatorAuthResult{
				Allowed: true, KeyID: &rec.ID, KeyName: rec.Name, KeySource: RegulatorSourceDB, Outcome: RegulatorOutcomeAllowed,
			}
		}
	}

	// 2) Env bootstrap — global scope (dev/emergency). Prefer DB keys in production.
	if s != nil && s.envBootstrap != "" &&
		subtle.ConstantTimeCompare([]byte(rawKey), []byte(s.envBootstrap)) == 1 {
		s.logAccess(ctx, nil, RegulatorSourceEnv, "env:REGULATOR_API_KEY", passportID, tenantID, market, clientIP, userAgent, RegulatorOutcomeAllowed)
		slog.Info("regulator access via env REGULATOR_API_KEY (global bootstrap)",
			"passport_id", passportID, "tenant_id", tenantID)
		return RegulatorAuthResult{
			Allowed: true, KeyName: "env:REGULATOR_API_KEY", KeySource: RegulatorSourceEnv, Outcome: RegulatorOutcomeAllowed,
		}
	}

	// Invalid key presented
	s.logAccess(ctx, nil, RegulatorSourceDB, "", passportID, tenantID, market, clientIP, userAgent, RegulatorOutcomeDeniedInvalid)
	return RegulatorAuthResult{Allowed: false, Outcome: RegulatorOutcomeDeniedInvalid, KeySource: RegulatorSourceDB}
}

// LogDataAccessRegulator records a successful tenant-scoped data_access REGULATOR read.
func (s *RegulatorKeyService) LogDataAccessRegulator(
	ctx context.Context,
	tokenLabel string,
	passportID, tenantID uuid.UUID,
	market, clientIP, userAgent string,
) {
	if s == nil {
		return
	}
	s.logAccess(ctx, nil, RegulatorSourceDataAccess, tokenLabel, passportID, tenantID, market, clientIP, userAgent, RegulatorOutcomeAllowed)
}

func (s *RegulatorKeyService) logAccess(
	ctx context.Context,
	keyID *uuid.UUID,
	source, name string,
	passportID, tenantID uuid.UUID,
	market, clientIP, userAgent, outcome string,
) {
	if s == nil || s.store == nil {
		return
	}
	var pID, tID *uuid.UUID
	if passportID != uuid.Nil {
		pID = &passportID
	}
	if tenantID != uuid.Nil {
		tID = &tenantID
	}
	// Best-effort audit — never fail the request path on log errors.
	go func() {
		err := s.store.InsertRegulatorAccessLog(context.Background(), repository.InsertRegulatorAccessLogRequest{
			KeyID:        keyID,
			KeySource:    source,
			KeyName:      name,
			PassportID:   pID,
			TenantID:     tID,
			MarketRegion: market,
			ClientIP:     clientIP,
			UserAgent:    userAgent,
			Outcome:      outcome,
		})
		if err != nil {
			slog.Warn("failed to write regulator access log", "error", err)
		}
	}()
}

func normalizeMarkets(in []string) []string {
	if len(in) == 0 {
		return []string{}
	}
	seen := make(map[string]struct{}, len(in))
	out := make([]string, 0, len(in))
	for _, m := range in {
		u := strings.ToUpper(strings.TrimSpace(m))
		if u == "" {
			continue
		}
		if _, ok := seen[u]; ok {
			continue
		}
		seen[u] = struct{}{}
		out = append(out, u)
	}
	return out
}
