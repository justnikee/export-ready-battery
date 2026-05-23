"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Upload Your Batch",
    body: "Upload your production data — serial numbers, chemistry, test certificates. Our system reads BIS, UN38.3, IEC 62133, and MSDS PDFs to auto-fill 40+ compliance fields.",
  },
  {
    num: "02",
    title: "Validate Against Live Regulations",
    body: "We check your data against EU Battery Regulation 2023/1542, REACH, and India BIS/CPCB rules in real time. Gaps are flagged before they become problems.",
  },
  {
    num: "03",
    title: "Generate the Passport",
    body: "Every battery gets a unique QR code. Scan it and see: chemistry, carbon footprint, recycling info, supply chain provenance — everything EU buyers are legally required to verify.",
  },
  {
    num: "04",
    title: "Ship with Confidence",
    body: "Your passport is blockchain-anchored for immutable proof. Your buyer verifies compliance in 10 seconds. Customs clears your container. You invoice.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-navy-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-[11px] font-mono font-medium text-emerald-600 uppercase tracking-[0.15em] mb-3">
            How It Works
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight tracking-tight">
            From factory floor to EU shelf.
          </h2>
          <p className="mt-4 text-navy-500 max-w-lg">
            Four steps. No consultants. No 200-page regulation PDFs.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-[22px] left-[12%] right-[12%] h-px bg-navy-200" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="flex items-center gap-3 lg:mb-6">
                  <div className="relative z-10 w-11 h-11 rounded-full bg-white border border-navy-200 flex items-center justify-center">
                    <span className="text-sm font-mono font-medium text-emerald-500">
                      {step.num}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="lg:hidden flex-1 h-px bg-navy-200" />
                  )}
                </div>

                <h3 className="text-lg font-semibold text-navy-900 mt-4 lg:mt-0 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-navy-500 leading-relaxed">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
