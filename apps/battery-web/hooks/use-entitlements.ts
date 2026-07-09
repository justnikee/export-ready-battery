import { useAuth } from "@/context/auth-context";
import { Feature, normalizePlan, planIncludes, requiredPlan, FEATURE_LABELS } from "@/lib/entitlements";

export interface Entitlements {
  plan: ReturnType<typeof normalizePlan>;
  /** Whether the current tenant's plan includes a feature. */
  has: (feature: Feature) => boolean;
  /** Minimum plan required to unlock a feature (undefined = core, all plans). */
  requiredPlanFor: (feature: Feature) => ReturnType<typeof requiredPlan>;
  labelFor: (feature: Feature) => string;
}

/**
 * Reads the tenant's plan + server-computed entitlements map (from /auth/me)
 * and exposes a `has(feature)` check for gating nav items and pages.
 *
 * This is UX only — the source of truth is the backend's RequireFeature
 * middleware. Prefer `user.entitlements[feature]` (computed server-side) when
 * present; fall back to the client-side plan-rank mirror otherwise so gating
 * still works on the first render before /auth/me resolves.
 */
export function useEntitlements(): Entitlements {
  const { user } = useAuth();
  const plan = normalizePlan(user?.plan_type);

  const has = (feature: Feature): boolean => {
    if (user?.entitlements && feature in user.entitlements) {
      return user.entitlements[feature];
    }
    return planIncludes(plan, feature);
  };

  return {
    plan,
    has,
    requiredPlanFor: requiredPlan,
    labelFor: (feature: Feature) => FEATURE_LABELS[feature],
  };
}
