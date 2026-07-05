"use client";

import TelemetryDashboardPage from "@/components/telemetry/battery-telemetry-page";
import { FeatureGate } from "@/components/billing/feature-gate";

export default function Page() {
  return (
    <FeatureGate feature="telemetry">
      <TelemetryDashboardPage />
    </FeatureGate>
  );
}
