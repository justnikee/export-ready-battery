"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes. Growth plans include a 14-day free trial. No credit card required. Full access to all Growth features.",
  },
  {
    q: "What happens if I exceed my batch limit?",
    a: "We'll notify you when you hit 80% of your limit. You can upgrade instantly or purchase additional batch packs.",
  },
  {
    q: "Can I switch plans?",
    a: "Anytime. Upgrade takes effect immediately. Downgrade takes effect at the end of your billing cycle.",
  },
  {
    q: "Do you offer discounts for MSMEs?",
    a: "Yes. We participate in the DGFT TRACE scheme, which can reimburse up to 75% of your platform cost. We help you file the paperwork.",
  },
  {
    q: "Is there an annual discount?",
    a: "Yes. Pay annually and save 20%.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Credit/debit cards, UPI, net banking, and Razorpay. Invoicing available for Enterprise plans.",
  },
];

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-[60px] bg-[#f6f9fc]">
      <div className="max-w-[720px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[24px] sm:text-[28px] font-light leading-[1.12] text-[#0d253d] text-center mb-8"
        >
          Frequently Asked Questions
        </motion.h2>

        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-[#e3e8ee]"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-[14px] font-medium text-[#0d253d]">
                  {faq.q}
                </span>
                {openIndex === i ? (
                  <Minus size={16} className="text-[#533afd] shrink-0 ml-4" />
                ) : (
                  <Plus size={16} className="text-[#533afd] shrink-0 ml-4" />
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
                    <p className="text-[13px] leading-[1.55] text-[#64748d] pb-4">
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
