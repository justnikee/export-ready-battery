"use client";

import { motion } from "framer-motion";

const indiaItems = [
  "BIS Certification (IS 16046)",
  "EPR Registration (CPCB)",
  "BWM Rules 2022 Compliance",
  "PLI Phase II Documentation",
  "AIS-156 / AIS-038 Testing",
  "QR code traceability mandate",
];

const euItems = [
  "EU Battery Regulation 2023/1542",
  "CE Marking & Declaration of Conformity",
  "Carbon Footprint Declaration (Annex II)",
  "Due Diligence Policy (Art. 48)",
  "Recycling & Recycled Content (Art. 8)",
  "Battery Passport (Art. 77)",
];

export default function BatteryDual() {
  return (
    <section className="py-20 lg:py-28 antialiased">
      <div className="max-w-[1232px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-text text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.035em] text-center mb-12 text-balance"
        >
          One data set. Two regulatory masters.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-none border border-border bg-white p-8 lg:p-9 shadow-xs transition-all duration-300 hover:border-border-strong"
          >
            <h3 className="font-heading text-[22px] font-bold text-slate-950 mb-5">
              India Domestic
            </h3>
            <ul className="space-y-3.5">
              {indiaItems.map((item) => (
                <li
                  key={item}
                  className="text-[14.5px] text-text-muted flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-600 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-none border border-border bg-white p-8 lg:p-9 shadow-xs transition-all duration-300 hover:border-border-strong"
          >
            <h3 className="font-heading text-[22px] font-bold text-slate-950 mb-5">
              European Union
            </h3>
            <ul className="space-y-3.5">
              {euItems.map((item) => (
                <li
                  key={item}
                  className="text-[14.5px] text-text-muted flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-none bg-amber-600 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-[16px] leading-[1.65] text-text-muted mt-10 max-w-[640px] mx-auto text-pretty font-normal"
        >
          The same underlying data — carbon footprint, recycled content, supplier
          identities, mass balance — serves both regulatory masters. Enter it once.
          Stay compliant everywhere.
        </motion.p>
      </div>
    </section>
  );
}
