"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Container, FileCheck } from "lucide-react";

function ProblemIllustration() {
  return (
    <div className="relative w-full h-full min-h-[280px] flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-red-500/[0.06] blur-3xl" />
      </div>
      <div className="relative z-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10">
          <Container className="w-8 h-8 text-red-400/60" />
        </div>
        <div className="space-y-1">
          <div className="h-2 w-32 bg-white/10 rounded-full mx-auto" />
          <div className="h-2 w-24 bg-white/5 rounded-full mx-auto" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-mono text-red-400/60 uppercase tracking-wider">Held at customs</span>
        </div>
      </div>
    </div>
  );
}

function SolutionIllustration() {
  return (
    <div className="relative w-full h-full min-h-[280px] flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-emerald-500/[0.08] blur-3xl" />
      </div>
      <div className="relative z-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <div className="h-2 w-32 bg-emerald-500/20 rounded-full mx-auto" />
          <div className="h-2 w-24 bg-emerald-500/10 rounded-full mx-auto" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <FileCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Cleared for EU</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative bg-navy-950 dot-grid overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-16 lg:pt-36 lg:pb-20">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono font-medium text-emerald-400 tracking-widest uppercase">
              Built for Indian manufacturers
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight text-balance max-w-4xl"
          >
            The EU doesn't care how good your product is{" "}
            <span className="text-gradient-emerald">if your paperwork is wrong.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base lg:text-lg text-navy-400 leading-relaxed max-w-xl text-balance"
          >
            ExportReady generates compliant digital passports for Indian battery and textile manufacturers. 
            One platform. Every regulation. Zero consultants.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <a
              href="/request-access"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors"
            >
              See if you qualify
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 text-navy-300 font-medium hover:text-white transition-colors px-6 py-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.02]"
            >
              How it works
            </a>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10"
          >
            <p className="text-[11px] font-mono text-navy-600 uppercase tracking-widest mb-3">
              Serving manufacturers exporting to the European Union
            </p>
            <p className="text-sm text-navy-700">
              Battery makers in Gujarat • Textile exporters in Tiruppur
            </p>
          </motion.div>

          {/* Split illustration */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 w-full max-w-3xl grid grid-cols-2 gap-4"
          >
            <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <ProblemIllustration />
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] overflow-hidden">
              <SolutionIllustration />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}
