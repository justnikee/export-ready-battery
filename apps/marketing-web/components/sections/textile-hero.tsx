"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function TextileHero() {
  return (
    <section className="relative pt-[120px] pb-20 lg:pt-[160px] lg:pb-[80px] overflow-hidden bg-[#f6f9fc]">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-[#533afd] text-[12px] font-medium tracking-wider mb-3">
              ANVIORA TEXTILE
            </div>
            <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-light leading-[1.05] text-[#0d253d]">
              From Fiber to Final Product. Fully Traced.
            </h1>
            <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.55] text-[#64748d] max-w-[500px]">
              EU ESPR textile DPP. REACH. OEKO-TEX. GOTS. Fiber composition. Dye
              batch tracking. One platform for every textile exporter in India.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <a
                href="/demo"
                className="inline-flex items-center justify-center h-[34px] px-4 rounded-full text-sm font-medium text-white"
                style={{ background: "#533afd" }}
              >
                Request Demo
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#533afd] hover:underline"
              >
                See Textile Passport Sample <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hidden lg:flex justify-center"
          >
            <div
              className="relative w-[280px] h-[280px] rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, #f5e9d4 0%, #ff8b2f 22%, #f96bee 56%, #533afd 100%)",
              }}
            >
              <div className="absolute inset-5 rounded-lg bg-[rgba(255,255,255,0.92)] p-4">
                <div className="text-[11px] text-[#64748d] mb-2">Textile Passport</div>
                <div className="text-[18px] font-light text-[#0d253d]">TEXT-T889</div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#64748d]">Fiber</span>
                    <span className="text-[#0d253d] font-medium">80% Cotton</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#64748d]">GOTS</span>
                    <span className="text-emerald-600 font-medium">Certified</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#64748d]">REACH</span>
                    <span className="text-[#0d253d] font-medium">Compliant</span>
                  </div>
                </div>
                <div className="mt-4 h-16 rounded bg-[#f6f9fc] flex items-center justify-center">
                  <div className="w-12 h-12 rounded bg-[rgba(83,58,253,0.1)]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
