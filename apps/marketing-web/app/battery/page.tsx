import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/sections/footer";
import BatteryHero from "@/components/sections/battery-hero";
import BatteryCompliance from "@/components/sections/battery-compliance";
import BatteryPassportData from "@/components/sections/battery-passport-data";
import BatteryFeatures from "@/components/sections/battery-features";
import BatteryDual from "@/components/sections/battery-dual";
import BatteryCTA from "@/components/sections/battery-cta";

export const metadata: Metadata = {
  title: "Anviora Battery — serials, QR, and a public record",
  description:
    "Issue EU-scannable battery records for Indian pack exporters. LMT, industrial >2 kWh, and EV from 18 February 2027. We are not a notified body.",
  alternates: { canonical: "/battery" },
};

export default function BatteryPage() {
  return (
    <main className="relative min-h-screen bg-bg text-text overflow-x-clip">
      <SiteHeader />
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
