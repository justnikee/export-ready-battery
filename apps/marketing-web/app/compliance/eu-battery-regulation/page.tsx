import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
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
    <main className="relative min-h-screen bg-bg text-text overflow-x-clip">
      <SiteHeader />

      {/* CRT Emerald Hero Banner */}
      <section className="relative min-h-[380px] flex flex-col justify-between overflow-hidden bg-[#0e9f6e] text-black pt-24 sm:pt-28 pb-12 select-none">
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)",
          }}
        />
        <div className="relative z-10 max-w-[1320px] w-full mx-auto px-6 sm:px-10 py-4">
          <div className="max-w-[860px]">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-transparent border border-black text-black clip-chamfer mb-4">
              <span className="px-1.5 py-0.5 bg-black text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-widest">
                COMPLIANCE GUIDE
              </span>
              <span className="font-mono text-[12px] font-medium tracking-wide">
                EU Battery Regulation 2023/1542
              </span>
            </div>

            <h1 className="font-heading font-semibold text-[clamp(32px,4.6vw,56px)] leading-[0.96] tracking-[-0.04em] text-black mb-4">
              EU Battery Regulation 2023/1542, explained.
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-black/85 font-medium max-w-[640px]">
              The EU&apos;s Battery Regulation replaces the old Battery Directive with binding, product-level requirements — carbon footprint, recycled content, due diligence, and a mandatory Digital Battery Passport.
            </p>
          </div>
        </div>
      </section>

      <section className="py-[72px]">
        <div className="max-w-[1080px] mx-auto px-6">
          <h2 className="font-heading text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.02em] text-black mb-10">
            The four requirements that matter most
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {requirements.map((r) => (
              <div key={r.article} className="p-6 bg-white border border-black/15 clip-chamfer shadow-xs">
                <div className="inline-flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                    {r.article}
                  </span>
                </div>
                <h3 className="font-heading text-[19px] font-semibold tracking-[-0.02em] text-black mb-2">
                  {r.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-black/80">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BatteryCompliance />

      <section className="py-[72px]">
        <div className="max-w-[860px] mx-auto px-6 text-center">
          <h2 className="font-heading text-[clamp(26px,3.4vw,36px)] font-semibold tracking-[-0.02em] text-black mb-4">
            Anviora Battery generates the passport this regulation requires.
          </h2>
          <p className="text-[16px] leading-[1.6] text-black/80 max-w-[560px] mx-auto mb-7">
            Carbon footprint calculation, recycled-content mass balance, supplier due diligence, and the passport itself — one platform, mapped directly to Art. 7/8/11/77.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/request-access"
              className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-black hover:bg-slate-900 transition-all clip-chamfer press-scale shadow-lg"
            >
              Request a Demo
            </a>
            <a
              href="/battery"
              className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-black bg-transparent border-2 border-black hover:bg-black hover:text-emerald-400 transition-all clip-chamfer press-scale"
            >
              See the full product
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
