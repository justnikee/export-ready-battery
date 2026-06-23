"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Upload a PDF. Get 100+ fields.",
    description:
      "Drag and drop your BIS, EPR, UN38.3, IEC 62133 and MSDS certificates. Anviora reads them in seconds — manufacturer details, chemistry, test dates, hazardous substances, all auto-populated. You just review.",
  },
  {
    title: "A–G carbon class, calculated.",
    description:
      "Enter your bill of materials. We calculate kg CO₂e per kWh using JRC-aligned methodology and return your performance class — ready for EU Annex II declarations, with third-party verification workflows built in.",
  },
  {
    title: "Never miss a renewal.",
    description:
      "BIS IS 16046, UN38.3, IEC 62133, MSDS — Anviora tracks every expiry on a visual timeline and warns you 30, 7, and 1 days out, by email and in-app.",
  },
  {
    title: "Verify against the source.",
    description:
      "Anviora checks certificates against the BIS, CPCB and EU NANDO registries and records every result in an immutable, hash-chained audit trail. Optional blockchain anchoring available for extra assurance.",
  },
  {
    title: "Track every gram of recycled content.",
    description:
      "EU Article 8 requires book-and-claim accounting for recycled cobalt, lithium, nickel and lead. Our mass-balance ledger tracks incoming, allocated and balance amounts — audit-ready, with no negative balances.",
  },
  {
    title: "File your DGFT claims automatically.",
    description:
      "Anviora turns the same data into RoDTEP, duty-drawback and interest-equalization claim documents — an export incentive that can reimburse up to 75% of your platform cost.",
  },
];

export default function BatteryFeatures() {
  return (
    <section className="py-[88px] bg-crew-paper">
      <div className="max-w-[1080px] mx-auto px-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center py-12 ${
              i > 0 ? "border-t border-crew-border" : ""
            }`}
          >
            <div className={i % 2 === 1 ? "lg:order-2" : ""}>
              <h3 className="font-serif text-[clamp(24px,3vw,32px)] font-normal leading-[1.1] tracking-[-0.01em] text-crew-ink">
                {f.title}
              </h3>
              <p className="mt-4 text-[16px] leading-[1.6] text-[#131313]">
                {f.description}
              </p>
            </div>
            <div className={i % 2 === 1 ? "lg:order-1" : ""}>
              <div
                className="rounded-2xl min-h-[200px] lg:min-h-[260px] relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #0e5a40 0%, #16785a 45%, #4f9e80 100%)",
                }}
              >
                <div className="absolute inset-6 rounded-lg bg-[rgba(255,255,255,0.94)] border border-[rgba(255,255,255,0.78)] p-4">
                  <div className="h-2.5 rounded-full bg-crew-coral-soft mb-3" />
                  <div className="h-2.5 w-[70%] rounded-full bg-[rgba(19,19,19,0.08)] mb-3" />
                  <div className="h-2.5 w-[50%] rounded-full bg-crew-coral-soft" />
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="h-16 rounded bg-crew-paper-soft" />
                    <div className="h-16 rounded bg-crew-coral-soft" />
                    <div className="h-16 rounded bg-crew-paper-soft" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
