"use client";

import { useState } from "react";
import { motion } from "framer-motion";

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)]">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
        aria-expanded={open}
      >
        <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">
          {question}
        </div>
        <div className="flex justify-center items-center">
          <ChevronDownIcon
            className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-[18px] text-[#605A57] text-sm font-normal leading-6 font-sans">
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  return (
    <section className="self-stretch border-b border-[rgba(55,50,47,0.12)] flex justify-center items-start">
      <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12 w-full">
        {/* Left Column - Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5"
        >
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                <rect x="7" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                <rect x="1" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                <rect x="7" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
              </svg>
            }
            text="FAQ"
          />
          <div className="w-full flex flex-col justify-center text-[#49423D] font-semibold leading-tight md:leading-[44px] font-sans text-3xl sm:text-4xl tracking-tight">
            The questions you&apos;re actually asking.
          </div>
          <div className="w-full text-[#605A57] text-base font-normal leading-7 font-sans">
            Everything you need to know about getting your products EU-ready.
          </div>
        </motion.div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <FaqItem question={item.question} answer={item.answer} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
