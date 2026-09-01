package services

import (
	"testing"
	"time"
)

func TestPlanIncludes(t *testing.T) {
	cases := []struct {
		plan    string
		feature Feature
		want    bool
	}{
		// Core feature (not in map) — always included, even on Starter.
		{PlanStarter, Feature("dashboard"), true},
		// Growth feature.
		{PlanStarter, FeatureEUCompliance, false},
		{PlanGrowth, FeatureEUCompliance, true},
		{PlanEnterprise, FeatureEUCompliance, true},
		{PlanStarter, FeaturePartners, true},
		{PlanStarter, FeatureDeveloper, false},
		{PlanGrowth, FeatureDeveloper, true},
		{PlanStarter, FeatureRegulatory, false},
		{PlanGrowth, FeatureRegulatory, true},
		// Enterprise-only feature.
		{PlanGrowth, FeatureSSO, false},
		{PlanEnterprise, FeatureSSO, true},
		// Unknown/empty plan defaults to Starter floor.
		{"", FeatureEUCompliance, false},
		{"garbage", FeatureFleet, false},
		{"growth", FeatureFleet, true}, // case-insensitive
	}
	for _, c := range cases {
		if got := PlanIncludes(c.plan, c.feature); got != c.want {
			t.Errorf("PlanIncludes(%q, %q) = %v, want %v", c.plan, c.feature, got, c.want)
		}
	}
}

func TestEntitlementsForPlan(t *testing.T) {
	starter := EntitlementsForPlan(PlanStarter)
	if starter[string(FeatureEUCompliance)] {
		t.Error("Starter should NOT include eu_compliance")
	}
	if !starter[string(FeaturePartners)] {
		t.Error("Starter should include partners (core DPP spine)")
	}
	growth := EntitlementsForPlan(PlanGrowth)
	if !growth[string(FeatureEUCompliance)] {
		t.Error("Growth should include eu_compliance")
	}
	if growth[string(FeatureSSO)] {
		t.Error("Growth should NOT include sso (enterprise-only)")
	}
	ent := EntitlementsForPlan(PlanEnterprise)
	for f := range featureMinPlan {
		if !ent[string(f)] {
			t.Errorf("Enterprise should include every gated feature, missing %q", f)
		}
	}
}

func TestIsSubscriptionExpired(t *testing.T) {
	past := time.Now().Add(-time.Hour)
	future := time.Now().Add(time.Hour)

	cases := []struct {
		name       string
		planStatus string
		expiresAt  *time.Time
		want       bool
	}{
		{"explicitly expired status", "EXPIRED", nil, true},
		{"explicitly expired status, lowercase", "expired", nil, true},
		{"active status, no expiry set (new tenant)", "ACTIVE", nil, false},
		{"active status, expiry in the future", "ACTIVE", &future, false},
		{"active status, expiry in the past", "ACTIVE", &past, true},
		{"empty status, expiry in the past", "", &past, true},
		{"empty status, no expiry", "", nil, false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := IsSubscriptionExpired(c.planStatus, c.expiresAt); got != c.want {
				t.Errorf("IsSubscriptionExpired(%q, %v) = %v, want %v", c.planStatus, c.expiresAt, got, c.want)
			}
		})
	}
}
