import Navbar from "@/components/navbar";
import Hero from "@/components/sections/hero";
import Problem from "@/components/sections/problem";
import HowItWorks from "@/components/sections/how-it-works";
import Features from "@/components/sections/features";
import Faq from "@/components/sections/faq";
import Pricing from "@/components/sections/pricing";
import Footer from "@/components/sections/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Faq />
      <Pricing />
      <Footer />
    </main>
  );
}
