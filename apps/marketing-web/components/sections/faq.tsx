"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What exactly is a Digital Product Passport?",
    answer: "A Digital Product Passport (DPP) is a digital record containing sustainability, traceability, and compliance data for a product. Under EU Battery Regulation 2023/1542, every EV, LMT, and industrial battery above 2kWh sold in the EU must have one by February 2027. Anviora generates, hosts, and maintains these passports for you.",
  },
  {
    question: "Is my certificate data secure?",
    answer: "Absolutely. We use AES-256 encryption at rest and TLS 1.3 in transit. Your data is stored in AWS Mumbai by default. We're GDPR-compliant and working toward ISO 27001 certification. Your certificates never leave Indian servers unless you explicitly choose EU storage.",
  },
  {
    question: "Do I need a compliance team to use Anviora?",
    answer: "No. Anviora is built for teams of one. Our AI handles the heavy lifting — you upload certificates and review the output. Most customers are fully operational within 2 hours of signup. If you can use Zoho Books, you can use Anviora.",
  },
  {
    question: "What if EU regulations change?",
    answer: "We track regulatory changes in real-time. When the EU updates the Battery Regulation or adds new requirements, we update the platform automatically. You'll get a notification and a clear checklist of what's new. Your existing passports update too.",
  },
  {
    question: "Can my European buyers verify the passports?",
    answer: "Yes — and they don't need an account. Every QR code links to a public passport page that shows compliance status, certificate validity, and blockchain proof. Buyers can verify in 10 seconds with any phone camera.",
  },
  {
    question: "What certificates do I need to start?",
    answer: "At minimum: BIS certification, EPR registration, and UN38.3 test report for batteries. Don't have them? The platform shows you exactly which ones you're missing and how to get them. We'll even pre-fill the application forms.",
  },
  {
    question: "Is there a setup fee or lock-in period?",
    answer: "No setup fee, no lock-in. Every plan is a one-time credit purchase, not a recurring subscription — there's nothing to cancel. Request access for a live walkthrough and a sample passport before you buy, so you can verify it fits your use case first.",
  },
  {
    question: "Does this work with Tally?",
    answer: "Yes. Our native Tally Prime connector extracts bills of materials, supplier invoices, and GST-linked transactions directly into Anviora. No manual data entry. This is a feature no global competitor offers.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative bg-[#F8FAFC] py-24 lg:py-32">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#4F46E5] mb-4"
          >
            Questions
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-[-0.02em]"
          >
            We&apos;ve Got Answers.
          </motion.h2>
        </div>

        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              className="border-b border-[#E2E8F0]"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-lg font-medium text-[#0F172A] pr-8 group-hover:text-[#4F46E5] transition-colors">
                  {faq.question}
                </span>
                <span className="shrink-0 w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center group-hover:bg-[#4F46E5]/10 transition-colors">
                  {openIndex === i ? (
                    <Minus size={16} className="text-[#4F46E5]" />
                  ) : (
                    <Plus size={16} className="text-[#64748B]" />
                  )}
                </span>
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
                    <p className="pb-5 text-[#64748B] leading-relaxed">
                      {faq.answer}
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
