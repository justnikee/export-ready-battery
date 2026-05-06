import { HeroSection } from "@/components/landing/HeroSection";
import { WhyChooseSection } from "@/components/landing/WhyChooseSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Home() {
  return (
    <>
      {/* Hero with light gradient background */}
      <HeroSection />
      
      {/* Why Choose Us - 3 benefit cards */}
      <WhyChooseSection />
      
      {/* How It Works - simplified workflow */}
      <HowItWorks />
      
      {/* Use Cases - feature grid */}
      <UseCasesSection />
      
      {/* Stats Section - social proof */}
      <StatsSection />
      
      {/* FAQ - address objections */}
      <FAQSection />
      
      {/* Final CTA with checklist */}
      <CTASection />
    </>
  );
}
