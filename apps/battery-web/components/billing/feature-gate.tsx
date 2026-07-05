"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/use-entitlements";
import { Feature } from "@/lib/entitlements";
import { dashboardPathFromPathname } from "@/lib/routes";

/**
 * Wraps a Growth/Enterprise-only page. Renders `children` when the tenant's
 * plan includes `feature`; otherwise shows an upgrade interstitial instead.
 *
 * This is UX only — the backend's RequireFeature middleware is the real gate
 * and will 402 the underlying API calls regardless. This component exists so
 * a Starter tenant sees a clear upgrade prompt instead of a broken page full
 * of failed requests.
 */
export function FeatureGate({
  feature,
  children,
}: {
  feature: Feature;
  children: React.ReactNode;
}) {
  const { has, requiredPlanFor, labelFor } = useEntitlements();

  if (has(feature)) {
    return <>{children}</>;
  }

  return <FeatureLocked requiredPlan={requiredPlanFor(feature)} label={labelFor(feature)} />;
}

export function FeatureLocked({
  requiredPlan,
  label,
}: {
  requiredPlan?: string;
  label: string;
}) {
  const pathname = usePathname();
  const billingHref = dashboardPathFromPathname(pathname, "billing");

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mt-5 text-lg font-medium text-foreground">{label} is a {requiredPlan ?? "higher-tier"} feature</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upgrade your plan to unlock {label.toLowerCase()} and the rest of the{" "}
          {requiredPlan ?? "upgraded"} tier.
        </p>
        <Button asChild className="mt-6">
          <Link href={billingHref}>
            <Sparkles className="h-4 w-4" />
            Upgrade to {requiredPlan ?? "unlock"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
