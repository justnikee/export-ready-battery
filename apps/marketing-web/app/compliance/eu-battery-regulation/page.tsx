import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/sections/footer";
import BatteryCompliance from "@/components/sections/battery-compliance";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "EU Battery Regulation 2023/1542 — What It Requires | Anviora",
  description:
    "A plain-English guide to EU Battery Regulation 2023/1542: who needs a battery passport on 18 February 2027, what the QR is for, and which duties come later.",
  alternates: { canonical: "/compliance/eu-battery-regulation" },
};

const requirements = [
  {
    article: "Art. 77",
    title: "The battery passport",
    body: "From 18 February 2027 each LMT battery, each industrial battery above 2 kWh, and each EV battery placed on the EU market or put into service needs an electronic record. Portable and SLI batteries are outside that duty. Commission guidance maps 71 data points; carbon, recycled %, and due diligence are not to be filled in that passport on day one.",
  },
  {
    article: "Art. 13",
    title: "QR on every battery",
    body: "From the same date all batteries carry a QR. For the three passport categories it opens the Art. 77 record. For others it opens labelling, the EU DoC, and waste information — not a full passport.",
  },
  {
    article: "Art. 7",
    title: "Carbon footprint (later)",
    body: "Applies to EV, rechargeable industrial >2 kWh, and LMT — not portable or SLI. Each clock is the later of a calendar date and 12 or 18 months after Commission methodology and format acts. Those acts were still drafts as of August 2026. A five-input calculator is not a PEFCR declaration.",
  },
  {
    article: "Art. 11 vs 48",
    title: "Removability is not due diligence",
    body: "Article 11 is product design: portable batteries removable by the end-user, LMT by an independent professional, from 18 February 2027. Supply-chain due diligence is Chapter VII / Article 48, from 18 August 2027, with a EUR 40 million exclusion.",
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
              The Batteries Regulation is a stack of dates. February 2027 is identity, QR, and a structured record for certain large batteries — not carbon class, not CPCB, not Bitcoin.
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
            Anviora issues the record the buyer will scan.
          </h2>
          <p className="text-[16px] leading-[1.6] text-black/80 max-w-[560px] mx-auto mb-7">
            Serials, QR, a public page, and a certificate vault. We do not replace a notified body, file CPCB, or assign a legal carbon class.
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
