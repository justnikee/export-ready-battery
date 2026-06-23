"use client";

import { motion } from "framer-motion";

export default function FeatureVerify() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-3">
              Verification
            </p>
            <h2 className="text-3xl lg:text-[40px] font-semibold text-[#0F172A] leading-[1.1] tracking-[-0.02em] mb-4">
              Blockchain-verified certificates
            </h2>
            <p className="text-[#64748B] text-lg leading-relaxed mb-6">
              Anchor your certificates to the Bitcoin blockchain via OpenTimestamps. Buyers verify document integrity in seconds. Free. No crypto wallet needed.
            </p>
            <a href="#" className="text-sm font-medium text-[#4F46E5] hover:underline">
              Learn more about blockchain anchoring →
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
                <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center">
                      <span className="text-[#0EA5E9] text-lg">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">Blockchain Anchored</p>
                      <p className="text-xs text-[#64748B]">OpenTimestamps • Bitcoin</p>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E2E8F0]">
                    <div className="h-full w-full rounded-full bg-[#0EA5E9]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-[#E2E8F0]">
                    <p className="text-[11px] text-[#64748B]">Hash</p>
                    <p className="text-[10px] font-mono text-[#0F172A] truncate">a3f7c9d2e8...</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-[#E2E8F0]">
                    <p className="text-[11px] text-[#64748B]">Timestamp</p>
                    <p className="text-[10px] text-[#0F172A]">2026-05-30 14:32</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
