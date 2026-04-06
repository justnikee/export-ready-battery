import { HeroSection } from "@/components/landing/HeroSection";
import { QuickLinksSection } from "@/components/landing/QuickLinksSection";
import { ExplainerSection } from "@/components/landing/ExplainerSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { ValuesSection } from "@/components/landing/ValuesSection";
import { DeveloperSection } from "@/components/landing/DeveloperSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <QuickLinksSection />
      <ExplainerSection />
      <UseCasesSection />
      <StatsSection />
      <ValuesSection />
      <DeveloperSection />
      <CTASection />
    </>
  );
}
