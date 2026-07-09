"use client";

import { motion } from "framer-motion";
import { FileWarning, Ship, CalendarClock } from "lucide-react";
import TextReveal from "@/components/text-reveal";
import DeadlineCountdown from "@/components/deadline-countdown";

const pains = [
  {
    icon: <FileWarning size={20} />,
    title: "200+ pages of EU regulation",
    body: "A full-time compliance hire — or ₹3L+ in consultants — just to understand what's required of you.",
  },
  {
    icon: <Ship size={20} />,
    title: "Held at the port",
    body: "One missing carbon declaration or Declaration of Conformity can cost ₹50,000+ a day in demurrage.",
  },
  {
    icon: <CalendarClock size={20} />,
    title: "Certificates that expire silently",
    body: "BIS lapses every two years. Miss the renewal and production — or a shipment — stops.",
  },
];

export default function ComplianceCliff() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Countdown + headline row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-14 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
              The compliance cliff
            </div>
            <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-crew-ink text-balance">
              <TextReveal as="span" className="block">
                The rules changed. The paperwork didn&apos;t keep up.
              </TextReveal>
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6] text-[#131313] max-w-[480px]">
              EU Battery Regulation 2023/1542 is law. Every battery sold in Europe
              will need a digital passport. Most Indian manufacturers haven&apos;t started.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="p-6 sm:p-8 rounded-[28px] bg-white shadow-[0_2px_16px_rgba(26,32,26,0.05)]"
          >
            <DeadlineCountdown variant="block" />
          </motion.div>
        </div>

        {/* Pain cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {pains.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-7 rounded-3xl bg-white shadow-[0_2px_16px_rgba(26,32,26,0.05)]"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#fef2f2] text-[#dc2626] mb-5">
                {p.icon}
              </div>
              <h3 className="font-serif text-[22px] font-semibold tracking-[-0.02em] text-crew-ink mb-2">
                {p.title}
              </h3>
              <p className="text-[16px] leading-[1.6] text-[#131313]">{p.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 text-[18px] font-medium text-crew-ink"
        >
          Compliance is no longer a cost center — it&apos;s how you win the order.
          Anviora replaces the scramble with a single source of truth.
        </motion.p>
      </div>
    </section>
  );
}
