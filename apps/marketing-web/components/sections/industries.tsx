"use client";

import { motion } from "framer-motion";
import { Battery, Shirt, Cpu, Car, ArrowRight } from "lucide-react";

const industries = [
  {
    icon: Battery,
    title: "Battery Manufacturing",
    body: "Li-ion, LiPo, EV packs, stationary BESS. BIS IS 16046. EU Battery Regulation 2023/1542. UN38.3. Carbon footprint. Recycled content.",
    link: "Explore Anviora Battery →",
    href: "/battery",
    tag: "Available Now",
    available: true,
  },
  {
    icon: Shirt,
    title: "Textile & Apparel",
    body: "EU REACH. OEKO-TEX. GOTS. Fiber composition. Dye batch tracking. Export documentation for Tirupur to Europe.",
    link: "Explore Anviora Textile →",
    href: "/textile",
    tag: "Available Now",
    available: true,
  },
  {
    icon: Cpu,
    title: "Electronics",
    body: "RoHS. WEEE. EPR registration. Component traceability. Coming Q4 2026.",
    link: "Join Waitlist →",
    href: "#",
    tag: "Coming Soon",
    available: false,
  },
  {
    icon: Car,
    title: "Automotive",
    body: "AIS-156. AIS-038. EV traction packs. ELV directives. Supply chain due diligence.",
    link: "Join Waitlist →",
    href: "#",
    tag: "Coming Soon",
    available: false,
  },
];

export default function Industries() {
  return (
    <section id="industries" className="relative bg-white py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#4F46E5] mb-4"
          >
            Built for Your Industry
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-[-0.02em]"
          >
            One Platform. Multiple Verticals.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-[1000px] mx-auto">
          {industries.map((industry, i) => (
            <motion.a
              key={industry.title}
              href={industry.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className={`group relative rounded-2xl border p-8 transition-all duration-300 ${
                industry.available
                  ? "border-[#E2E8F0] bg-white hover:border-[#4F46E5]/30 hover:shadow-lg hover:shadow-[#4F46E5]/5"
                  : "border-[#E2E8F0] bg-[#F8FAFC]/50 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  industry.available ? "bg-[#F8FAFC] border border-[#E2E8F0]" : "bg-[#F1F5F9]"
                }`}>
                  <industry.icon className={`w-5 h-5 ${industry.available ? "text-[#4F46E5]" : "text-[#94A3B8]"}`} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  industry.available
                    ? "bg-[#10B981]/10 text-[#10B981]"
                    : "bg-[#94A3B8]/10 text-[#94A3B8]"
                }`}>
                  {industry.tag}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[#0F172A] mb-2">{industry.title}</h3>
              <p className="text-[#64748B] leading-relaxed mb-4">{industry.body}</p>
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                industry.available ? "text-[#4F46E5]" : "text-[#94A3B8]"
              }`}>
                {industry.link}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
