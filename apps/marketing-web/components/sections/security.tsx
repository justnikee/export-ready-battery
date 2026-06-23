"use client";

import { motion } from "framer-motion";

const badges = [
  { label: "AES-256", desc: "Encryption at rest", color: "from-[#C8E6C9] to-[#A5D6A7]" },
  { label: "GDPR", desc: "Compliant", color: "from-[#BBDEFB] to-[#90CAF9]" },
  { label: "ISO", desc: "27001 Ready", color: "from-[#FFE0B2] to-[#FFCC80]" },
  { label: "Blockchain", desc: "OpenTimestamps", color: "from-[#E1BEE7] to-[#CE93D8]" },
  { label: "AWS", desc: "Mumbai Region", color: "from-[#FFCDD2] to-[#EF9A9A]" },
];

export default function Security() {
  return (
    <section className="bg-[#FAF9F6] py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#111111] leading-[1.1] tracking-[-0.02em] mb-4">
            Backed by enterprise-grade security and scale
          </h2>
          <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 text-sm font-medium text-[#666666] hover:bg-black/5 transition-colors">
            Security at Anviora →
          </a>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="flex flex-col items-center text-center"
            >
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg mb-3`}>
                <span className="text-sm font-bold text-[#111111]">{badge.label}</span>
              </div>
              <p className="text-xs text-[#666666]">{badge.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
