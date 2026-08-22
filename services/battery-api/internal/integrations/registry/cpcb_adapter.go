package registry

import (
	"context"
	"log/slog"

	"github.com/anvayalabs/battery-api/internal/compliance/common"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
)

// cpcbAdapter checks that an EPR number matches the CPCB format.
// CPCB does not expose a public lookup API. A passing result is
// format_valid only — never registry_verified / official_api.
type cpcbAdapter struct {
	baseURL string
	repo    repository.RepositoryInterface
}

func newCPCBAdapter(baseURL string, repo repository.RepositoryInterface) *cpcbAdapter {
	return &cpcbAdapter{
		baseURL: baseURL,
		repo:    repo,
	}
}

func (a *cpcbAdapter) Name() string { return "CPCB EPR" }
func (a *cpcbAdapter) Type() models.RegistryType { return models.RegistryTypeCPCB }
func (a *cpcbAdapter) IsConfigured() bool { return a.repo != nil }

func (a *cpcbAdapter) Verify(ctx context.Context, certificateNo string, batchMetadata map[string]string) (*VerifyResult, error) {
	if !a.IsConfigured() {
		return selfDeclared(a.Name(), certificateNo), nil
	}

	// certificateNo is the EPR registration number stored on the tenant/batch
	eprNumber := certificateNo
	if eprNumber == "" {
		eprNumber = batchMetadata["epr_number"]
	}
	if eprNumber == "" {
		return &VerifyResult{
			Status:    models.RegistryStatusNotFound,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message": "No EPR registration number provided for this batch.",
			},
		}, nil
	}

	financialYear := currentIndianFinancialYear()

	if !common.IsValidEPRNumber(eprNumber) {
		return &VerifyResult{
			Status:    models.RegistryStatusFailed,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message":            "EPR registration number does not match CPCB format (B-XXXXX/YYYY-YY/CPCB).",
				"epr_number":         eprNumber,
				"financial_year":     financialYear,
				"verification_type":  "format_only",
			},
		}, nil
	}

	slog.Info("CPCB format check only — not a portal or ledger lookup", "epr_number", eprNumber, "fy", financialYear)

	return &VerifyResult{
		Status:    models.RegistryStatusFormatValid,
		TrustTier: models.TrustTierFormatValid,
		VerifiedData: map[string]interface{}{
			"epr_number":         eprNumber,
			"financial_year":     financialYear,
			"message":            "EPR number matches CPCB format. Not checked against the CPCB portal or an obligation ledger.",
			"verification_type":  "format_only",
			"portal_url":         a.baseURL,
		},
	}, nil
}

func currentIndianFinancialYear() string {
	return "FY2025-26"
}
