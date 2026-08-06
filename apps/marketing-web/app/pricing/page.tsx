import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
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
    "Simple, transparent pricing for Indian battery exporters. Starter from ₹14,999/month, Growth from ₹44,999/month, Enterprise custom. One-time credit purchases, no subscription lock-in.",
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
    <main className="relative min-h-screen bg-bg text-text overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />
      <PricingHero />
      <PricingCards />
      <PricingCompare />
      <PricingFAQ />
      <PricingCTA />
      <Footer />
    </main>
  );
}
