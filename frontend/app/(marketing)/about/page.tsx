"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, ShieldCheck, Zap, Globe, ArrowRight } from "lucide-react";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Regulatory Precision",
    description:
      "Validation rulesets sourced directly from EU Regulation 2023/1542 and India BIS IS 16046. Every passport generated is audit-grade and customs-ready.",
  },
  {
    icon: Zap,
    title: "Production-Line Speed",
    description:
      "CSV batch upload or REST API integration — process thousands of battery units per batch. Sub-40ms API responses keep your production line moving.",
  },
  {
    icon: Globe,
    title: "Multi-Market by Design",
    description:
      "Single passport works for both EU and India regulatory frameworks. No duplicate data entry. No dual-system overhead.",
  },
];

export default function AboutPage() {
  return (
    <section className="pt-32 pb-24 px-4 bg-white">
      <div className="mx-auto w-full max-w-6xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20 space-y-6"
        >
          <span className="inline-block text-xs uppercase tracking-widest font-mono text-accent-green">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-heading text-[#0B1F3B]">
            Compliance Infrastructure for Battery Manufacturers
          </h1>
          <p className="text-lg text-zinc-600 max-w-3xl mx-auto">
            ExportReady was built to solve the compliance gap battery
            manufacturers face when exporting across regulated markets. Before
            ExportReady, compliance meant spreadsheets, manual certification
            tracking, and regulatory uncertainty. We replaced that with
            automation, cryptographic audit trails, and a single platform for EU
            and India compliance.
          </p>
        </motion.div>

        {/* Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-2xl font-heading text-[#0B1F3B] text-center mb-12">
            How We Build
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="p-8 rounded-xl border border-gray-200 bg-white hover:border-green-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5 text-accent-green" />
                </div>
                <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 p-12 rounded-2xl bg-gradient-hero border border-green-100"
        >
          <Target className="h-8 w-8 text-accent-green mx-auto mb-4" />
          <h2 className="text-2xl font-heading text-[#0B1F3B] mb-4">
            Our Mission
          </h2>
          <p className="text-base text-zinc-600 max-w-2xl mx-auto">
            Make battery compliance simple, transparent, and enforcement-ready
            for every manufacturer — from 100-unit producers to 100,000-unit
            exporters. No matter the market, no matter the scale.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-cta-button px-8 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-95"
          >
            Talk to Our Team
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-accent-green hover:text-accent-green"
          >
            Read the Docs
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
