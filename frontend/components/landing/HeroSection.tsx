"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const heroNoiseTexture =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27 viewBox=%270 0 180 180%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27180%27 height=%27180%27 filter=%27url(%2523noise)%27 opacity=%270.42%27/%3E%3C/svg%3E")';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#f7f4ee]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f7f4ee_4%,#e5f5e9_28%,#e3f4eb_50%,#efe3c6_78%,#f9f5eb_100%)]" />
        <div
          className="absolute -left-24 -top-36 rounded-full blur-3xl"
          style={{
            width: "30rem",
            height: "30rem",
            background:
              "radial-gradient(circle, rgba(56, 189, 115, 0.5) 0%, rgba(56, 189, 115, 0.24) 34%, rgba(56, 189, 115, 0) 74%)",
          }}
        />
        <div
          className="absolute left-1/2 top-8 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            width: "26rem",
            height: "26rem",
            background:
              "radial-gradient(circle, rgba(190, 242, 211, 0.72) 0%, rgba(190, 242, 211, 0.32) 38%, rgba(190, 242, 211, 0) 76%)",
          }}
        />
        <div
          className="absolute -right-28 -bottom-44 rounded-full blur-3xl"
          style={{
            width: "34rem",
            height: "34rem",
            background:
              "radial-gradient(circle, rgba(232, 179, 83, 0.42) 0%, rgba(232, 179, 83, 0.18) 42%, rgba(232, 179, 83, 0) 75%)",
          }}
        />
        <div
          className="absolute left-[14%] -bottom-32 rounded-full blur-3xl"
          style={{
            width: "22rem",
            height: "22rem",
            background:
              "radial-gradient(circle, rgba(0, 98, 57, 0.3) 0%, rgba(0, 98, 57, 0.12) 44%, rgba(0, 98, 57, 0) 76%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.2] mix-blend-soft-light"
          style={{
            backgroundImage: heroNoiseTexture,
            backgroundSize: "180px 180px",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.18)_46%,rgba(255,255,255,0.34)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-32 pb-24 text-center md:pt-40 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          {/* Pill badge — urgency */}
          <Link
            href="/docs/compliance"
            className="group mb-8 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 py-2 text-xs text-emerald-950 shadow-[0_10px_35px_rgba(255,255,255,0.24)] backdrop-blur-md transition-all hover:border-emerald-300 hover:bg-white/72"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            EU Battery Passport compliance is mandatory by 2027
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Headline */}
          <h1 className="mb-6 text-balance text-5xl font-medium tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-[5.25rem] lg:leading-[0.95]">
            Battery Compliance
            <br />
            <span className="text-accent-green">Without the Chaos</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-176 text-lg leading-8 text-slate-700 sm:text-xl">
            Automate EU Battery Passport & India Battery Aadhaar compliance.
            Generate digital passports, track lifecycle, and stay audit-ready —
            all in one platform.
          </p>

          {/* CTA Buttons */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#006239,#0ea371)] px-8 py-3.5 text-sm font-medium text-white shadow-[0_18px_40px_rgba(14,163,113,0.28)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_24px_48px_rgba(14,163,113,0.36)]"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact?demo=true"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/58 px-8 py-3.5 text-sm font-medium text-slate-900 backdrop-blur-md transition-all duration-200 hover:border-emerald-300 hover:bg-white/76"
            >
              Book Demo
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-col items-center justify-center gap-6 text-sm text-slate-700/90 sm:flex-row">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>14-day free trial</span>
            </div>
            <div className="hidden h-4 w-px bg-slate-400/40 sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="hidden h-4 w-px bg-slate-400/40 sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>EU & India compliant</span>
            </div>
          </div>

          {/* Certification badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-green-200 bg-green-100">
                <span className="text-xs font-bold text-green-700">EU</span>
              </div>
              <span>Reg. 2023/1542</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-100">
                <span className="text-xs font-bold text-blue-700">BIS</span>
              </div>
              <span>IS 16046</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-100">
                <span className="text-xs font-bold text-amber-700">EPR</span>
              </div>
              <span>CPCB Compliant</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Made with Bob
