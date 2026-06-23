"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    company: "OpenAI",
    logoColor: "#10B981",
    quote: "In my professional opinion, Anviora has one of the most practical and exciting applications of AI in compliance that has long been stale.",
    author: "Keith Jones",
    role: "GTM Systems Lead",
    bg: "bg-[#E8F5E9]",
    textColor: "text-[#2E7D32]",
  },
  {
    company: "Vanta",
    logoColor: "#F57C00",
    quote: "Anviora should be an essential pillar of every company's export stack, enabling outbound built on the highest quality compliance foundation possible.",
    author: "Stevie Case",
    role: "CRO",
    bg: "bg-[#FFF3E0]",
    textColor: "text-[#E65100]",
  },
  {
    company: "Intercom",
    logoColor: "#1976D2",
    quote: "This tool has always been about enabling our team to move fast and drive outsized impact on compliance execution — all while using a tool that's fun, creative, and cutting edge.",
    author: "Alexander DeMoulin",
    role: "Director of Revenue Operations",
    bg: "bg-[#E3F2FD]",
    textColor: "text-[#1565C0]",
  },
  {
    company: "Ramp",
    logoColor: "#7B1FA2",
    quote: "Every lead is pre-qualified, scored on unique signals, and routed automatically through Anviora. We're now generating pipeline from segments we weren't even touching before.",
    author: "Raman Khanna",
    role: "Growth",
    bg: "bg-[#F3E5F5]",
    textColor: "text-[#7B1FA2]",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-[#FAF9F6] py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#111111] leading-[1.1] tracking-[-0.02em] mb-12"
        >
          What our customers say about us...
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.company}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className={`rounded-3xl ${t.bg} p-8 shadow-soft hover:shadow-soft-hover transition-shadow`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center`} style={{ backgroundColor: t.logoColor }}>
                  <span className="text-white text-[10px] font-bold">{t.company.charAt(0)}</span>
                </div>
                <span className={`text-sm font-semibold ${t.textColor}`}>{t.company}</span>
              </div>

              <p className="text-[#333333] leading-relaxed mb-6">{t.quote}</p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#10B981] flex items-center justify-center text-white text-sm font-bold">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#111111]">{t.author}</p>
                  <p className="text-xs text-[#666666]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
