import EuCompliancePage from "@/components/eu-compliance/battery-eu-compliance-page";
import { FeatureGate } from "@/components/billing/feature-gate";

export default function Page() {
  return (
    <FeatureGate feature="eu_compliance">
      <EuCompliancePage />
    </FeatureGate>
  );
}
