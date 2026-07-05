import DGFTClaimsPage from "@/components/dgft-claims/dgft-claim-list";
import { FeatureGate } from "@/components/billing/feature-gate";

export default async function Page() {
  return (
    <FeatureGate feature="dgft_claims">
      <DGFTClaimsPage />
    </FeatureGate>
  );
}
