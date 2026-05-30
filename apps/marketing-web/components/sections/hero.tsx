"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="self-stretch pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full relative z-10">
      <div className="w-full max-w-[1273px] lg:w-[1273px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8"
        >
          <h1 className="w-full max-w-[1016px] text-center flex justify-center flex-col text-[#37322F] text-[28px] sm:text-[40px] md:text-[52px] lg:text-[72px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-[1.1] font-serif px-2 sm:px-4 md:px-0 text-balance">
            The EU doesn&apos;t care how good your product is
            <br className="hidden sm:block" />
            if your paperwork is wrong.
          </h1>
          <p className="w-full max-w-[687px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] text-sm sm:text-base lg:text-lg leading-[1.4] sm:leading-[1.45] lg:leading-7 font-sans px-2 sm:px-4 md:px-0 font-medium">
            ExportReady generates compliant digital passports for Indian battery and textile manufacturers. One platform. Every regulation. Zero consultants.
          </p>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-6 sm:mt-8 lg:mt-12 relative z-10"
      >
        <a
          href="/request-access"
          className="h-10 sm:h-11 lg:h-12 px-8 sm:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center gap-2 hover:bg-[#2A2520] transition-colors group"
        >
          <div className="w-20 sm:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply" />
          <span className="flex flex-col justify-center text-white text-sm sm:text-base font-medium leading-5 font-sans relative z-10">
            See if you qualify
          </span>
          <ArrowRight className="w-4 h-4 text-white relative z-10 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </motion.div>

      {/* Trust bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8 sm:mt-10 lg:mt-14 text-center relative z-10"
      >
        <p className="text-[11px] font-medium text-[#605A57] uppercase tracking-[0.15em] mb-2">
          Serving manufacturers exporting to the European Union
        </p>
        <p className="text-sm text-[#847971]">
          Battery makers in Gujarat &middot; Textile exporters in Tiruppur
        </p>
      </motion.div>

      {/* Dashboard Preview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="w-full max-w-[1304px] lg:w-[1304px] pt-6 sm:pt-8 lg:pt-10 pb-6 sm:pb-8 lg:pb-10 px-2 sm:px-4 lg:px-11 flex flex-col justify-center items-center gap-2 relative z-5 mt-8 sm:mt-12 lg:mt-16"
      >
        <div className="w-full max-w-[1304px] lg:w-[1304px] h-[200px] sm:h-[300px] md:h-[450px] lg:h-[560px] bg-white shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9px] flex flex-col justify-start items-start">
          <div className="self-stretch flex-1 flex justify-start items-start">
            <div className="w-full h-full flex items-center justify-center bg-[#FAFAF8]">
              <div className="flex flex-col items-center gap-4 p-8">
                <div className="flex gap-3">
                  <div className="w-32 h-40 sm:w-40 sm:h-52 lg:w-48 lg:h-60 bg-white rounded-lg border border-[rgba(55,50,47,0.08)] shadow-sm p-4 flex flex-col gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F7F5F3] flex items-center justify-center">
                      <div className="w-4 h-4 rounded-sm bg-[#37322F]/10" />
                    </div>
                    <div className="h-2 w-20 bg-[#E0DEDB] rounded-full" />
                    <div className="h-2 w-14 bg-[#E0DEDB]/60 rounded-full" />
                    <div className="mt-auto h-16 w-full bg-[#F7F5F3] rounded-md" />
                  </div>
                  <div className="w-32 h-40 sm:w-40 sm:h-52 lg:w-48 lg:h-60 bg-white rounded-lg border border-[rgba(55,50,47,0.08)] shadow-sm p-4 flex flex-col gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F7F5F3] flex items-center justify-center">
                      <div className="w-4 h-4 rounded-sm bg-[#37322F]/10" />
                    </div>
                    <div className="h-2 w-20 bg-[#E0DEDB] rounded-full" />
                    <div className="h-2 w-14 bg-[#E0DEDB]/60 rounded-full" />
                    <div className="mt-auto h-16 w-full bg-[#F7F5F3] rounded-md" />
                  </div>
                  <div className="hidden sm:flex w-32 h-40 sm:w-40 sm:h-52 lg:w-48 lg:h-60 bg-white rounded-lg border border-[rgba(55,50,47,0.08)] shadow-sm p-4 flex-col gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F7F5F3] flex items-center justify-center">
                      <div className="w-4 h-4 rounded-sm bg-[#37322F]/10" />
                    </div>
                    <div className="h-2 w-20 bg-[#E0DEDB] rounded-full" />
                    <div className="h-2 w-14 bg-[#E0DEDB]/60 rounded-full" />
                    <div className="mt-auto h-16 w-full bg-[#F7F5F3] rounded-md" />
                  </div>
                </div>
                <p className="text-[#828387] text-xs sm:text-sm font-medium">Compliance Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
