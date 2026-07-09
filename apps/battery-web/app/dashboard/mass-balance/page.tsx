import MassBalancePage from "@/components/mass-balance/mass-balance-page";
import { FeatureGate } from "@/components/billing/feature-gate";

export default function Page() {
  return (
    <FeatureGate feature="mass_balance">
      <MassBalancePage />
    </FeatureGate>
  );
}
