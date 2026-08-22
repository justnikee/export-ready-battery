// Package registry provides adapters for verifying certificates and
// registrations against external regulatory databases.
//
// Each adapter implements the RegistryAdapter interface. The verification
// strategy varies by registry:
//   - BIS: HTTP scraper of the public BIS CRS portal
//   - CPCB: EPR number format check only (no public CPCB API / ledger)
//   - EU NANDO: HTTP scraper of the public NANDO database
//   - UN38.3: Local lab-name allowlist + report format (not IAF/ILAC)
//
// Adapters are designed to degrade gracefully: if the external source is
// unreachable or its structure changes, the adapter returns a self_declared
// result with a descriptive message.
package registry

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
)

// VerifyResult is the normalized output of every adapter.
type VerifyResult struct {
	Status       models.RegistryVerificationStatus
	TrustTier    models.TrustTier
	VerifiedData map[string]interface{}
	ErrorMessage string
}

// RegistryAdapter defines the contract for all external registry integrations.
type RegistryAdapter interface {
	// Name returns the human-readable registry name.
	Name() string

	// Type returns the registry type constant.
	Type() models.RegistryType

	// IsConfigured returns true when the adapter has valid credentials/config.
	IsConfigured() bool

	// Verify checks a certificate/registration number against the registry.
	// ctx carries deadlines/timeouts. certificateNo may be empty for some
	// registries that lookup by batch metadata.
	Verify(ctx context.Context, certificateNo string, batchMetadata map[string]string) (*VerifyResult, error)
}

// AdapterRegistry holds all available adapters keyed by RegistryType.
type AdapterRegistry struct {
	adapters map[models.RegistryType]RegistryAdapter
}

// NewAdapterRegistry creates a registry with all built-in adapters.
// Adapters that lack configuration are still registered but return
// self_declared results.
func NewAdapterRegistry(cfg RegistryConfig, repo repository.RepositoryInterface) *AdapterRegistry {
	client := newRegistryHTTPClient(cfg.HTTPTimeout)
	return &AdapterRegistry{
		adapters: map[models.RegistryType]RegistryAdapter{
			models.RegistryTypeBIS:     newBISAdapter(cfg.BISBaseURL, client),
			models.RegistryTypeCPCB:    newCPCBAdapter(cfg.CPCBBaseURL, repo),
			models.RegistryTypeEUNANDO: newEUNANDOAdapter(cfg.EUNANDOBaseURL, client),
			models.RegistryTypeUN38_3:  newUN38Adapter(cfg.UN38BaseURL),
		},
	}
}

// RegistryConfig holds external registry configuration.
type RegistryConfig struct {
	BISBaseURL     string
	CPCBBaseURL    string
	EUNANDOBaseURL string
	UN38BaseURL    string
	HTTPTimeout    time.Duration
}

// Get returns the adapter for a given type, or nil if not found.
func (r *AdapterRegistry) Get(t models.RegistryType) RegistryAdapter {
	return r.adapters[t]
}

// All returns every registered adapter.
func (r *AdapterRegistry) All() []RegistryAdapter {
	out := make([]RegistryAdapter, 0, len(r.adapters))
	for _, a := range r.adapters {
		out = append(out, a)
	}
	return out
}

// ============================================================================
// Helpers
// ============================================================================

// selfDeclared returns a standard self-declared result used when an adapter
// is not configured or cannot reach the external registry.
func selfDeclared(registryName string, certificateNo string) *VerifyResult {
	slog.Info("registry adapter not configured, returning self_declared", "registry", registryName, "certificate", certificateNo)
	return &VerifyResult{
		Status:    models.RegistryStatusNotFound,
		TrustTier: models.TrustTierSelfDeclared,
		VerifiedData: map[string]interface{}{
			"message":         fmt.Sprintf("%s adapter not configured or external registry unreachable. Result is self-declared.", registryName),
			"certificate_no":  certificateNo,
		},
	}
}

// NormalizeRegistryType converts a string to the canonical RegistryType.
func NormalizeRegistryType(s string) (models.RegistryType, error) {
	switch s {
	case "bis", "BIS":
		return models.RegistryTypeBIS, nil
	case "cpcb", "CPCB":
		return models.RegistryTypeCPCB, nil
	case "eu_nando", "EU_NANDO", "nando":
		return models.RegistryTypeEUNANDO, nil
	case "un38_3", "UN38_3", "un38.3":
		return models.RegistryTypeUN38_3, nil
	case "custom":
		return models.RegistryTypeCustom, nil
	default:
		return "", fmt.Errorf("unknown registry type: %s", s)
	}
}

// VerifiedDataToJSON marshals verified data to JSON bytes.
func VerifiedDataToJSON(v map[string]interface{}) []byte {
	b, _ := json.Marshal(v)
	return b
}

// DefaultCacheTTL is how long verification results are considered fresh.
const DefaultCacheTTL = 7 * 24 * time.Hour
