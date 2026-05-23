package models

// EnsureBatteryProfile initializes BatteryProfile if nil and returns it.
func (t *Tenant) EnsureBatteryProfile() *BatteryTenantProfile {
	if t.BatteryProfile == nil {
		t.BatteryProfile = &BatteryTenantProfile{TenantID: t.ID}
	}
	return t.BatteryProfile
}

