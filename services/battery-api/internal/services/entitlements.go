package services

import (
	"strings"
	"time"
)

// Feature is a plan-gated capability. Features NOT listed in featureMinPlan are
// "core" — included on every plan. This map is the single source of truth for
// plan entitlements; the frontend mirrors it (see lib/entitlements). Keep the
// string values stable — they appear in 402 responses and the frontend config.
type Feature string

const (
	// Growth-tier features
	FeatureEUCompliance Feature = "eu_compliance"
	FeatureMassBalance  Feature = "mass_balance"
	FeatureDueDiligence Feature = "due_diligence"
	FeatureDGFT         Feature = "dgft_claims"
	FeatureFleet        Feature = "fleet"
	FeatureTelemetry    Feature = "telemetry"
	FeaturePartners     Feature = "partners"  // core: INSTALL/RECYCLE magic links
	FeatureDeveloper    Feature = "developer" // API keys, webhooks, Tally sync
	FeatureRegulatory   Feature = "regulatory"

	// Enterprise-tier features
	FeatureSSO               Feature = "sso"
	FeatureMultiEntity       Feature = "multi_entity"
	FeatureAdvancedAnalytics Feature = "advanced_analytics"
)

// Plan identifiers (mirror models.PlanType* — duplicated here to avoid a models
// import cycle and to keep this file the entitlement source of truth).
const (
	PlanStarter    = "STARTER"
	PlanGrowth     = "GROWTH"
	PlanEnterprise = "ENTERPRISE"
)

var planRank = map[string]int{
	PlanStarter:    1,
	PlanGrowth:     2,
	PlanEnterprise: 3,
}

// featureMinPlan maps a gated feature to the minimum plan that unlocks it.
var featureMinPlan = map[Feature]string{
	FeatureEUCompliance: PlanGrowth,
	FeatureMassBalance:  PlanGrowth,
	FeatureDueDiligence: PlanGrowth,
	FeatureDGFT:         PlanGrowth,
	FeatureFleet:        PlanGrowth,
	FeatureTelemetry:    PlanGrowth,
	FeatureDeveloper:    PlanGrowth,
	FeatureRegulatory:   PlanGrowth,

	FeatureSSO:               PlanEnterprise,
	FeatureMultiEntity:       PlanEnterprise,
	FeatureAdvancedAnalytics: PlanGrowth,
}

// NormalizePlan upper-cases and validates a plan string, defaulting unknown/empty
// values to STARTER (the safe floor).
func NormalizePlan(plan string) string {
	p := strings.ToUpper(strings.TrimSpace(plan))
	if _, ok := planRank[p]; ok {
		return p
	}
	return PlanStarter
}

// PlanIncludes reports whether a plan unlocks a feature. Core features (not in
// featureMinPlan) are always included.
func PlanIncludes(plan string, f Feature) bool {
	minPlan, gated := featureMinPlan[f]
	if !gated {
		return true
	}
	return planRank[NormalizePlan(plan)] >= planRank[minPlan]
}

// RequiredPlan returns the minimum plan for a feature, or "" if it's a core feature.
func RequiredPlan(f Feature) string {
	return featureMinPlan[f]
}

// EntitlementsForPlan returns the gated feature → allowed map for a plan. The
// frontend consumes this (via /auth/me) to lock nav items and show upgrade CTAs.
func EntitlementsForPlan(plan string) map[string]bool {
	out := make(map[string]bool, len(featureMinPlan)+1)
	for f := range featureMinPlan {
		out[string(f)] = PlanIncludes(plan, f)
	}
	// Partners is core (INSTALL/RECYCLE magic links). Always true so /auth/me
	// does not leave a stale false from when this was Growth-gated.
	out[string(FeaturePartners)] = true
	return out
}

// IsSubscriptionExpired reports whether a tenant's subscription should be
// treated as lapsed: either explicitly marked EXPIRED, or past its expiry
// timestamp. This is the single source of truth for expiry — used by both
// RequireOnboardingComplete (write routes) and RequireFeature (Growth-feature
// routes, including reads) so a lapsed subscription can't retain indefinite
// access to paid features just because plan_type is never reset on expiry.
func IsSubscriptionExpired(planStatus string, expiresAt *time.Time) bool {
	if strings.EqualFold(planStatus, "EXPIRED") {
		return true
	}
	return expiresAt != nil && time.Now().After(*expiresAt)
}
