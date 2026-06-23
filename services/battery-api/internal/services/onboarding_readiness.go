package services

import (
	"context"

	"github.com/anvayalabs/battery-api/internal/compliance"
	"github.com/anvayalabs/battery-api/internal/compliance/battery"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
)

// OnboardingReadinessService evaluates a tenant's profile against market-specific
// compliance requirements without needing a batch. It reuses the tenant-level
// checks extracted from IndiaValidator and EUValidator.
type OnboardingReadinessService struct {
	repo repository.RepositoryInterface
}

// NewOnboardingReadinessService creates a new readiness evaluator.
func NewOnboardingReadinessService(repo repository.RepositoryInterface) *OnboardingReadinessService {
	return &OnboardingReadinessService{repo: repo}
}

// MarketReadiness holds the result for a single market.
type MarketReadiness struct {
	Score  float64         `json:"score"`
	Valid  bool            `json:"valid"`
	Gaps   []compliance.Gap `json:"gaps,omitempty"`
}

// ReadinessResult is the response shape for the onboarding readiness endpoint.
type ReadinessResult struct {
	India MarketReadiness `json:"india,omitempty"`
	EU    MarketReadiness `json:"eu,omitempty"`
}

// CheckReadiness runs tenant-level compliance checks for the requested markets.
// It does NOT require a batch and is safe to call during onboarding.
func (s *OnboardingReadinessService) CheckReadiness(ctx context.Context, tenant *models.Tenant, markets []models.MarketRegion) ReadinessResult {
	result := ReadinessResult{}

	for _, mr := range markets {
		switch mr {
		case models.MarketRegionIndia:
			gaps := battery.ValidateIndiaTenant(tenant)
			errors := 0
			for _, g := range gaps {
				if g.Severity == "ERROR" {
					errors++
				}
			}
			// India tenant checkpoints: 4 credentials + up to 3 certificates = 7
			const indiaTenantCheckpoints = 7
			score := compliance.ScoreFromCheckpoints(indiaTenantCheckpoints, errors)
			result.India = MarketReadiness{
				Score: score,
				Valid: errors == 0,
				Gaps:  gaps,
			}

		case models.MarketRegionEU:
			gaps := battery.ValidateEUTenant(tenant)
			errors := 0
			for _, g := range gaps {
				if g.Severity == "ERROR" {
					errors++
				}
			}
			// EU tenant checkpoints: company_name, address, rep_name, rep_address, email = 5
			const euTenantCheckpoints = 5
			score := compliance.ScoreFromCheckpoints(euTenantCheckpoints, errors)
			result.EU = MarketReadiness{
				Score: score,
				Valid: errors == 0,
				Gaps:  gaps,
			}
		}
	}

	return result
}
