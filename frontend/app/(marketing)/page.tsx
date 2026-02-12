import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { StatsSection } from "@/components/landing/StatsSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { PrinciplesSection } from "@/components/landing/PrinciplesSection";
import { LifecycleSection } from "@/components/landing/LifecycleSection";
import { RegulatorSection } from "@/components/landing/RegulatorSection";
import { PassportProofSection } from "@/components/landing/PassportProofSection";
import { ComplianceFlowSection } from "@/components/landing/ComplianceFlowSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <StatsSection />
      <ProblemSection />
      <PrinciplesSection />
      <LifecycleSection />
      <RegulatorSection />
      <PassportProofSection />
      <ComplianceFlowSection />
      <AudienceSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
