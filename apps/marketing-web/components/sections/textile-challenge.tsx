"use client";

import { motion } from "framer-motion";

export default function TextileChallenge() {
  return (
    <section className="py-[88px] bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-[28px] sm:text-[36px] font-light leading-[1.12] text-[#0d253d]">
              40 SKUs. 12 Certificates. One Audit.
            </h2>
            <p className="mt-4 text-[16px] leading-[1.55] text-[#64748d]">
              Textile exporters manage BIS certificates, EU REACH compliance,
              OEKO-TEX documentation, and sustainability reports across dozens of
              SKUs. Every audit is a scramble through spreadsheets and email
              threads.
            </p>
            <p className="mt-4 text-[16px] leading-[1.55] text-[#0d253d] font-medium">
              Anviora Textile turns that chaos into a single source of truth.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#f6f9fc] rounded-xl p-4 border border-[#e3e8ee]">
              <div className="text-[11px] text-[#64748d] mb-2">Before</div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-[#e3e8ee]" />
                <div className="h-2 w-[80%] rounded-full bg-[#e3e8ee]" />
                <div className="h-2 w-[60%] rounded-full bg-[#e3e8ee]" />
                <div className="h-2 w-[90%] rounded-full bg-[#e3e8ee]" />
              </div>
              <div className="mt-3 text-[11px] text-[#ea2261]">Scattered data</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[rgba(83,58,253,0.2)] shadow-[rgba(83,58,253,0.08)_0_4px_20px]">
              <div className="text-[11px] text-[#64748d] mb-2">After</div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-[rgba(83,58,253,0.16)]" />
                <div className="h-2 w-[80%] rounded-full bg-[rgba(83,58,253,0.16)]" />
                <div className="h-2 w-[60%] rounded-full bg-[rgba(83,58,253,0.16)]" />
                <div className="h-2 w-[90%] rounded-full bg-[rgba(83,58,253,0.16)]" />
              </div>
              <div className="mt-3 text-[11px] text-[#533afd] font-medium">Unified</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
