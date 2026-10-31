import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/sections/footer";
import AboutHero from "@/components/sections/about-hero";
import AboutMission from "@/components/sections/about-mission";
import AboutWhy from "@/components/sections/about-why";
import AboutValues from "@/components/sections/about-values";
import AboutCTA from "@/components/sections/about-cta";

export const metadata: Metadata = {
  title: "About Anviora — Building the Identity Layer for Indian Exports",
  description:
    "Anviora issues EU-scannable battery records for Indian pack manufacturers — serials, QR, a public page, and an India certificate vault.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-bg text-text overflow-x-clip">
      <SiteHeader />
      <AboutHero />
      <AboutMission />
      <AboutWhy />
      <AboutValues />
      <AboutCTA />
      <Footer />
    </main>
  );
}
