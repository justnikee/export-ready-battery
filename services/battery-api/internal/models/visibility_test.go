package models

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestSettingsVisibilityContract(t *testing.T) {
	for _, raw := range []string{`{"battery_composition":"REGULATOR","supply_chain":"REGULATOR","lifecycle_metrics":"REGULATOR","compliance_docs":"REGULATOR"}`, `{"field_visibility":{"battery_composition":{"min_tier":"REGULATOR"},"supply_chain":{"min_tier":"REGULATOR"},"lifecycle_metrics":{"min_tier":"REGULATOR"},"compliance_docs":{"min_tier":"REGULATOR"}}}`} {
		dc := ParseDisplayConfig(json.RawMessage(raw))
		for _, tier := range []AccessTier{AccessTierPublic, AccessTierPartner, AccessTierRegulator} {
			count := 99
			soh := 98.0
			view := &PartnerPassportView{PublicPassportView: PublicPassportView{AccessTier: tier, Specs: &PublicSpecsView{Chemistry: "secret chemistry", Components: []Component{{Manufacturer: "secret supplier"}}, ExpectedLifetimeCycles: &count, PerformanceSpec: &PerformanceSpec{}}, StateOfHealth: &soh, Tenant: &PublicTenantView{BISCertificatePath: "secret certificate"}, DeclarationOfConformityPath: "secret doc"}, CycleCount: &count, SupplyChainProvenance: &SupplyChainProvenance{}}
			ApplyDisplayConfigToPartnerView(view, dc)
			encoded, _ := json.Marshal(view)
			if tier != AccessTierRegulator && strings.Contains(string(encoded), "secret") {
				t.Fatalf("tier %s leaks: %s", tier, encoded)
			}
			if tier != AccessTierRegulator && (view.CycleCount != nil || view.Specs.ExpectedLifetimeCycles != nil || view.SupplyChainProvenance != nil) {
				t.Fatal("restricted partner fields remain")
			}
			if tier == AccessTierRegulator && !strings.Contains(string(encoded), "secret chemistry") {
				t.Fatal("regulator lost access")
			}
		}
	}
}

func TestVisibilityDefaultsAndInvalidValues(t *testing.T) {
	for _, raw := range []string{"", `{}`, `null`} {
		dc := ParseDisplayConfig(json.RawMessage(raw))
		if dc.IsFieldVisible("supply_chain", AccessTierPublic) || !dc.IsFieldVisible("supply_chain", AccessTierPartner) {
			t.Fatalf("default differs from settings UI: %s", raw)
		}
	}
	for _, raw := range []string{`{"supply_chain":"unknown"}`, `broken`} {
		if ParseDisplayConfig(json.RawMessage(raw)).IsFieldVisible("supply_chain", AccessTierPartner) {
			t.Fatalf("malformed rule opened access: %s", raw)
		}
	}
	dc := ParseDisplayConfig(json.RawMessage(`{"supply_chain":"PUBLIC"}`))
	if !dc.IsFieldVisible("supply_chain", AccessTierPublic) {
		t.Fatal("explicit public ignored")
	}
}
