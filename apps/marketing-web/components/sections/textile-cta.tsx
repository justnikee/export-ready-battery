"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function TextileCTA() {
  return (
    <section className="py-[88px] bg-crew-paper-soft">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-normal leading-[1.08] tracking-[-0.01em] text-crew-ink">
            Tirupur. Surat. Panipat. Europe.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-[#131313]">
            Wherever you weave, we&apos;ll get you there. Join the founding cohort before
            the ESPR mandate lands.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-7">
            <a
              href="/request-access"
              className="group inline-flex items-center justify-center gap-1.5 h-[44px] px-6 rounded-full text-[15px] font-semibold text-white bg-crew-coral hover:bg-crew-coral-light transition-colors"
            >
              Join the waitlist
              <ArrowRight size={15} className="cta-arrow" />
            </a>
            <a
              href="mailto:sales@anvayalabs.com"
              className="group inline-flex items-center gap-1 text-[15px] font-semibold text-crew-coral hover:text-crew-coral-light transition-colors"
            >
              Talk to us <ArrowRight size={14} className="cta-arrow" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
