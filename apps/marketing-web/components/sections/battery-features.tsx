"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Upload a PDF. Get 40+ Fields.",
    description:
      "Drag and drop your BIS, EPR, UN38.3, IEC 62133, and MSDS certificates. Our AI reads them in seconds. Manufacturer details. Chemistry. Test dates. Hazardous substances. Auto-populated. You just review.",
    visual: "pdf-parse",
  },
  {
    title: "A–G Performance Class. Calculated Automatically.",
    description:
      "Input your bill of materials. We calculate kg CO₂e per kWh using PEF methodology. Get your performance class. Ready for EU Annex II declarations. Third-party verification workflows built in.",
    visual: "carbon",
  },
  {
    title: "Never Miss a Renewal Again.",
    description:
      "BIS IS 16046 (24 months). UN38.3 (24 months recency). IEC 62133 (36 months). MSDS (36 months). Visual timeline. 30-day, 7-day, and day-of alerts. Email + in-app.",
    visual: "expiry",
  },
  {
    title: "Prove It. Forever.",
    description:
      "Hash your certificate PDF. Submit to OpenTimestamps. Store proof in our system. Buyers verify on the Bitcoin blockchain. Free. No wallet needed. Immutable trust.",
    visual: "blockchain",
  },
  {
    title: "Track Every Gram of Recycled Content.",
    description:
      "EU Article 8 requires book-and-claim accounting for recycled cobalt, lithium, nickel, and lead. Our ledger tracks incoming, allocated, and balance amounts. Audit-ready. Atomic updates. No negative balances.",
    visual: "mass-balance",
  },
];

export default function BatteryFeatures() {
  return (
    <section className="py-[88px] bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center py-12 ${
              i > 0 ? "border-t border-[#e3e8ee]" : ""
            }`}
          >
            <div className={i % 2 === 1 ? "lg:order-2" : ""}>
              <h3 className="text-[22px] sm:text-[26px] font-light leading-[1.16] text-[#0d253d]">
                {f.title}
              </h3>
              <p className="mt-4 text-[15px] leading-[1.55] text-[#64748d]">
                {f.description}
              </p>
            </div>
            <div className={i % 2 === 1 ? "lg:order-1" : ""}>
              <div
                className="rounded-xl min-h-[200px] lg:min-h-[260px] relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #f5e9d4 0%, #ff8b2f 22%, #f96bee 56%, #533afd 100%)",
                }}
              >
                <div className="absolute inset-6 rounded-lg bg-[rgba(255,255,255,0.92)] border border-[rgba(255,255,255,0.78)] p-4">
                  <div className="h-2.5 rounded-full bg-[rgba(83,58,253,0.12)] mb-3" />
                  <div className="h-2.5 w-[70%] rounded-full bg-[rgba(13,37,61,0.08)] mb-3" />
                  <div className="h-2.5 w-[50%] rounded-full bg-[rgba(83,58,253,0.12)]" />
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="h-16 rounded bg-[#f6f9fc]" />
                    <div className="h-16 rounded bg-[rgba(83,58,253,0.08)]" />
                    <div className="h-16 rounded bg-[#f6f9fc]" />
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
