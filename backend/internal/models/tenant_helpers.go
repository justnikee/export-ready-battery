package models

// EnsureBatteryProfile initializes BatteryProfile if nil and returns it.
// Copies legacy flat-field values when creating the profile for the first time
// to bridge the transition from flat fields to profile tables.
func (t *Tenant) EnsureBatteryProfile() *BatteryTenantProfile {
	if t.BatteryProfile == nil {
		t.BatteryProfile = &BatteryTenantProfile{
			TenantID:                       t.ID,
			EPRRegistrationNumber:          t.EPRRegistrationNumber,
			BISRNumber:                     t.BISRNumber,
			IECCode:                        t.IECCode,
			MorthManufacturerCode:          t.MorthManufacturerCode,
			MorthFactoryCodes:              t.MorthFactoryCodes,
			EPRCertificatePath:             t.EPRCertificatePath,
			BISCertificatePath:             t.BISCertificatePath,
			PLICertificatePath:             t.PLICertificatePath,
			EPRStatus:                      t.EPRStatus,
			BISStatus:                      t.BISStatus,
			PLIStatus:                      t.PLIStatus,
			EUAuthorizedRepresentativeName:    t.EUAuthorizedRepresentativeName,
			EUAuthorizedRepresentativeAddress: t.EUAuthorizedRepresentativeAddress,
			EUContactEmail:                    t.EUContactEmail,
		}
	}
	return t.BatteryProfile
}

// EnsureTextileProfile initializes TextileProfile if nil and returns it.
// Copies legacy flat-field values when creating the profile for the first time
// to bridge the transition from flat fields to profile tables.
func (t *Tenant) EnsureTextileProfile() *TextileTenantProfile {
	if t.TextileProfile == nil {
		t.TextileProfile = &TextileTenantProfile{
			TenantID:           t.ID,
			FacilityType:       t.TextileFacilityType,
			SupplyChainTier:    t.TextileSupplyChainTier,
			PrimaryMarkets:     t.TextilePrimaryMarkets,
			DefaultFiberTypes:  t.TextileDefaultFiberTypes,
			Certifications:     t.TextileCertifications,
			ComplianceDefaults: t.TextileComplianceDefaults,
		}
	}
	return t.TextileProfile
}
