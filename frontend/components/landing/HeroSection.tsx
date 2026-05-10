"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  QrCode,
  FileCheck,
} from "lucide-react";

const blueprintGrid =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27 viewBox=%270 0 40 40%27%3E%3Crect width=%2740%27 height=%2740%27 fill=%27none%27 stroke=%27%23cbd5e1%27 stroke-width=%270.5%27/%3E%3C/svg%3E")';

const heroNoiseTexture =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27 viewBox=%270 0 180 180%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27180%27 height=%27180%27 filter=%27url(%2523noise)%27 opacity=%270.42%27/%3E%3C/svg%3E")';

const productionStats = [
  { icon: Factory, value: "50+", label: "Production Lines Connected" },
  { icon: QrCode, value: "< 2 min", label: "Per Passport Generation" },
  { icon: FileCheck, value: "99.8%", label: "Compliance Accuracy Rate" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#f8fafc]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_40%,#e8f5e9_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: blueprintGrid,
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute -left-24 -top-36 rounded-full blur-3xl"
          style={{
            width: "30rem",
            height: "30rem",
            background:
              "radial-gradient(circle, rgba(56, 189, 115, 0.35) 0%, rgba(56, 189, 115, 0.15) 34%, rgba(56, 189, 115, 0) 74%)",
          }}
        />
        <div
          className="absolute left-1/2 top-8 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            width: "26rem",
            height: "26rem",
            background:
              "radial-gradient(circle, rgba(190, 242, 211, 0.5) 0%, rgba(190, 242, 211, 0.2) 38%, rgba(190, 242, 211, 0) 76%)",
          }}
        />
        <div
          className="absolute -right-28 -bottom-44 rounded-full blur-3xl"
          style={{
            width: "34rem",
            height: "34rem",
            background:
              "radial-gradient(circle, rgba(148, 163, 184, 0.2) 0%, rgba(148, 163, 184, 0.08) 42%, rgba(148, 163, 184, 0) 75%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.15] mix-blend-soft-light"
          style={{
            backgroundImage: heroNoiseTexture,
            backgroundSize: "180px 180px",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.4)_0%,rgba(248,250,252,0.6)_46%,rgba(248,250,252,0.8)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-32 pb-16 text-center md:pt-40 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          <Link
            href="/docs/compliance"
            className="group mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/70 px-4 py-2 text-xs text-emerald-900 shadow-[0_8px_24px_rgba(16,185,129,0.08)] backdrop-blur-md transition-all hover:border-emerald-300 hover:bg-white/85"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            EU Battery Passport mandatory from February 2027
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mb-6 text-balance text-5xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-[5rem] lg:leading-[0.95]">
            Battery Compliance
            <br />
            <span className="text-accent-green">Without the Chaos</span>
          </h1>

          <p className="mx-auto mb-10 max-w-[40rem] text-lg leading-8 text-slate-600 sm:text-xl">
            Generate EU Battery Passports and India BIS certificates in under 2
            minutes. Track every unit from production to recycling with
            tamper-proof audit trails — purpose-built for battery manufacturers.
          </p>

          <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#006239,#0ea371)] px-8 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
            >
              Start Compliance Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact?demo=true"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-8 py-3.5 text-sm font-medium text-slate-800 backdrop-blur-md transition-all duration-200 hover:border-emerald-300 hover:bg-white"
            >
              Book a Demo
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 text-sm text-slate-600 sm:flex-row">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>14-day compliance trial</span>
            </div>
            <div className="hidden h-4 w-px bg-slate-300 sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="hidden h-4 w-px bg-slate-300 sm:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>EU 2023/1542 & BIS IS 16046 compliant</span>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-green-200 bg-green-100">
                <span className="text-xs font-bold text-green-700">EU</span>
              </div>
              <span>Reg. 2023/1542</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-100">
                <span className="text-xs font-bold text-blue-700">BIS</span>
              </div>
              <span>IS 16046 Certified</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-4 py-2 text-sm text-slate-800 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-100">
                <span className="text-xs font-bold text-amber-700">EPR</span>
              </div>
              <span>CPCB Compliant</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Production Stats Bar */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-20 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-sm divide-x divide-slate-200 overflow-hidden"
        >
          {productionStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center py-5 px-4 text-center gap-2"
              >
                <Icon className="h-5 w-5 text-green-600 mb-1" />
                <span className="text-2xl md:text-3xl font-bold text-slate-900">
                  {stat.value}
                </span>
                <span className="text-xs text-slate-500 leading-tight">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// Made with Bob
