"use client";

import { motion } from "framer-motion";

export default function FeatureAI() {
  return (
    <section className="bg-[#F8FAFC] py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 relative"
          >
            <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-product">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-[#F8FAFC] p-4 border border-[#E2E8F0]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center">
                      <span className="text-[#4F46E5] text-xs font-bold">AI</span>
                    </div>
                    <span className="text-sm font-medium text-[#0F172A]">Certificate Parser</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E2E8F0]">
                    <div className="h-full w-[85%] rounded-full bg-[#4F46E5]" />
                  </div>
                  <p className="text-xs text-[#64748B] mt-2">Extracting 40+ fields from BIS_certificate.pdf...</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                    <p className="text-[11px] text-[#64748B]">Manufacturer</p>
                    <p className="text-sm font-medium text-[#0F172A]">ABC Batteries</p>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                    <p className="text-[11px] text-[#64748B]">BIS Number</p>
                    <p className="text-sm font-medium text-[#0F172A] font-mono">R-12345678</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-3">
              AI-Powered
            </p>
            <h2 className="text-3xl lg:text-[40px] font-semibold text-[#0F172A] leading-[1.1] tracking-[-0.02em] mb-4">
              AI that parses certificates in seconds
            </h2>
            <p className="text-[#64748B] text-lg leading-relaxed mb-6">
              Upload any PDF — BIS, EPR, UN38.3, IEC 62133. Our AI extracts 40+ compliance fields automatically. No manual copying at 11 PM.
            </p>
            <a href="#" className="text-sm font-medium text-[#4F46E5] hover:underline">
              Learn more about AI parsing →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
