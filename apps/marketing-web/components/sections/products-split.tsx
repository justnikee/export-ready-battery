"use client";

import { motion } from "framer-motion";
import { ArrowRight, BatteryCharging, Shirt } from "lucide-react";
import TextReveal from "@/components/text-reveal";

const products = [
  {
    icon: <BatteryCharging size={22} />,
    name: "Anviora Battery",
    tag: "Live",
    tagTone: "live",
    body: "EU Battery Passports plus India BIS and CPCB EPR compliance for cell makers, pack assemblers, and exporters.",
    cta: "Explore Anviora Battery",
    href: "/battery",
  },
  {
    icon: <Shirt size={22} />,
    name: "Anviora Textile",
    tag: "Early access",
    tagTone: "soon",
    body: "Get ahead of the EU's upcoming textile DPP (ESPR). Build your fiber, chemical, and certificate data foundation before the mandate lands.",
    cta: "Join the Textile waitlist",
    href: "/textile",
  },
];

export default function ProductsSplit() {
  return (
    <section className="py-24 lg:py-32 bg-crew-paper-soft">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-serif text-[clamp(30px,4.4vw,48px)] font-normal tracking-[-0.01em] leading-[1.08] text-crew-ink max-w-[640px] mb-12"
        >
          <TextReveal as="span" className="block">
            Two products. One identity layer.
          </TextReveal>
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {products.map((p, i) => (
            <motion.a
              key={p.name}
              href={p.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group flex flex-col p-8 rounded-2xl bg-crew-paper border border-crew-border transition-all duration-200 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:border-crew-coral/30"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-crew-coral-soft text-crew-coral">
                  {p.icon}
                </span>
                <span
                  className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                    p.tagTone === "live"
                      ? "bg-crew-green-soft text-crew-green"
                      : "bg-crew-amber-soft text-crew-amber"
                  }`}
                >
                  {p.tag}
                </span>
              </div>
              <h3 className="font-serif text-[28px] font-normal tracking-[-0.01em] text-crew-ink mb-3">
                {p.name}
              </h3>
              <p className="text-[16px] leading-[1.6] text-[#131313] mb-6">{p.body}</p>
              <span className="inline-flex items-center gap-1 mt-auto text-[15px] font-semibold text-crew-coral group-hover:text-crew-coral-light transition-colors">
                {p.cta} <ArrowRight size={15} className="cta-arrow" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
