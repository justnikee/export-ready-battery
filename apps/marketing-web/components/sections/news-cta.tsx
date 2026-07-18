"use client";

import { motion } from "framer-motion";
import { ArrowRight, Rocket, Users, Building2 } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const nextSteps = [
  {
    icon: <Rocket size={18} />,
    title: "Starting out",
    description:
      "Map one product line and generate your first buyer-ready passport in days. Free for small exporters.",
    href: "/request-access",
    cta: "Request access",
  },
  {
    icon: <Users size={18} />,
    title: "Scaling up",
    description:
      "Close supplier gaps, track expiry dates, and share permissioned evidence packs with European buyers.",
    href: "/request-access",
    cta: "Talk to sales",
  },
  {
    icon: <Building2 size={18} />,
    title: "At scale",
    description:
      "Multi-product, multi-supplier compliance operations with API access, custom integrations, and SLA support.",
    href: "/request-access",
    cta: "Contact enterprise",
  },
];

export default function NewsCTA() {
  return (
    <section className="px-3 sm:px-5 lg:px-6 pb-20 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[32px] max-w-[1340px] mx-auto bg-gradient-to-br from-[#0e5a40] via-[#127055] to-[#1d9670] px-6 py-16 sm:px-12 lg:px-16 lg:py-20"
      >
        {/* Soft radial glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 80% at 75% 20%, rgba(255,255,255,0.14) 0%, transparent 60%)",
          }}
        />

        <div className="relative max-w-[640px] mb-12">
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-white/70 uppercase mb-3">
            Get started
          </div>
          <h2 className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-white text-balance">
            <TextReveal as="span" className="block">
              Wherever you are in your export journey, there&apos;s a path in.
            </TextReveal>
          </h2>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
          {nextSteps.map((step, i) => (
            <motion.a
              key={step.title}
              href={step.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group block p-7 rounded-3xl bg-white/9 transition-colors duration-200 hover:bg-white/15"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 text-white mb-5">
                {step.icon}
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-[14px] leading-[1.55] text-white/65 mb-5 text-pretty">
                {step.description}
              </p>
              <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-white">
                {step.cta} <ArrowRight size={14} className="cta-arrow" />
              </span>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
