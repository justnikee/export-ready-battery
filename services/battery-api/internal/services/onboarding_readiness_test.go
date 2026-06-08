package services

import (
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
)

func TestOnboardingReadinessService_IndiaOnly(t *testing.T) {
	svc := NewOnboardingReadinessService(nil)

	tenant := &models.Tenant{
		CompanyName:         "Test Co",
		Address:             "123 Test St",
		OnboardingCompleted: true,
	}
	tenant.EnsureBatteryProfile()
	tenant.BatteryProfile.EPRRegistrationNumber = "EPR-123"
	tenant.BatteryProfile.BISRNumber = "R-12345678"
	tenant.BatteryProfile.IECCode = "IEC1234567"
	tenant.BatteryProfile.MorthManufacturerCode = "TBC"
	tenant.BatteryProfile.EPRCertificatePath = "https://storage.example.com/epr.pdf"
	tenant.BatteryProfile.EPRStatus = "VERIFIED"
	tenant.BatteryProfile.BISCertificatePath = "https://storage.example.com/bis.pdf"
	tenant.BatteryProfile.BISStatus = "VERIFIED"

	result := svc.CheckReadiness(nil, tenant, []models.MarketRegion{models.MarketRegionIndia})

	if !result.India.Valid {
		t.Errorf("expected India to be valid, got score %.1f with %d gaps", result.India.Score, len(result.India.Gaps))
	}
	if result.India.Score != 100.0 {
		t.Errorf("expected score 100, got %.1f", result.India.Score)
	}
}

func TestOnboardingReadinessService_IndiaMissingCredentials(t *testing.T) {
	svc := NewOnboardingReadinessService(nil)

	tenant := &models.Tenant{
		CompanyName: "Test Co",
	}
	tenant.EnsureBatteryProfile()

	result := svc.CheckReadiness(nil, tenant, []models.MarketRegion{models.MarketRegionIndia})

	if result.India.Valid {
		t.Error("expected India to be invalid when credentials are missing")
	}
	if result.India.Score == 100.0 {
		t.Error("expected score below 100 when credentials are missing")
	}
	if len(result.India.Gaps) == 0 {
		t.Error("expected gaps when credentials are missing")
	}
}

func TestOnboardingReadinessService_EUOnly(t *testing.T) {
	svc := NewOnboardingReadinessService(nil)

	tenant := &models.Tenant{
		CompanyName: "Test Co",
		Address:     "123 Test St",
	}
	tenant.EnsureBatteryProfile()
	tenant.BatteryProfile.EUAuthorizedRepresentativeName = "EU Rep GmbH"
	tenant.BatteryProfile.EUAuthorizedRepresentativeAddress = "Berlin, Germany"
	tenant.BatteryProfile.EUContactEmail = "compliance@eurep.eu"

	result := svc.CheckReadiness(nil, tenant, []models.MarketRegion{models.MarketRegionEU})

	if !result.EU.Valid {
		t.Errorf("expected EU to be valid, got score %.1f with %d gaps", result.EU.Score, len(result.EU.Gaps))
	}
	if result.EU.Score != 100.0 {
		t.Errorf("expected score 100, got %.1f", result.EU.Score)
	}
}

func TestOnboardingReadinessService_EUMissingRep(t *testing.T) {
	svc := NewOnboardingReadinessService(nil)

	tenant := &models.Tenant{
		CompanyName: "Test Co",
		Address:     "123 Test St",
	}
	tenant.EnsureBatteryProfile()

	result := svc.CheckReadiness(nil, tenant, []models.MarketRegion{models.MarketRegionEU})

	if result.EU.Valid {
		t.Error("expected EU to be invalid when rep is missing")
	}
	if len(result.EU.Gaps) == 0 {
		t.Error("expected gaps when EU rep is missing")
	}
}

func TestOnboardingReadinessService_BothMarkets(t *testing.T) {
	svc := NewOnboardingReadinessService(nil)

	tenant := &models.Tenant{
		CompanyName: "Test Co",
		Address:     "123 Test St",
	}
	tenant.EnsureBatteryProfile()
	// India complete
	tenant.BatteryProfile.EPRRegistrationNumber = "EPR-123"
	tenant.BatteryProfile.BISRNumber = "R-12345678"
	tenant.BatteryProfile.IECCode = "IEC1234567"
	tenant.BatteryProfile.MorthManufacturerCode = "TBC"
	tenant.BatteryProfile.EPRCertificatePath = "https://storage.example.com/epr.pdf"
	tenant.BatteryProfile.EPRStatus = "VERIFIED"
	tenant.BatteryProfile.BISCertificatePath = "https://storage.example.com/bis.pdf"
	tenant.BatteryProfile.BISStatus = "VERIFIED"
	// EU complete
	tenant.BatteryProfile.EUAuthorizedRepresentativeName = "EU Rep GmbH"
	tenant.BatteryProfile.EUAuthorizedRepresentativeAddress = "Berlin, Germany"
	tenant.BatteryProfile.EUContactEmail = "compliance@eurep.eu"

	result := svc.CheckReadiness(nil, tenant, []models.MarketRegion{models.MarketRegionIndia, models.MarketRegionEU})

	if !result.India.Valid {
		t.Errorf("expected India valid, got score %.1f", result.India.Score)
	}
	if !result.EU.Valid {
		t.Errorf("expected EU valid, got score %.1f", result.EU.Score)
	}
}
