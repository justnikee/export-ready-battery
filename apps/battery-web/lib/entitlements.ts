/**
 * Plan-gated feature keys — MUST mirror services/battery-api/internal/services/entitlements.go.
 * This is UX only: the backend's RequireFeature middleware is the real gate
 * (returns 402 { feature, required_plan, current_plan, upgrade_url }). This file
 * exists so the frontend can lock nav items and show upgrade prompts before the
 * user ever hits the API.
 */
export type Feature =
  | "eu_compliance"
  | "mass_balance"
  | "due_diligence"
  | "dgft_claims"
  | "fleet"
  | "telemetry"
  | "partners"
  | "developer"
  | "regulatory"
  | "sso"
  | "multi_entity"
  | "advanced_analytics";

export type PlanType = "STARTER" | "GROWTH" | "ENTERPRISE";

const PLAN_RANK: Record<PlanType, number> = {
  STARTER: 1,
  GROWTH: 2,
  ENTERPRISE: 3,
};

/** Minimum plan required to unlock each gated feature. Absent = core (all plans). */
export const FEATURE_MIN_PLAN: Partial<Record<Feature, PlanType>> = {
  eu_compliance: "GROWTH",
  mass_balance: "GROWTH",
  due_diligence: "GROWTH",
  dgft_claims: "GROWTH",
  fleet: "GROWTH",
  telemetry: "GROWTH",
  partners: "GROWTH",
  developer: "GROWTH",
  regulatory: "GROWTH",
  sso: "ENTERPRISE",
  multi_entity: "ENTERPRISE",
  advanced_analytics: "ENTERPRISE",
};

export function normalizePlan(plan?: string | null): PlanType {
  const p = (plan ?? "").toUpperCase();
  return p === "GROWTH" || p === "ENTERPRISE" ? p : "STARTER";
}

/** Client-side mirror of PlanIncludes — used when the server-computed
 * `entitlements` map isn't available yet (e.g. first paint before /auth/me). */
export function planIncludes(plan: string | undefined, feature: Feature): boolean {
  const minPlan = FEATURE_MIN_PLAN[feature];
  if (!minPlan) return true;
  return PLAN_RANK[normalizePlan(plan)] >= PLAN_RANK[minPlan];
}

export function requiredPlan(feature: Feature): PlanType | undefined {
  return FEATURE_MIN_PLAN[feature];
}

/** Display labels for locked-feature UI. */
export const FEATURE_LABELS: Record<Feature, string> = {
  eu_compliance: "EU Compliance",
  mass_balance: "Mass Balance",
  due_diligence: "Suppliers & Due Diligence",
  dgft_claims: "DGFT Claims",
  fleet: "Fleet Health",
  telemetry: "BMS Telemetry",
  partners: "Partners",
  developer: "Developer (API Keys & Webhooks)",
  regulatory: "Regulatory Intelligence",
  sso: "SSO / SAML",
  multi_entity: "Multi-Entity Management",
  advanced_analytics: "Advanced Analytics",
};
