import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/sections/footer";
import TextileHero from "@/components/sections/textile-hero";
import TextileChallenge from "@/components/sections/textile-challenge";
import TextileFeatures from "@/components/sections/textile-features";
import TextileFTA from "@/components/sections/textile-fta";
import TextileCTA from "@/components/sections/textile-cta";

export const metadata: Metadata = {
  title: "Anviora Textile — Digital Product Passports for Textile Exporters",
  description:
    "Track fiber composition, manage sustainability certifications, and generate EU-compliant textile DPPs. From Tirupur to Europe.",
};

export default function TextilePage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />
      <TextileHero />
      <TextileChallenge />
      <TextileFeatures />
      <TextileFTA />
      <TextileCTA />
      <Footer />
    </main>
  );
}
