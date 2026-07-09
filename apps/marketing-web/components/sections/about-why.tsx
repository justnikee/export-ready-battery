"use client";

import { motion } from "framer-motion";

const MOMENTS = [
  {
    num: "01",
    heading: "The regulation caught manufacturers by surprise",
    body: "EU Battery Regulation 2023/1542 passed in July 2023 with a hard deadline of February 2027. Most Indian exporters heard about it from their EU buyers — not from any Indian government body. By that time, the buyers were already demanding upstream data.",
  },
  {
    num: "02",
    heading: "The existing tools are built for Europe, not for India",
    body: "Every DPP platform we found was designed for European manufacturers, priced in euros, and assumed your compliance infrastructure already existed. There was nothing that started from a BIS certificate and a Tally-connected ERP.",
  },
  {
    num: "03",
    heading: "India's own compliance is just as fragmented",
    body: "BIS, CPCB EPR, DGFT TRACE, BWM Rules, PLI incentive claims — these are five separate systems with five separate data requirements. Manufacturers were managing all of them in spreadsheets and WhatsApp threads.",
  },
  {
    num: "04",
    heading: "We decided to build the missing infrastructure",
    body: "A single platform that starts with Indian compliance (BIS, EPR, UN38.3) and builds up to EU compliance (Carbon footprint, Battery Passport, Due Diligence) — because that's the actual journey an Indian exporter takes.",
  },
];

export default function AboutWhy() {
  return (
    <section className="py-24 lg:py-32 bg-crew-paper-soft">
      <div className="max-w-[1000px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Why we built this
          </div>
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-crew-ink max-w-[680px]">
            Four things we kept seeing that nobody was fixing.
          </h2>
        </motion.div>

        <div className="grid gap-0">
          {MOMENTS.map((m, i) => (
            <motion.div
              key={m.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`flex gap-6 sm:gap-8 py-8 ${
                i < MOMENTS.length - 1 ? "border-b border-crew-border" : ""
              }`}
            >
              <span className="shrink-0 font-mono text-[12px] font-bold text-crew-coral/60 mt-1 w-6">
                {m.num}
              </span>
              <div>
                <h3 className="font-serif text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-crew-ink mb-3 leading-snug">
                  {m.heading}
                </h3>
                <p className="text-[16px] leading-[1.65] text-[#131313]">{m.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
