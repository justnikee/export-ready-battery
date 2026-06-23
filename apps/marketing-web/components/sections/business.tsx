"use client";

import { motion } from "framer-motion";
import TextReveal from "@/components/text-reveal";
import { Globe2, Plug, PiggyBank, ShieldCheck } from "lucide-react";

const reasons = [
  {
    icon: <Globe2 size={20} />,
    title: "Made for both markets",
    body: "India EPR and EU export compliance in one platform. No one else does both from India.",
  },
  {
    icon: <Plug size={20} />,
    title: "Works with Tally",
    body: "Native Tally integration — pull stock and purchase data straight in. No SAP, no rip-and-replace.",
  },
  {
    icon: <PiggyBank size={20} />,
    title: "Pays for itself",
    body: "We auto-file your DGFT TRACE claims, which can reimburse up to 75% of your platform cost.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Your data stays yours",
    body: "Hosted in AWS Mumbai by default. Encrypted at rest, with an immutable audit trail on every record.",
  },
];

export default function Business() {
  return (
    <section className="py-24 lg:py-32 bg-crew-paper">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[680px] mb-14"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Why Anviora
          </div>
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-normal tracking-[-0.01em] leading-[1.08] text-crew-ink">
            <TextReveal as="span" className="block">
              Enterprise-grade compliance, built for Indian manufacturers.
            </TextReveal>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-4 p-7 rounded-2xl bg-crew-paper-soft border border-crew-border"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-crew-coral-soft text-crew-coral shrink-0">
                {r.icon}
              </span>
              <div>
                <h3 className="font-serif text-[22px] font-normal tracking-[-0.01em] text-crew-ink mb-1.5">
                  {r.title}
                </h3>
                <p className="text-[16px] leading-[1.6] text-[#131313]">{r.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 max-w-[680px] text-[16px] leading-[1.6] text-crew-muted"
        >
          We&apos;re onboarding our founding cohort of battery exporters now. Early partners
          shape the roadmap and lock in launch pricing.
        </motion.p>
      </div>
    </section>
  );
}
