import { Suspense } from "react";
import BatteryOnboardingPage from "@/components/onboarding/battery-onboarding-page";

export default async function Page() {
  return (
    <Suspense fallback={null}>
      <BatteryOnboardingPage />
    </Suspense>
  );
}
