import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/sections/footer";
import BatteryCompliance from "@/components/sections/battery-compliance";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "EU Battery Regulation 2023/1542 — What It Requires | Anviora",
  description:
    "A plain-English guide to EU Battery Regulation 2023/1542: the Feb 2027 Battery Passport deadline, carbon footprint declarations, recycled content rules, and due diligence obligations for exporters.",
  alternates: { canonical: "/compliance/eu-battery-regulation" },
};

const requirements = [
  {
    article: "Art. 7",
    title: "Carbon footprint declaration",
    body: "Every EV and industrial battery (>2kWh) needs a calculated carbon footprint value and A–G performance class, using a JRC-aligned methodology — not a free-text estimate.",
  },
  {
    article: "Art. 8",
    title: "Recycled content",
    body: "Minimum recycled cobalt, lithium, nickel and lead content, tracked via book-and-claim mass-balance accounting — both at the battery level and aggregated across your supply chain.",
  },
  {
    article: "Art. 11",
    title: "Supply chain due diligence",
    body: "From August 2027, manufacturers above a size threshold must document supplier risk — sourcing, human rights, environmental impact — with audit trails, not self-declarations.",
  },
  {
    article: "Art. 77",
    title: "The Battery Passport itself",
    body: "A QR-linked digital record covering manufacturer identity, chemistry, carbon footprint, recycled content, and performance data, in a tiered structure (public / partner / regulator access).",
  },
];

export default function EUBatteryRegulationPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />

      <section className="relative pt-[120px] pb-16 lg:pt-[160px] lg:pb-20 bg-crew-paper-soft">
        <div className="max-w-[860px] mx-auto px-6">
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Compliance guide
          </div>
          <h1 className="font-serif text-[clamp(32px,4.6vw,52px)] font-normal leading-[1.06] tracking-[-0.01em] text-crew-ink">
            EU Battery Regulation 2023/1542, explained.
          </h1>
          <p className="mt-5 text-[16px] sm:text-[17px] leading-[1.6] text-[#131313] max-w-[640px]">
            The EU's Battery Regulation replaces the old Battery Directive with binding,
            product-level requirements — carbon footprint, recycled content, due diligence,
            and a mandatory Digital Battery Passport. Here's what actually applies to you,
            and by when.
          </p>
        </div>
      </section>

      <section className="py-[72px] bg-white">
        <div className="max-w-[1080px] mx-auto px-6">
          <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-normal tracking-[-0.01em] text-crew-ink mb-10">
            The four requirements that matter most
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {requirements.map((r) => (
              <div key={r.article} className="p-6 rounded-2xl bg-crew-paper-soft border border-crew-border">
                <div className="inline-flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-crew-coral" />
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-crew-coral">
                    {r.article}
                  </span>
                </div>
                <h3 className="font-serif text-[19px] font-normal tracking-[-0.01em] text-crew-ink mb-2">
                  {r.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#131313]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BatteryCompliance />

      <section className="py-[72px] bg-crew-paper-soft">
        <div className="max-w-[860px] mx-auto px-6 text-center">
          <h2 className="font-serif text-[clamp(26px,3.4vw,36px)] font-normal tracking-[-0.01em] text-crew-ink mb-4">
            Anviora Battery generates the passport this regulation requires.
          </h2>
          <p className="text-[16px] leading-[1.6] text-[#131313] max-w-[560px] mx-auto mb-7">
            Carbon footprint calculation, recycled-content mass balance, supplier due
            diligence, and the passport itself — one platform, mapped directly to Art.
            7/8/11/77.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/request-access"
              className="group inline-flex items-center justify-center gap-1.5 h-[44px] px-6 rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors"
            >
              Request a Demo
              <ArrowRight size={15} className="cta-arrow" />
            </a>
            <a
              href="/battery"
              className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
            >
              See the full product <ArrowRight size={14} className="cta-arrow" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
