"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Platform() {
  return (
    <section className="py-[88px] bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[.85fr_1.15fr] gap-10 lg:gap-[70px] items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-[#533afd] text-[12px] font-medium leading-[1.35] mb-3.5">
              Complete operating system
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-light leading-[1.12] text-[#0d253d]">
              Make your local systems a complete passport platform.
            </h2>
            <p className="text-[16px] leading-[1.55] text-[#64748d] mt-4">
              Connect ERP exports, quality folders, certificate vaults, supplier
              forms, and buyer portals into one auditable workflow.
            </p>
            <div className="mt-5">
              <a
                href="#"
                className="inline-flex items-center justify-center h-[34px] px-4 rounded-full text-sm font-medium text-white"
                style={{ background: "#533afd" }}
              >
                Explore workflows <ArrowRight size={14} className="ml-1" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative min-h-[290px] lg:min-h-[330px] rounded-xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #f5e9d4 0%, #ff8b2f 18%, #f96bee 52%, #533afd 100%)",
            }}
          >
            <div className="absolute inset-[42px_46px] rounded-xl bg-[rgba(255,255,255,0.92)] border border-[rgba(255,255,255,0.78)] p-5">
              <div className="h-3 rounded-full bg-[rgba(83,58,253,0.12)] mb-3.5" />
              <div className="h-3 w-[78%] rounded-full bg-[rgba(13,37,61,0.08)] mb-3.5" />
              <div className="h-3 w-[56%] rounded-full bg-[rgba(83,58,253,0.12)]" />
            </div>
            <div
              className="absolute top-[26px] right-[30px] w-[190px] p-3 rounded-lg bg-white border border-[#e3e8ee] text-[12px] text-[#64748d] shadow-[rgba(0,55,112,0.1)_0_12px_32px]"
            >
              Supplier data request sent
            </div>
            <div
              className="absolute bottom-[28px] left-[38px] w-[210px] p-3 rounded-lg bg-white border border-[#e3e8ee] text-[12px] text-[#64748d] shadow-[rgba(0,55,112,0.1)_0_12px_32px]"
            >
              Buyer evidence pack generated
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
