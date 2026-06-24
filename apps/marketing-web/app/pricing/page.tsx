import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/sections/footer";
import PricingHero from "@/components/sections/pricing-hero";
import PricingCards from "@/components/sections/pricing-cards";
import PricingCompare from "@/components/sections/pricing-compare";
import PricingFAQ from "@/components/sections/pricing-faq";
import PricingCTA from "@/components/sections/pricing-cta";
import { faqs } from "@/lib/pricing-faqs";

export const metadata: Metadata = {
  title: "Pricing — Plans for Every Scale | Anviora",
  description:
    "Simple, transparent pricing for Indian battery and textile exporters. Free for starters. ₹4,999/month for growing teams. Enterprise plans available.",
  alternates: { canonical: "/pricing" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function PricingPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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
