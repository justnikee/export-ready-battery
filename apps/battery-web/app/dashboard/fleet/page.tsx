import FleetHealthPage from "@/components/fleet/battery-fleet-page";
import { FeatureGate } from "@/components/billing/feature-gate";

export default function Page() {
  return (
    <FeatureGate feature="fleet">
      <FleetHealthPage />
    </FeatureGate>
  );
}
