"use client";

import { motion } from "framer-motion";
import {
  CreateBatchIllustration,
  GeneratePassportsIllustration,
  TrackLifecycleIllustration,
  ExportCompliantIllustration,
} from "./illustrations";

const steps = [
  {
    Illustration: CreateBatchIllustration,
    title: "Create Batch",
    description:
      "Upload production manifests via CSV or REST API. Fields auto-map to regulatory schemas for EU Regulation 2023/1542 and India BWM Rules.",
  },
  {
    Illustration: GeneratePassportsIllustration,
    title: "Generate Passports",
    description:
      "Compliance engine validates every unit against current regulatory rulesets. Each battery receives a unique UUID + scannable QR passport.",
  },
  {
    Illustration: TrackLifecycleIllustration,
    title: "Track Lifecycle",
    description:
      "Enforce the DPP lifecycle state machine — Created → Active → Shipped → In-Service → Recycled — with BLAKE2b cryptographic proof at every transition.",
  },
  {
    Illustration: ExportCompliantIllustration,
    title: "Export & Stay Compliant",
    description:
      "Print QR labels for physical battery units, export audit-proof documentation (CSV + PDF), and stay customs-ready for EU and India export clearance.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_62%,#f3f8f6_100%)] py-24">
      <div className="max-w-[1320px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs uppercase tracking-widest mb-4 block font-mono text-green-600">
            How it Works
          </span>
          <h2 className="text-section-headline text-gray-900 mb-4">
            From Batch to Compliance in Minutes
          </h2>
          <p className="text-base max-w-[48ch] mx-auto text-gray-600">
            Four simple steps to fully compliant battery passports — designed
            for production-line speed.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200/80 hover:shadow-[0_24px_52px_rgba(15,23,42,0.08)]"
            >
              {/* Illustration */}
              <div className="relative flex h-[156px] w-full items-center justify-center overflow-hidden border-b border-slate-200/70 bg-[radial-gradient(circle_at_50%_0%,rgba(15,143,98,0.10),transparent_42%),linear-gradient(180deg,#fbfdfc_0%,#f3f7f5_100%)]">
                <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.58)_100%)]" />
                <step.Illustration className="h-full w-full scale-[0.97] opacity-[0.96]" />
              </div>

              <div className="p-6">
                <span className="mb-2 block text-[11px] font-mono uppercase tracking-[0.22em] text-accent-green/90">
                  Step {i + 1}
                </span>
                <h3 className="mb-2 text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Made with Bob
