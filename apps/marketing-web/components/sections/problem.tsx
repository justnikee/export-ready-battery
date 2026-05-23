"use client";

import { motion } from "framer-motion";
import { Container, FileX, AlertTriangle } from "lucide-react";

const scenarios = [
  {
    icon: Container,
    title: "The Rotterdam Checkpoint",
    body: "Your container reaches Rotterdam. Customs flags a missing CE marking declaration. Your buyer's €800K order sits in a bonded warehouse for 18 days. You pay ₹2.3L in demurrage. The buyer sources from Vietnam next quarter.",
    accent: "border-red-500/20 bg-red-500/[0.03]",
    iconColor: "text-red-400",
  },
  {
    icon: FileX,
    title: "The Tender You Didn't Know About",
    body: "A German OEM publishes a tender requiring EU Battery Passports by 2027. Your sales team never sees it. Your competitor — who started digitizing compliance 8 months ago — bids unopposed and wins a 3-year contract.",
    accent: "border-amber-500/20 bg-amber-500/[0.03]",
    iconColor: "text-amber-400",
  },
  {
    icon: AlertTriangle,
    title: "The Certificate That Expired",
    body: "Your BIS certificate lapsed 6 weeks ago. Nobody noticed because it's filed in a PDF folder on someone's laptop. Your next batch can't be activated. Your production line stops for 4 days while you scramble for renewal.",
    accent: "border-orange-500/20 bg-orange-500/[0.03]",
    iconColor: "text-orange-400",
  },
];

export default function Problem() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-mono font-medium text-red-500 uppercase tracking-[0.15em] mb-3">
            The Problem
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 leading-tight tracking-tight">
            Three ways compliance kills your deal.
          </h2>
          <p className="mt-4 text-navy-500 max-w-lg mx-auto">
            These aren't hypotheticals. These are Monday mornings for Indian exporters who thought their product quality was enough.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-xl border p-8 ${s.accent}`}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-navy-200/60 mb-5">
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-3">{s.title}</h3>
              <p className="text-sm text-navy-600 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
