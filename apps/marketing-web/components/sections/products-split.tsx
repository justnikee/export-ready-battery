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
    <section className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-crew-ink max-w-[640px] mb-12 text-balance"
        >
          <TextReveal as="span" className="block">
            Two products. One identity layer.
          </TextReveal>
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {products.map((p, i) => {
            const dark = p.tagTone === "live";
            return (
              <motion.a
                key={p.name}
                href={p.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`group flex flex-col p-8 lg:p-10 rounded-[28px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,40,30,0.16)] ${
                  dark
                    ? "bg-gradient-to-br from-[#0e5a40] to-[#157a5b] text-white"
                    : "bg-paper"
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <span
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${
                      dark ? "bg-white/15 text-white" : "bg-crew-coral-soft text-crew-coral"
                    }`}
                  >
                    {p.icon}
                  </span>
                  <span
                    className={`inline-flex items-center h-7 px-3 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                      dark ? "bg-white/15 text-white" : "bg-crew-amber-soft text-[#b45309]"
                    }`}
                  >
                    {p.tag}
                  </span>
                </div>
                <h3
                  className={`font-serif text-[28px] font-semibold tracking-[-0.02em] mb-3 ${
                    dark ? "text-white" : "text-crew-ink"
                  }`}
                >
                  {p.name}
                </h3>
                <p
                  className={`text-[16px] leading-[1.6] mb-8 text-pretty ${
                    dark ? "text-white/75" : "text-crew-ink/70"
                  }`}
                >
                  {p.body}
                </p>
                <span
                  className={`inline-flex items-center gap-1 mt-auto text-[15px] font-semibold transition-colors ${
                    dark
                      ? "text-white"
                      : "text-crew-coral group-hover:text-crew-coral-light"
                  }`}
                >
                  {p.cta} <ArrowRight size={15} className="cta-arrow" />
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
