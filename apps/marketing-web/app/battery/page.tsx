import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/sections/footer";
import BatteryHero from "@/components/sections/battery-hero";
import BatteryCompliance from "@/components/sections/battery-compliance";
import BatteryPassportData from "@/components/sections/battery-passport-data";
import BatteryFeatures from "@/components/sections/battery-features";
import BatteryDual from "@/components/sections/battery-dual";
import BatteryCTA from "@/components/sections/battery-cta";

export const metadata: Metadata = {
  title: "Anviora Battery — Digital Product Passports for Battery Manufacturers",
  description:
    "Generate EU-compliant Battery Passports, track BIS certificates, and verify every cell from factory to recycler. Built for Indian battery exporters.",
};

export default function BatteryPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />
      <BatteryHero />
      <BatteryCompliance />
      <BatteryPassportData />
      <BatteryFeatures />
      <BatteryDual />
      <BatteryCTA />
      <Footer />
    </main>
  );
}
