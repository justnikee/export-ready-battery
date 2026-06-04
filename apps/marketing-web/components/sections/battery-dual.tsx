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
    <section className="py-[88px] bg-[#f6f9fc]">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[28px] sm:text-[34px] font-light leading-[1.12] text-[#0d253d] text-center mb-10"
        >
          One Data Set. Two Regulatory Masters.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-[#e3e8ee] rounded-xl p-6"
          >
            <h3 className="text-[15px] font-medium text-[#0d253d] mb-4">
              India Domestic
            </h3>
            <ul className="space-y-3">
              {indiaItems.map((item) => (
                <li
                  key={item}
                  className="text-[13px] text-[#64748d] flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea2261] mt-1.5 shrink-0" />
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
            className="bg-white border border-[#e3e8ee] rounded-xl p-6"
          >
            <h3 className="text-[15px] font-medium text-[#0d253d] mb-4">
              European Union
            </h3>
            <ul className="space-y-3">
              {euItems.map((item) => (
                <li
                  key={item}
                  className="text-[13px] text-[#64748d] flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#533afd] mt-1.5 shrink-0" />
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
          className="text-center text-[15px] text-[#64748d] mt-8 max-w-[600px] mx-auto"
        >
          The same underlying data — carbon footprint, recycled content, supplier
          identities, mass balance — serves both regulatory masters. Enter it once.
          Stay compliant everywhere.
        </motion.p>
      </div>
    </section>
  );
}
