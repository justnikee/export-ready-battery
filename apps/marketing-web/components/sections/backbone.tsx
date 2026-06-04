"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "80+", label: "passport fields tracked per product" },
  { value: "2027", label: "EU Battery Passport deadline" },
  { value: "99.9%", label: "evidence version history retained" },
  { value: "24h", label: "buyer evidence pack turnaround" },
];

export default function Backbone() {
  return (
    <section className="text-center bg-white pt-[86px] overflow-hidden">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[28px] sm:text-[34px] font-light leading-[1.12] text-[#0d253d] mb-10"
        >
          The backbone of verifiable global trade
        </motion.h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#e3e8ee] mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="px-5 pb-6 text-left border-r border-[#e3e8ee] last:border-r-0"
            >
              <strong
                className="block text-[#0d253d] text-[22px] sm:text-[24px] font-light mb-1.5"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {s.value}
              </strong>
              <span className="text-[12px] leading-[1.35] text-[#64748d]">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Burst graphic */}
      <div
        className="w-[min(760px,120vw)] h-[250px] mx-auto -mb-[54px]"
        style={{
          background:
            "repeating-conic-gradient(from 182deg at 50% 100%, rgba(245,155,56,.88) 0deg 1deg, transparent 1deg 3deg), linear-gradient(180deg, rgba(83,58,253,.08), rgba(83,58,253,0))",
          clipPath: "ellipse(50% 100% at 50% 100%)",
        }}
        aria-hidden="true"
      />
    </section>
  );
}
