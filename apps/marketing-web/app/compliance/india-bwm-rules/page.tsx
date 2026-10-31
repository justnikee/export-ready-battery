import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/sections/footer";
import { ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "India BWM Rules 2022 & Battery EPR — What It Requires | Anviora",
  description:
    "A plain-English guide to India's Battery Waste Management Rules 2022, EPR registration with CPCB, BIS IS 16046 certification, and PLI documentation for Indian battery manufacturers.",
  alternates: { canonical: "/compliance/india-bwm-rules" },
};

const requirements = [
  {
    tag: "EPR",
    title: "Extended Producer Responsibility (CPCB)",
    body: "Producers who introduce batteries on the Indian market register with CPCB and file annual Form 3 on the portal. Anviora stores the number and can emit a helper CSV. That is not a live filing and not a substitute for the portal.",
  },
  {
    tag: "BIS",
    title: "BIS IS 16046 certification",
    body: "CRS Order 2021 schedules IS 16046 for portable sealed secondary cells/batteries. It is not a general CRS mandate for EV traction or industrial packs (those sit under AIS where they apply). Export goods to a foreign buyer’s spec are outside that Order.",
  },
  {
    tag: "PLI",
    title: "PLI Phase II documentation",
    body: "Manufacturers claiming Production Linked Incentive benefits need Domestic Value Addition (DVA ≥50%) evidence, tied directly to the same bill-of-materials data used for compliance.",
  },
  {
    tag: "AIS",
    title: "AIS-156 / AIS-038 safety testing",
    body: "MoRTH type-approval for traction REESS of L-category (AIS-156) and M/N (AIS-038) electric power-train vehicles — not a general sale rule for portable, stationary, or SLI packs.",
  },
];

const checklist = [
  "EPR number if you place batteries on the Indian market (file Form 3 on the CPCB portal)",
  "BIS R-number for portable CRS cells only",
  "PLI DVA evidence only if you claim PLI",
  "AIS-156 / AIS-038 only for EV/LMT traction",
  "UN 38.3 test report before lithium transport",
  "MoRTH manufacturer code for traction packs only",
];

export default function IndiaBWMRulesPage() {
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
                INDIA MANDATES
              </span>
              <span className="font-mono text-[12px] font-medium tracking-wide">
                BWM Rules 2022 & CPCB EPR
              </span>
            </div>

            <h1 className="font-heading font-semibold text-[clamp(32px,4.6vw,56px)] leading-[0.96] tracking-[-0.04em] text-black mb-4">
              India&apos;s Battery Waste Management Rules, explained.
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-black/85 font-medium max-w-[640px]">
              India producer duties are separate from the EU passport. We store numbers and PDFs. Filing, licences, and type-approval stay with CPCB, BIS, and MoRTH.
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
              <div key={r.tag} className="p-6 bg-white border border-black/15 clip-chamfer shadow-xs">
                <div className="inline-flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                    {r.tag}
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

      <section className="py-[72px]">
        <div className="max-w-[720px] mx-auto px-6">
          <h2 className="font-heading text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.02em] text-black mb-8 text-center">
            What you&apos;ll need on file
          </h2>
          <div className="bg-white border border-black/15 clip-chamfer p-6 shadow-xs">
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item} className="text-[15px] text-black/80 flex items-start gap-2.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-[72px]">
        <div className="max-w-[860px] mx-auto px-6 text-center">
          <h2 className="font-heading text-[clamp(26px,3.4vw,36px)] font-semibold tracking-[-0.02em] text-black mb-4">
            We store the papers. You still file the portals.
          </h2>
          <p className="text-[16px] leading-[1.6] text-black/80 max-w-[560px] mx-auto mb-7">
            Upload numbers and PDFs. Category-correct checklists. Expiry reminders. We do not register you with CPCB or BIS.
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
