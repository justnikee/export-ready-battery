"use client";

import { motion } from "framer-motion";
import { FileText, AlertTriangle, TrendingUp } from "lucide-react";

const problems = [
  {
    icon: FileText,
    iconColor: "text-[#EF4444]",
    stat: "200+",
    statLabel: "Pages of EU Battery Regulation",
    title: "Regulations multiply faster than teams.",
    body: "EU Battery Regulation. India BWM Rules. REACH. BIS. Each market has its own 200-page rulebook. Reading them all is a full-time job most manufacturers can't afford.",
  },
  {
    icon: AlertTriangle,
    iconColor: "text-[#F59E0B]",
    stat: "₹50K+",
    statLabel: "Per day of port delay",
    title: "One missing document costs everything.",
    body: "A missing carbon footprint declaration or expired BIS certificate means your shipment sits at Rotterdam for three weeks. Every day of delay costs ₹50,000+. And your buyer starts looking for another supplier.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-[#4F46E5]",
    stat: "₹20L+",
    statLabel: "Average annual consultant cost",
    title: "Compliance shouldn't require a consultant retainer.",
    body: "Compliance consultants charge ₹2–5 lakh per audit. For a mid-size exporter doing four audits a year, that's ₹20 lakh — enough to hire two engineers. And you still have to do the paperwork yourself.",
  },
];

export default function Problem() {
  return (
    <section className="relative bg-white py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#4F46E5] mb-4"
          >
            The Compliance Reality
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F172A] tracking-[-0.02em] mb-4"
          >
            Exporting to Europe Shouldn&apos;t Feel Impossible.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#64748B] max-w-[640px] mx-auto"
          >
            Indian manufacturers lose shipments, contracts, and credibility because of paperwork. The cost isn&apos;t just money — it&apos;s missed opportunity.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              className="group relative rounded-2xl border border-[#E2E8F0] bg-white p-8 hover:border-[#4F46E5]/30 hover:shadow-lg hover:shadow-[#4F46E5]/5 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <problem.icon className={`w-5 h-5 ${problem.iconColor}`} />
              </div>

              <p className="text-4xl font-bold text-[#0F172A] mb-1">{problem.stat}</p>
              <p className="text-sm text-[#94A3B8] mb-6">{problem.statLabel}</p>

              <h3 className="text-xl font-semibold text-[#0F172A] mb-3">{problem.title}</h3>
              <p className="text-[#64748B] leading-relaxed">{problem.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-xl text-[#4F46E5] font-medium italic">
            It doesn&apos;t have to be this hard.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
