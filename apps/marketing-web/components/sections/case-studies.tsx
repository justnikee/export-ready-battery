"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const cases = [
  {
    company: "ABC Batteries",
    location: "Gujarat, India",
    stats: [
      { value: "85%", label: "faster documentation" },
      { value: "₹15L", label: "saved in consultant fees" },
    ],
    products: "Battery Passports, BIS Tracking, Carbon Calculator",
    cta: "Read the story",
  },
  {
    company: "Tirupur Textiles",
    location: "Tamil Nadu, India",
    stats: [
      { value: "40", label: "SKUs tracked" },
      { value: "Zero", label: "missed deadlines" },
    ],
    products: "Textile DPP, OEKO-TEX, GOTS",
    cta: "Read the story",
  },
  {
    company: "GreenCell Mobility",
    location: "Hyderabad, India",
    stats: [
      { value: "14", label: "days to first export" },
      { value: "3", label: "EU markets live" },
    ],
    products: "Battery Passport, UN38.3, Blockchain",
    cta: "Read the story",
  },
];

export default function CaseStudies() {
  return (
    <section id="solutions" className="bg-[#F8FAFC] py-24 lg:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl lg:text-[40px] font-semibold text-[#0F172A] leading-[1.1] tracking-[-0.02em] mb-4">
            Powering businesses of all sizes
          </h2>
          <p className="text-lg text-[#64748B]">
            Run your export business on a reliable platform that adapts to your needs.
          </p>
        </motion.div>

        <div className="space-y-12">
          {cases.map((c, i) => (
            <motion.div
              key={c.company}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="grid lg:grid-cols-[1fr_280px] gap-8 items-center bg-white rounded-2xl border border-[#E2E8F0] p-8"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{c.company.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{c.company}</p>
                    <p className="text-xs text-[#64748B]">{c.location}</p>
                  </div>
                </div>

                <div className="flex gap-8 mb-4">
                  {c.stats.map((s) => (
                    <div key={s.label}>
                      <p className="text-2xl font-semibold text-[#0F172A]">{s.value}</p>
                      <p className="text-xs text-[#64748B]">{s.label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[#64748B] mb-3">
                  Products used: <span className="text-[#0F172A]">{c.products}</span>
                </p>

                <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-[#4F46E5] hover:underline">
                  {c.cta} <ArrowRight size={14} />
                </a>
              </div>

              <div className="hidden lg:block">
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 aspect-square flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{c.company.charAt(0)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
