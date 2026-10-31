"use client";

import { motion } from "framer-motion";
import { Zap, Globe, Shield } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Automated Compliance",
    metric: "< 2 minutes",
    description:
      "Generate EU Battery Passports and validate BIS certification automatically. Eliminates 40+ hours of manual paperwork per bill-of-lading cycle.",
    features: [
      "Art. 77 passport for LMT / industrial >2 kWh / EV",
      "BIS/EPR numbers stored — not registry-filed",
      "Carbon screening estimate, not PEFCR",
    ],
  },
  {
    icon: Globe,
    title: "Multi-Market Coverage",
    metric: "EU + India",
    description:
      "Single platform for both EU Battery Regulation 2023/1542 and India BIS/EPR requirements. One product entry. Two regulatory frameworks. Zero duplication.",
    features: [
      "EU Battery Passport (Reg. 2023/1542)",
      "India CPCB EPR obligation tracking",
      "BPAN V2 serialization for Indian market",
    ],
  },
  {
    icon: Shield,
    title: "Audit-Ready from Day 1",
    metric: "10-year retention",
    description:
      "Immutable, tamper-proof BLAKE2b cryptographic audit chain. Every compliance check, every validation, every lifecycle transition — permanently recorded and regulator-ready.",
    features: [
      "BLAKE2b hash chain integrity proof",
      "Tamper-evident lifecycle records",
      "One-click CSV + PDF audit exports",
    ],
  },
];

export function WhyChooseSection() {
  return (
    <section className="bg-section-subtle py-24">
      <div className="max-w-[1320px] mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs uppercase tracking-widest font-mono text-accent-green mb-4">
            Why Manufacturers Choose Anviora
          </span>
          <h2 className="text-section-headline text-gray-900 mb-4">
            Compliance Without the Chaos
          </h2>
          <p className="text-base text-muted-light max-w-[60ch] mx-auto">
            Built for high-volume manufacturers who need strict regulatory
            adherence without slowing down production. Single platform for EU and India compliance — from batch registration to export-ready documentation.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-gradient-hover rounded-2xl p-8 group"
              >
                {/* Icon & Metric */}
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100 group-hover:border-green-200 transition-colors">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-xs font-mono text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    {benefit.metric}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-feature-title text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-light leading-relaxed mb-6">
                  {benefit.description}
                </p>

                {/* Feature List */}
                <ul className="space-y-2">
                  {benefit.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Signal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-light">
            Built for mid-size Indian pack assemblers exporting LMT or industrial packs to the EU — not a production-user count.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Made with Bob
