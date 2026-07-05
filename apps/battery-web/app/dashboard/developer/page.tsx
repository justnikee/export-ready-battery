"use client";

import BatteryDeveloperPage from "@/components/developer/battery-developer-page";
import { FeatureGate } from "@/components/billing/feature-gate";

export default function Page() {
  return (
    <FeatureGate feature="developer">
      <BatteryDeveloperPage />
    </FeatureGate>
  );
}
