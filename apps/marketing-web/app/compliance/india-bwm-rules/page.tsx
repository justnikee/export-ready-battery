import type { Metadata } from "next";
import Navbar from "@/components/navbar";
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
    body: "Every battery manufacturer or importer must register with CPCB and file EPR returns covering collection and recycling targets — non-compliance blocks production and sale.",
  },
  {
    tag: "BIS",
    title: "BIS IS 16046 certification",
    body: "Mandatory safety certification for lithium-ion cells and packs sold in India, renewed every two years. A lapsed certificate is one of the most common causes of a stopped production line.",
  },
  {
    tag: "PLI",
    title: "PLI Phase II documentation",
    body: "Manufacturers claiming Production Linked Incentive benefits need Domestic Value Addition (DVA ≥50%) evidence, tied directly to the same bill-of-materials data used for compliance.",
  },
  {
    tag: "AIS",
    title: "AIS-156 / AIS-038 safety testing",
    body: "Type-approval testing for EV traction batteries (AIS-156) and general EV battery safety (AIS-038), required alongside UN38.3 and IEC 62133 for export-bound cells.",
  },
];

const checklist = [
  "EPR registration number (CPCB)",
  "BIS R-Number and current certificate status",
  "PLI Domestic Value Addition documentation",
  "AIS-156 / AIS-038 type-approval reports",
  "UN38.3 transport test report",
  "MoRTH manufacturer code (for traction batteries)",
  "QR code traceability (BWM Rules 2022 mandate)",
];

export default function IndiaBWMRulesPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />

      <section className="relative pt-[120px] pb-16 lg:pt-[160px] lg:pb-20 bg-crew-paper-soft">
        <div className="max-w-[860px] mx-auto px-6">
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Compliance guide
          </div>
          <h1 className="font-serif text-[clamp(32px,4.6vw,52px)] font-semibold leading-[1.06] tracking-[-0.02em] text-crew-ink">
            India's Battery Waste Management Rules, explained.
          </h1>
          <p className="mt-5 text-[16px] sm:text-[17px] leading-[1.6] text-[#131313] max-w-[640px]">
            BWM Rules 2022, EPR registration, BIS certification, and PLI documentation
            — four separate compliance tracks that all draw on the same underlying
            product data. Here's what's actually required to sell battery products in
            India.
          </p>
        </div>
      </section>

      <section className="py-[72px] bg-white">
        <div className="max-w-[1080px] mx-auto px-6">
          <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.02em] text-crew-ink mb-10">
            The four requirements that matter most
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {requirements.map((r) => (
              <div key={r.tag} className="p-6 rounded-2xl bg-crew-paper-soft border border-crew-border">
                <div className="inline-flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-crew-coral" />
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-crew-coral">
                    {r.tag}
                  </span>
                </div>
                <h3 className="font-serif text-[19px] font-semibold tracking-[-0.02em] text-crew-ink mb-2">
                  {r.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#131313]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[72px] bg-crew-paper-soft">
        <div className="max-w-[720px] mx-auto px-6">
          <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.02em] text-crew-ink mb-8 text-center">
            What you'll need on file
          </h2>
          <div className="bg-white border border-crew-border rounded-2xl p-6">
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item} className="text-[15px] text-crew-muted flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-crew-coral mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-[72px] bg-white">
        <div className="max-w-[860px] mx-auto px-6 text-center">
          <h2 className="font-serif text-[clamp(26px,3.4vw,36px)] font-semibold tracking-[-0.02em] text-crew-ink mb-4">
            Anviora Battery tracks every certificate against this checklist.
          </h2>
          <p className="text-[16px] leading-[1.6] text-[#131313] max-w-[560px] mx-auto mb-7">
            Upload once, and Anviora maps your data to EPR, BIS, PLI and AIS
            requirements automatically — with expiry alerts so a lapsed certificate
            never stops your line.
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
