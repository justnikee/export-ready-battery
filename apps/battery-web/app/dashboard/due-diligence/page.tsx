import DueDiligencePage from "@/components/due-diligence/battery-due-diligence-page";
import { FeatureGate } from "@/components/billing/feature-gate";

export default function Page() {
  return (
    <FeatureGate feature="due_diligence">
      <DueDiligencePage />
    </FeatureGate>
  );
}
