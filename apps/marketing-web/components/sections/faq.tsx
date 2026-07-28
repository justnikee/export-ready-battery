"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ArrowRight } from "lucide-react";

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
    <section id="faq" className="relative">
      <div className="max-w-[1232px] mx-auto">
        {/* Section header */}
        <div className="sticky top-20 z-20 bg-bg/95 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
          <span className="section-index">FAQ</span>
          <span className="section-index text-text-dim/60">
            [<span className="text-emerald-600 font-semibold">7</span>/8]
          </span>
        </div>

        <div className="pt-16 pb-20 lg:pt-20 lg:pb-28">
          {/* Header Title */}
          <div className="px-6 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase rounded-none border border-emerald-500/20 mb-4">
              <span className="w-1.5 h-1.5 bg-emerald-600" />
              Frequently Asked Questions
            </div>
            <h2 className="font-heading text-text text-[clamp(32px,4.5vw,52px)] font-semibold tracking-[-0.035em] leading-[1.08]">
              Questions, answered.
            </h2>
          </div>

          {/* FAQ Accordion List */}
          <div className="border-t border-border">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={faq.question}
                  className={`border-b border-border transition-colors duration-300 ${
                    isOpen ? "bg-[#f4f8ff]" : "bg-transparent"
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between py-6 px-6 text-left group"
                  >
                    <div className="flex items-baseline gap-6 pr-8">
                      <span
                        className={`font-mono text-[12px] font-medium tabular-nums transition-colors ${
                          isOpen ? "text-blue" : "text-text-dim"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-[16px] font-medium transition-colors ${
                          isOpen ? "text-blue" : "text-text group-hover:text-blue"
                        }`}
                      >
                        {faq.question}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 w-7 h-7 flex items-center justify-center transition-colors duration-300 ${
                        isOpen ? "text-blue" : "text-text-dim"
                      }`}
                    >
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pl-16 pr-6 text-[15px] leading-[1.65] text-text-muted text-pretty">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
