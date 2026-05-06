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
      "Upload your production data via CSV or connect through the API. Fields are mapped automatically.",
  },
  {
    Illustration: GeneratePassportsIllustration,
    title: "Generate Passports",
    description:
      "Our compliance engine validates data, generates unique digital battery passports with QR codes.",
  },
  {
    Illustration: TrackLifecycleIllustration,
    title: "Track Lifecycle",
    description:
      "Monitor every battery unit from manufacturing to recycling with tamper-proof audit trails.",
  },
  {
    Illustration: ExportCompliantIllustration,
    title: "Export & Stay Compliant",
    description:
      "Download QR labels, export regulatory documents, and stay audit-ready at all times.",
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
            Four simple steps to fully compliant battery passports.
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
