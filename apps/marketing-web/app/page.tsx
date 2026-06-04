import Navbar from "@/components/navbar";
import Hero from "@/components/sections/hero";
import LogoStrip from "@/components/sections/logo-strip";
import Solutions from "@/components/sections/solutions";
import PromoBand from "@/components/sections/promo-band";
import Backbone from "@/components/sections/backbone";
import Business from "@/components/sections/business";
import Platform from "@/components/sections/platform";
import DarkDev from "@/components/sections/dark-dev";
import NewsCTA from "@/components/sections/news-cta";
import Footer from "@/components/sections/footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />
      <Hero />
      <LogoStrip />
      <Solutions />
      <PromoBand />
      <Backbone />
      <Business />
      <Platform />
      <DarkDev />
      <NewsCTA />
      <Footer />
    </main>
  );
}
