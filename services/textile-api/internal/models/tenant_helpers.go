package models

// EnsureTextileProfile initializes TextileProfile if nil and returns it.
func (t *Tenant) EnsureTextileProfile() *TextileTenantProfile {
	if t.TextileProfile == nil {
		t.TextileProfile = &TextileTenantProfile{TenantID: t.ID}
	}
	return t.TextileProfile
}
