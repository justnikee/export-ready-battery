import { HeroSection } from "@/components/landing/HeroSection"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { PrinciplesSection } from "@/components/landing/PrinciplesSection"
import { LifecycleSection } from "@/components/landing/LifecycleSection"
import { RegulatorSection } from "@/components/landing/RegulatorSection"
import { PassportProofSection } from "@/components/landing/PassportProofSection"
import { ComplianceFlowSection } from "@/components/landing/ComplianceFlowSection"
import { AudienceSection } from "@/components/landing/AudienceSection"
import { CTASection } from "@/components/landing/cta-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <PrinciplesSection />
      <LifecycleSection />
      <RegulatorSection />
      <PassportProofSection />
      <ComplianceFlowSection />
      <AudienceSection />
      <CTASection />
    </>
  )
}
