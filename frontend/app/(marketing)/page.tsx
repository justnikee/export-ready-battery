import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { QuickLinksSection } from "@/components/landing/QuickLinksSection";
import { ExplainerSection } from "@/components/landing/ExplainerSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { ValuesSection } from "@/components/landing/ValuesSection";
import { TrustSignalsSection } from "@/components/landing/TrustSignalsSection";
import { DeveloperSection } from "@/components/landing/DeveloperSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Home() {
 return (
 <>
 <HeroSection />
 <TrustBar />
 <ProblemSection />
 <QuickLinksSection />
 <ExplainerSection />
 <HowItWorks />
 <UseCasesSection />
 <AudienceSection />
 <StatsSection />
 <ValuesSection />
 <TrustSignalsSection />
 <DeveloperSection />
 <CTASection />
 </>
 );
}
