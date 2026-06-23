"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function FeatureOrchestrate() {
  return (
    <section className="bg-[#FAF9F6] py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Screenshot */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-3xl bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] border border-black/5 shadow-soft overflow-hidden p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                </div>
                <div className="rounded-xl bg-white/80 backdrop-blur p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center">
                      <Check size={20} className="text-[#0EA5E9]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">Blockchain Anchored</p>
                      <p className="text-xs text-[#666666]">OpenTimestamps • Bitcoin</p>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E2E8F0]">
                    <div className="h-full w-full rounded-full bg-[#0EA5E9]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/60 p-3">
                    <p className="text-xs text-[#999999]">Hash</p>
                    <p className="text-[10px] font-mono text-[#111111] truncate">a3f7c9d2e8...</p>
                  </div>
                  <div className="rounded-xl bg-white/60 p-3">
                    <p className="text-xs text-[#999999]">Timestamp</p>
                    <p className="text-[10px] text-[#111111]">2026-05-30 14:32</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#111111] leading-[1.1] tracking-[-0.02em] mb-6">
              Orchestrate and verify your data, at scale
            </h2>
            <p className="text-[#666666] text-lg mb-8 leading-relaxed">
              Bring together certificates, compliance signals, and product data. Decide who to verify, and trigger action automatically.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                "Act on your data at scale: Sync millions of records with alerts from 150+ checks",
                "Build high-intent buyer signals: Combine compliance, enrichment, and CRM data",
                "Time outreach perfectly: Alert reps, update your dashboard, or launch audits",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check size={18} className="text-[#0EA5E9] mt-0.5 shrink-0" />
                  <span className="text-[#444444]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="inline-flex items-center gap-3 rounded-xl bg-[#F5F5F0] px-4 py-3">
              <span className="text-2xl font-bold text-[#111111]">3M+</span>
              <span className="text-sm text-[#666666]">Certificates verified on-chain</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
