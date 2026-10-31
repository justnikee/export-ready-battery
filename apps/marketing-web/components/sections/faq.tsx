"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Zap } from "lucide-react";

const faqs = [
  {
    question: "What exactly is a Digital Product Passport?",
    answer: "A Digital Product Passport is a structured electronic record for a product. Under Regulation (EU) 2023/1542 Article 77, each LMT battery, each industrial battery above 2 kWh, and each EV battery placed on the EU market or put into service from 18 February 2027 needs one. Portable and SLI batteries need a QR, not that full passport. Anviora issues serials, QR, and a public page — it does not replace a notified body.",
  },
  {
    question: "Is my certificate data secure?",
    answer: "Data is encrypted in transit and at rest and isolated per tenant. Lifecycle events are hash-chained. You can optionally timestamp a certificate hash with OpenTimestamps. Public pages show only the public tier; partners and regulators use separate access. We do not put Bitcoin on the label as the product.",
  },
  {
    question: "Do I need a compliance team to use Anviora?",
    answer: "The first lot is a concierge path: we sit with your compliance person and issue serials together. After that, a small team can run create → activate → print → ship. AI extraction is an aid, not a substitute for the papers you already have.",
  },
  {
    question: "What if EU regulations change?",
    answer: "We update validators and copy when the Official Journal or Commission guidance changes. We do not scrape every gazette in real time. You still own legal dates for your SKU.",
  },
  {
    question: "Can my European buyers verify the passports?",
    answer: "Yes — they do not need an Anviora account. The QR opens a public page on our host with identity and the fields you publish. That is not the EU DPP Registry and not a notified-body stamp.",
  },
  {
    question: "What certificates do I need to start?",
    answer: "For an EU LMT or industrial >2 kWh lot: category, model, plant, dates, and the PDFs you already have (often UN 38.3, MSDS, DoC). BIS CRS applies to portable sealed cells, not every pack. EPR is an India placing-on-market duty, filed on the CPCB portal — we store the number.",
  },
  {
    question: "Is there a setup fee or lock-in period?",
    answer: "No setup fee, no lock-in. Every plan is a one-time credit purchase, not a recurring subscription — there's nothing to cancel. Request access for a live walkthrough and a sample passport before you buy, so you can verify it fits your use case first.",
  },
  {
    question: "Does this work with Tally?",
    answer: "There is an optional on-prem connector that talks to Tally Prime on the factory LAN (typically localhost:9000). Cloud Anviora cannot reach a factory PC. It is not live ERP sync and not required for a passport pilot.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative">
      <div className="max-w-[1232px] mx-auto border-x border-b border-border">
        <div className="px-6 pt-16 pb-16 lg:pt-20 lg:pb-20">
          {/* Header Block: Centered Pill & Headline */}
          <div className="text-center max-w-[860px] mx-auto mb-14 lg:mb-16 space-y-4 px-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-emerald-800 text-xs font-mono font-medium tracking-wider uppercase border border-emerald-500/30">
              <Zap size={13} className="text-emerald-600 fill-emerald-600" />
              FREQUENTLY ASKED QUESTIONS
            </div>

            <h2 className="font-heading text-text text-[clamp(36px,5vw,60px)] font-semibold tracking-[-0.035em] leading-[1.05] text-balance">
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
