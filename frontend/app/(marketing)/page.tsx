import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { CoverageSection } from "@/components/landing/CoverageSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { DeveloperSection } from "@/components/landing/DeveloperSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { WhySection } from "@/components/landing/WhySection";
import { CTASection } from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <CoverageSection />
      <FeaturesSection />
      <DeveloperSection />
      <SecuritySection />
      <WhySection />
      <CTASection />
    </>
  );
}
