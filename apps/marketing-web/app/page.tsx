import SiteHeader from "@/components/site-header";
import Hero from "@/components/sections/hero";
import PassportFlow from "@/components/sections/passport-flow";
import ComplianceCliff from "@/components/sections/compliance-cliff";
import Platform from "@/components/sections/platform";
import FeatureGrid from "@/components/sections/feature-grid";
import DualMarket from "@/components/sections/dual-market";
import FAQ from "@/components/sections/faq";
import NewsCTA from "@/components/sections/news-cta";
import Footer from "@/components/sections/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="relative min-h-screen bg-bg text-text overflow-x-clip">
      <SiteHeader />
      <Hero />
      <ComplianceCliff />
      <PassportFlow />
      <Platform />
      <FeatureGrid />
      <DualMarket />
      <FAQ />
      <NewsCTA />
      <Footer />
    </main>
  );
}
