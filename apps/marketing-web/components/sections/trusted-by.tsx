"use client";

import { motion } from "framer-motion";

const logos = [
  "BIS", "CPCB", "EU Battery", "REACH", "UN38.3", "CE Mark",
  "OEKO-TEX", "GOTS", "DGFT", "Tally", "SAP", "ISO",
];

export default function TrustedBy() {
  return (
    <section className="bg-[#FAF9F6] py-12 border-y border-black/5">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-[#999999] font-medium tracking-wide uppercase mb-8"
        >
          Trusted by more than 150 leading exporters and manufacturers
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          {logos.map((logo) => (
            <div
              key={logo}
              className="flex items-center gap-2 text-[#AAAAAA] hover:text-[#666666] transition-colors"
            >
              <div className="w-6 h-6 rounded bg-[#EEEEEE] flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#999999]">{logo.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium">{logo}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
