"use client";

import BatteryPartnersPage from "@/components/partners/battery-partners-page";
import { FeatureGate } from "@/components/billing/feature-gate";

export default function Page() {
  return (
    <FeatureGate feature="partners">
      <BatteryPartnersPage />
    </FeatureGate>
  );
}
