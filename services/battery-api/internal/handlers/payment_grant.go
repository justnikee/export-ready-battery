package handlers

import (
	"fmt"

	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

func paymentGrantForPurchase(tenantID uuid.UUID, paymentID string, pkg services.QuotaPackage) (repository.PaymentGrant, error) {
	grant := repository.PaymentGrant{
		TenantID: tenantID, PaymentID: paymentID, PackageName: pkg.Name,
		QuotaUnits: pkg.QuotaUnits, SeatBonus: pkg.SeatBonus,
	}
	switch pkg.Kind {
	case services.PackageKindTier:
		if pkg.PlanType == "" || pkg.BillingCycleDays <= 0 || pkg.QuotaUnits <= 0 {
			return repository.PaymentGrant{}, fmt.Errorf("tier package %s is incomplete", pkg.ID)
		}
		grant.PlanType = pkg.PlanType
		grant.BillingCycleDays = pkg.BillingCycleDays
	case services.PackageKindQuotaAddOn:
		if pkg.QuotaUnits <= 0 || pkg.SeatBonus != 0 {
			return repository.PaymentGrant{}, fmt.Errorf("quota package %s is invalid", pkg.ID)
		}
	case services.PackageKindSeatAddOn:
		if pkg.SeatBonus <= 0 || pkg.QuotaUnits != 0 {
			return repository.PaymentGrant{}, fmt.Errorf("seat package %s is invalid", pkg.ID)
		}
	default:
		return repository.PaymentGrant{}, fmt.Errorf("unknown package kind %s", pkg.Kind)
	}
	return grant, nil
}
