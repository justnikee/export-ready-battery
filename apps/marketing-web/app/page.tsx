import SiteHeader from "@/components/site-header";
import Hero from "@/components/sections/hero";
import LogoStrip from "@/components/sections/logo-strip";
import ValueProp from "@/components/sections/value-prop";
import ComplianceCliff from "@/components/sections/compliance-cliff";
import Platform from "@/components/sections/platform";
import FeatureGrid from "@/components/sections/feature-grid";
import DualMarket from "@/components/sections/dual-market";
import ProductsSplit from "@/components/sections/products-split";
import Backbone from "@/components/sections/backbone";
import Business from "@/components/sections/business";
import FAQ from "@/components/sections/faq";
import NewsCTA from "@/components/sections/news-cta";
import Footer from "@/components/sections/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="relative min-h-screen bg-crew-paper overflow-x-clip">
      <SiteHeader />
      <Hero />
      <LogoStrip />
      <ValueProp />
      <ComplianceCliff />
      <Platform />
      <FeatureGrid />
      <DualMarket />
      <ProductsSplit />
      <Backbone />
      <Business />
      <FAQ />
      <NewsCTA />
      <Footer />
    </main>
  );
}
