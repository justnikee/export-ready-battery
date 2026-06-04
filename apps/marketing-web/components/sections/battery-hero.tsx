"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function BatteryHero() {
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
              ANVIORA BATTERY
            </div>
            <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-light leading-[1.05] text-[#0d253d]">
              The Identity Layer for Every Battery You Ship.
            </h1>
            <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.55] text-[#64748d] max-w-[500px]">
              EU Battery Regulation 2023/1542. BIS IS 16046. UN38.3. Carbon
              footprint. One platform. One record. Zero paperwork anxiety.
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
                See Sample Passport <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative hidden lg:flex justify-center"
          >
            <div
              className="w-[160px] h-[320px] p-[10px] rounded-[32px] relative"
              style={{
                background: "#0f1b4f",
                transform: "rotate(-8deg)",
                boxShadow: "rgba(0,55,112,.24) 0 24px 50px",
              }}
            >
              <div className="h-full rounded-[24px] bg-white px-3 py-5">
                <div className="w-10 h-[5px] mx-auto mb-6 rounded-full bg-[#e3e8ee]" />
                <div className="text-[#0d253d] text-[18px] leading-[1.1] font-light">
                  Scan Passport
                </div>
                <div className="mt-4 mx-auto w-[80px] h-[80px] rounded-lg border-2 border-dashed border-[#e3e8ee] flex items-center justify-center">
                  <div className="w-12 h-12 rounded bg-[rgba(83,58,253,0.1)]" />
                </div>
                <div className="mt-4 text-[11px] text-[#64748d] text-center">
                  LFP-B4471
                </div>
                <div className="mt-2 grid gap-2 px-2">
                  <div className="h-2 rounded-full bg-[#f6f9fc]" />
                  <div className="h-2 w-[70%] rounded-full bg-[rgba(83,58,253,0.16)]" />
                </div>
              </div>
            </div>
            <div
              className="absolute right-4 top-8 w-[220px] p-4 rounded-xl"
              style={{
                background: "rgba(255,255,255,.96)",
                border: "1px solid rgba(227,232,238,.86)",
                boxShadow: "rgba(0,55,112,.16) 0 24px 58px",
                transform: "rotate(3deg)",
              }}
            >
              <div className="text-[11px] text-[#64748d] mb-2">Battery Passport</div>
              <div className="text-[20px] font-light text-[#0d253d]">LFP-B4471</div>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#64748d]">Status</span>
                  <span className="text-emerald-600 font-medium">Ready</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#64748d]">Carbon</span>
                  <span className="text-[#0d253d] font-medium">Class B</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
