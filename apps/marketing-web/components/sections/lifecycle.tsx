"use client";

import { motion } from "framer-motion";
import { Factory, Fingerprint, ShieldCheck, MapPin, Recycle } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Factory,
    title: "Manufacture",
    body: "Create production batches with unique serial IDs. Import from Tally, ERP, or enter manually.",
  },
  {
    num: "02",
    icon: Fingerprint,
    title: "Identify",
    body: "Assign each product a digital passport. Auto-generate QR codes, GTINs, and EU-compliant identifiers.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Verify",
    body: "AI parses certificates. Blockchain anchors documents. Compliance scores update in real time.",
  },
  {
    num: "04",
    icon: MapPin,
    title: "Track",
    body: "Log every lifecycle event — shipment, inspection, repair, resale. Complete audit trail, immutable and exportable.",
  },
  {
    num: "05",
    icon: Recycle,
    title: "Recycle",
    body: "Document end-of-life for EPR compliance. Mass balance ledgers. Recycled content certificates. Circular economy, proven.",
  },
];

export default function Lifecycle() {
  return (
    <section id="products" className="relative bg-[#F8FAFC] py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#4F46E5] mb-4"
          >
            How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-[-0.02em] mb-4"
          >
            From Factory Floor to European Warehouse.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#64748B] max-w-[560px] mx-auto"
          >
            One platform. One record. Every step of the journey.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connector line - desktop */}
          <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-[2px]">
            <div className="w-full h-full bg-gradient-to-r from-[#E2E8F0] via-[#4F46E5]/20 to-[#E2E8F0]" />
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="relative flex flex-col items-center text-center"
              >
                <span className="text-6xl lg:text-7xl font-bold text-[#4F46E5]/10 leading-none mb-4">
                  {step.num}
                </span>
                <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shadow-sm mb-4">
                  <step.icon className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{step.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed max-w-[220px]">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
