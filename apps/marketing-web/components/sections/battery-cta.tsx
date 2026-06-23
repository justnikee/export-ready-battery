"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function BatteryCTA() {
  return (
    <section className="py-[88px] bg-crew-paper">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-normal leading-[1.08] tracking-[-0.01em] text-crew-ink">
            Ship your first compliant battery this month.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-[#131313]">
            14-day free trial. No setup fee. Cancel anytime.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-7">
            <a
              href="/request-access"
              className="group inline-flex items-center justify-center gap-1.5 h-[44px] px-6 rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors"
            >
              Request a Demo
              <ArrowRight size={15} className="cta-arrow" />
            </a>
            <a
              href="/request-access"
              className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
            >
              Start free trial <ArrowRight size={14} className="cta-arrow" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
