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
    href: "/contact",
    cta: "Talk to sales",
  },
  {
    icon: <Building2 size={18} />,
    title: "At scale",
    description:
      "Multi-product, multi-supplier compliance operations with API access, custom integrations, and SLA support.",
    href: "/contact",
    cta: "Contact enterprise",
  },
];

export default function NewsCTA() {
  return (
    <section className="relative py-24 lg:py-32 bg-crew-paper-soft overflow-hidden">
      <div className="relative max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-[640px] mx-auto mb-14"
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-crew-coral uppercase mb-3">
            Get started
          </div>
          <h2 className="text-[clamp(30px,4vw,42px)] font-semibold tracking-[-0.03em] leading-[1.1] text-crew-ink mb-5">
            <TextReveal as="span" className="block">
              ExportReady supports any stage of your export journey
            </TextReveal>
          </h2>
          <p className="text-[17px] leading-[1.6] text-crew-muted">
            Whether you&apos;re preparing your first shipment or running a multi-market
            compliance programme, we have a path for you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {nextSteps.map((step, i) => (
            <motion.a
              key={step.title}
              href={step.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group block p-6 rounded-2xl bg-crew-paper border border-crew-border transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-crew-coral/30"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-crew-coral-soft text-crew-coral mb-5">
                {step.icon}
              </div>
              <h3 className="text-[17px] font-semibold text-crew-ink mb-2">{step.title}</h3>
              <p className="text-[14px] leading-[1.55] text-crew-muted mb-5">
                {step.description}
              </p>
              <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-crew-coral group-hover:text-crew-coral-light transition-colors">
                {step.cta} <ArrowRight size={14} className="cta-arrow" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
