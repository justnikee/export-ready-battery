import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/sections/footer";
import EUBuyerHero from "@/components/sections/eu-buyer-hero";
import EUBuyerVerify from "@/components/sections/eu-buyer-verify";
import EUBuyerMandateForm from "@/components/sections/eu-buyer-mandate-form";

export const metadata: Metadata = {
  title: "Require Digital Battery Passports from your Indian Suppliers | Anviora Battery",
  description:
    "EU Battery Regulation 2023/1542 makes Digital Battery Passports mandatory from February 2027. Verify a supplier's passport or mandate Anviora for your Indian battery supply chain.",
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
