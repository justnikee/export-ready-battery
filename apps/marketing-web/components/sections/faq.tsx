"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Do I need a consultant if I use ExportReady?",
    answer:
      "No. ExportReady replaces the compliance consultant for standard EU Battery Passport and Textile DPP generation. For complex edge cases — custom chemistry, new regulations, or unusual supply chain structures — our team provides guidance at no extra cost.",
  },
  {
    question: "What happens when regulations change?",
    answer:
      "We monitor EU and Indian regulatory updates and push changes to your dashboard. When the EU Battery Regulation recycled-content thresholds increase in 2031, your existing passports are flagged for review. You don't have to read a 200-page PDF.",
  },
  {
    question: "Can my buyers verify passports without an account?",
    answer:
      "Yes. Every passport has a public QR code. Anyone can scan it and see the compliance data. No login. No paywall. This is required by EU law anyway.",
  },
  {
    question: "Is my production data shared with buyers?",
    answer:
      "Only what regulations require. Buyers see: chemistry, carbon class, recycling info, due diligence status. They don't see: your suppliers, your costs, your margins.",
  },
  {
    question: "What if I only export to India, not EU?",
    answer:
      "ExportReady covers India BIS, CPCB EPR, and BWM Rules 2022 compliance. Many of our customers start domestic and expand to EU when they're ready. The same platform handles both.",
  },
  {
    question: "How long does it take to generate my first passport?",
    answer:
      "If you have your certificates ready — BIS, UN38.3, IEC 62133 for batteries; OEKO-TEX, GOTS for textiles — your first batch can be live in under 30 minutes. Most of that time is uploading PDFs. Our system does the rest.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-navy-200/60 rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-medium text-navy-800 pr-4">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-navy-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-navy-600 leading-relaxed border-t border-navy-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Faq() {
  return (
    <section className="py-24 lg:py-32 bg-navy-50">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-[11px] font-mono font-medium text-emerald-600 uppercase tracking-[0.15em] mb-3">
            FAQ
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight tracking-tight">
            The questions you're actually asking.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <FaqItem question={faq.question} answer={faq.answer} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
