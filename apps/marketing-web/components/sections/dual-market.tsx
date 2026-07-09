"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const india = [
  "BIS IS 16046 certification",
  "CPCB EPR registration",
  "BWM Rules 2022 compliance",
  "DGFT TRACE incentive claims",
  "QR-code traceability",
];

const eu = [
  "EU Battery Regulation 2023/1542",
  "CE marking & Declaration of Conformity",
  "Carbon footprint (Annex II)",
  "Supply-chain due diligence (Art. 48)",
  "Battery Passport / BPAN (Art. 77)",
];

const tones = {
  india: { bg: "bg-[#fdf3e3]", check: "bg-white text-[#c2410c]", tag: "bg-white text-[#c2410c]" },
  eu: { bg: "bg-[#eef3fd]", check: "bg-white text-[#1d4ed8]", tag: "bg-white text-[#1d4ed8]" },
} as const;

function Column({
  title,
  tag,
  items,
  tone,
}: {
  title: string;
  tag: string;
  items: string[];
  tone: keyof typeof tones;
}) {
  const t = tones[tone];
  return (
    <div className={`flex-1 p-8 lg:p-10 rounded-[28px] ${t.bg}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-[24px] font-semibold tracking-[-0.02em] text-crew-ink">
          {title}
        </h3>
        <span
          className={`inline-flex items-center h-7 px-3 rounded-full text-[11px] font-semibold uppercase tracking-wide ${t.tag}`}
        >
          {tag}
        </span>
      </div>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[16px] leading-[1.6] text-crew-ink/80">
            <span
              className={`inline-flex items-center justify-center w-[22px] h-[22px] mt-0.5 rounded-full shrink-0 ${t.check}`}
            >
              <Check size={12} strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DualMarket() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[680px] mb-12"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            One dataset. Two regulators.
          </div>
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-crew-ink mb-5 text-balance">
            <TextReveal as="span" className="block">
              Compliant in India. Cleared for Europe. Same data.
            </TextReveal>
          </h2>
          <p className="text-[16px] leading-[1.6] text-[#131313]">
            Carbon footprint, recycled content, supplier identities, mass balance — enter it
            once. Anviora keeps you compliant with India&apos;s BWM Rules, BIS and CPCB EPR, and
            the EU Battery Regulation at the same time, and even files your DGFT TRACE claims.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-4"
        >
          <Column title="India" tag="Live" items={india} tone="india" />
          <Column title="European Union" tag="Live" items={eu} tone="eu" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-[16px] font-medium text-crew-ink"
        >
          The only India-born platform that does both — with native Tally integration, no SAP required.
        </motion.p>
      </div>
    </section>
  );
}
