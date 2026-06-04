"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function PricingCTA() {
  return (
    <section className="py-[88px] bg-white">
      <div className="max-w-[1080px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-[28px] sm:text-[34px] font-light leading-[1.12] text-[#0d253d]">
            Still Have Questions?
          </h2>
          <p className="mt-4 text-[16px] leading-[1.55] text-[#64748d]">
            Talk to our team. We&apos;ll help you find the right plan.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <a
              href="/contact"
              className="inline-flex items-center justify-center h-[34px] px-4 rounded-full text-sm font-medium text-white"
              style={{ background: "#533afd" }}
            >
              Contact Sales
            </a>
            <a
              href="/demo"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#533afd] hover:underline"
            >
              Book a Call <ArrowRight size={14} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
