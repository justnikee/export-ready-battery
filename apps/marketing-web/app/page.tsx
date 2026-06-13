import SiteHeader from "@/components/site-header";
import Hero from "@/components/sections/hero";
import LogoStrip from "@/components/sections/logo-strip";
import ValueProp from "@/components/sections/value-prop";
import Platform from "@/components/sections/platform";
import Backbone from "@/components/sections/backbone";
import Business from "@/components/sections/business";
import NewsCTA from "@/components/sections/news-cta";
import Footer from "@/components/sections/footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-crew-paper overflow-x-clip">
      <SiteHeader />
      <Hero />
      <LogoStrip />
      <ValueProp />
      <Platform />
      <Backbone />
      <Business />
      <NewsCTA />
      <Footer />
    </main>
  );
}
