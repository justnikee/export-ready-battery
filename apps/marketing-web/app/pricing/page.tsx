import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/sections/footer";
import PricingHero from "@/components/sections/pricing-hero";
import PricingCards from "@/components/sections/pricing-cards";
import PricingCompare from "@/components/sections/pricing-compare";
import PricingFAQ from "@/components/sections/pricing-faq";
import PricingCTA from "@/components/sections/pricing-cta";

export const metadata: Metadata = {
  title: "Pricing — Plans for Every Scale | Anviora",
  description:
    "Simple, transparent pricing for Indian battery and textile exporters. Free for starters. ₹4,999/month for growing teams. Enterprise plans available.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />
      <PricingHero />
      <PricingCards />
      <PricingCompare />
      <PricingFAQ />
      <PricingCTA />
      <Footer />
    </main>
  );
}
