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
    <section className="py-20 lg:py-28">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-crew-ink text-center mb-12 text-balance"
        >
          One data set. Two regulatory masters.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[28px] bg-[#fdf3e3] p-7 lg:p-8"
          >
            <h3 className="font-serif text-[20px] font-semibold tracking-[-0.02em] text-crew-ink mb-5">
              India domestic
            </h3>
            <ul className="space-y-3">
              {indiaItems.map((item) => (
                <li
                  key={item}
                  className="text-[14px] text-crew-muted flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c2410c] mt-1.5 shrink-0" />
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
            className="rounded-[28px] bg-[#eef3fd] p-7 lg:p-8"
          >
            <h3 className="font-serif text-[20px] font-semibold tracking-[-0.02em] text-crew-ink mb-5">
              European Union
            </h3>
            <ul className="space-y-3">
              {euItems.map((item) => (
                <li
                  key={item}
                  className="text-[14px] text-crew-muted flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8] mt-1.5 shrink-0" />
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
          className="text-center text-[16px] leading-[1.6] text-[#131313] mt-8 max-w-[620px] mx-auto"
        >
          The same underlying data — carbon footprint, recycled content, supplier
          identities, mass balance — serves both regulatory masters. Enter it once.
          Stay compliant everywhere.
        </motion.p>
      </div>
    </section>
  );
}
