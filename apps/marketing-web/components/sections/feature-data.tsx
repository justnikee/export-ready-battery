"use client";

import { motion } from "framer-motion";

export default function FeatureData() {
  return (
    <section id="products" className="bg-white py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-3">
              Product
            </p>
            <h2 className="text-3xl lg:text-[40px] font-semibold text-[#0F172A] leading-[1.1] tracking-[-0.02em] mb-4">
              Every compliance data point, in one place
            </h2>
            <p className="text-[#64748B] text-lg leading-relaxed mb-6">
              Understand your certificates, your batches, and the gaps between them. Then act on it. Anviora brings BIS, EPR, UN38.3, and EU Battery Regulation data into a single dashboard.
            </p>
            <a href="#" className="text-sm font-medium text-[#4F46E5] hover:underline">
              Learn more about data enrichment →
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 shadow-product">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Active Batches", val: "24" },
                    { label: "Passports", val: "156" },
                    { label: "Compliance", val: "94%", color: "text-[#10B981]" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
                      <p className={`text-xl font-semibold ${s.color || "text-[#0F172A]"}`}>{s.val}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] space-y-2">
                  {["Batch #2405 — Li-Ion 48V", "Batch #2406 — LiFePO4 72V", "Batch #2407 — NMC 36V"].map((b, i) => (
                    <div key={b} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${i === 1 ? "bg-[#F59E0B]" : "bg-[#10B981]"}`} />
                      <span className="text-sm text-[#0F172A]">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
