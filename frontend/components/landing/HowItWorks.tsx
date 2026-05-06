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
    <section className="bg-white py-24">
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
            Four simple steps to fully compliant battery passports — designed for production-line speed.
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
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all duration-200 hover:border-green-300 hover:shadow-lg"
            >
              {/* Illustration */}
              <div className="w-full h-[140px] flex items-center justify-center overflow-hidden bg-gray-50">
                <step.Illustration className="w-full h-full" />
              </div>

              <div className="p-5">
                <span className="text-xs font-mono text-accent-green uppercase tracking-wider mb-1 block">
                  Step {i + 1}
                </span>
                <h3 className="text-gray-900 font-semibold mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">
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
