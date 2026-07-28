"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { faqs } from "@/lib/pricing-faqs";

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-[60px] antialiased">
      <div className="max-w-[1232px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-text text-[clamp(28px,3.8vw,42px)] font-bold tracking-[-0.035em] text-center mb-10"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="border-t border-border divide-y divide-border">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="py-1"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="font-heading text-[16px] font-semibold text-text group-hover:text-emerald-700 transition-colors">
                  {faq.q}
                </span>
                {openIndex === i ? (
                  <Minus size={18} className="text-emerald-600 shrink-0 ml-4" />
                ) : (
                  <Plus size={18} className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-4 transition-colors" />
                )}
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[14.5px] leading-[1.65] text-text-muted pb-5 pr-8 text-pretty font-normal">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
