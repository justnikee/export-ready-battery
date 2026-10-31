import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/sections/footer";
import EUBuyerHero from "@/components/sections/eu-buyer-hero";
import EUBuyerVerify from "@/components/sections/eu-buyer-verify";
import EUBuyerMandateForm from "@/components/sections/eu-buyer-mandate-form";

export const metadata: Metadata = {
  title: "Require Digital Battery Passports from your Indian Suppliers | Anviora Battery",
  description:
    "From 18 February 2027, LMT, industrial >2 kWh, and EV batteries need a passport. Scan a sample record or ask us to onboard your Indian pack supplier.",
  alternates: { canonical: "/battery/for-eu-buyers" },
};

export default function ForEUBuyersPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />
      <EUBuyerHero />
      <EUBuyerVerify />
      <EUBuyerMandateForm />
      <Footer />
    </main>
  );
}
