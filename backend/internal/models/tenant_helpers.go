package models

// EnsureBatteryProfile initializes BatteryProfile if nil and returns it.
func (t *Tenant) EnsureBatteryProfile() *BatteryTenantProfile {
	if t.BatteryProfile == nil {
		t.BatteryProfile = &BatteryTenantProfile{TenantID: t.ID}
	}
	return t.BatteryProfile
}

// EnsureTextileProfile initializes TextileProfile if nil and returns it.
func (t *Tenant) EnsureTextileProfile() *TextileTenantProfile {
	if t.TextileProfile == nil {
		t.TextileProfile = &TextileTenantProfile{TenantID: t.ID}
	}
	return t.TextileProfile
}
