"use client";

import { motion } from "framer-motion";

const quotes = [
  {
    text: "Before Anviora, we spent 3 days preparing compliance docs for every EU shipment. Last month we did it in 20 minutes. Our German buyer actually complimented us on how professional our Battery Passports looked.",
    author: "Rajesh Mehta",
    role: "Export Manager",
    company: "ABC Batteries, Gujarat",
  },
  {
    text: "The BIS certificate expiry alerts alone saved us from a production halt. We renewed 48 hours before expiry. That single alert probably saved us ₹15 lakhs in delayed shipments.",
    author: "Priya Krishnan",
    role: "Compliance Officer",
    company: "Tirupur Textiles, Tamil Nadu",
  },
];

export default function Quotes() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="space-y-16">
          {quotes.map((q, i) => (
            <motion.div
              key={q.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="max-w-[800px]"
            >
              <p className="text-2xl lg:text-3xl text-[#0F172A] leading-snug tracking-[-0.01em] mb-8">
                &ldquo;{q.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-sm font-semibold text-[#64748B]">
                  {q.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{q.author}</p>
                  <p className="text-xs text-[#64748B]">{q.role}, {q.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
