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
    answer: "Yes. Your data is encrypted in transit and at rest, isolated per tenant, and every record carries an audit trail. Certificate hashes are anchored to the Bitcoin blockchain via OpenTimestamps, so any tampering is independently detectable. You control exactly which fields appear on public passport pages — buyers and regulators each see only their access tier.",
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
    <section id="faq" className="relative py-20 lg:py-28">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[13px] font-semibold tracking-[-0.01em] uppercase text-crew-coral mb-3"
          >
            Questions
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em] leading-[1.08] text-crew-ink"
          >
            Questions, answered.
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
              className="border-b border-crew-ink/8"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
              >
                <span className="text-lg font-medium text-crew-ink pr-8 group-hover:text-crew-coral transition-colors">
                  {faq.question}
                </span>
                <span className="shrink-0 w-8 h-8 rounded-lg bg-paper flex items-center justify-center group-hover:bg-crew-coral-soft transition-colors">
                  {openIndex === i ? (
                    <Minus size={16} className="text-crew-coral" />
                  ) : (
                    <Plus size={16} className="text-crew-muted" />
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
                    <p className="pb-5 text-crew-muted leading-relaxed">
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
