"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shirt, Factory, Leaf, Globe, FileText, Bell } from "lucide-react";

const complianceItems = [
  "Fiber Composition Reporting",
  "OEKO-TEX Certification Tracking",
  "GOTS Certification Management",
  "REACH Compliance",
  "Supply Chain Tier Mapping",
  "Facility Audit Documentation",
  "EU ESPR Readiness",
  "Digital Product Passport (DPP)",
];

const workflowSteps = [
  {
    title: "Upload Fabric Specs",
    body: "Import fiber composition, weight, and finish details. Attach supplier certificates and mill audit reports.",
  },
  {
    title: "Map Supply Chain",
    body: "Document every tier: fiber source → yarn spinner → fabric mill → dye house → finished goods. buyers need visibility.",
  },
  {
    title: "Attach Certifications",
    body: "Link OEKO-TEX, GOTS, and REACH documentation to each batch. Auto-track expiry dates with 90-day alerts.",
  },
  {
    title: "Generate & Publish DPP",
    body: "Create a Digital Product Passport for every SKU. Share via QR code with EU brands, retailers, and regulators.",
  },
];

export default function TextilePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-navy-950 dot-grid overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-[11px] font-mono font-medium text-emerald-400 uppercase tracking-widest mb-4">
              Textile DPP
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
              Digital Product Passports for textile exports to the European Union.
            </h1>
            <p className="mt-6 text-lg text-navy-400 leading-relaxed max-w-xl">
              Fiber traceability, certification management, and REACH compliance — from Tiruppur to Berlin.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/request-access"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors"
              >
                Request Access for Textile DPP
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 text-navy-300 font-medium hover:text-white transition-colors px-6 py-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.02]"
              >
                Back to Homepage
              </a>
            </div>
          </motion.div>
        </div>
        <div className="h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* The Coming Regulation */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[11px] font-mono font-medium text-emerald-600 uppercase tracking-[0.15em] mb-3">
                The Regulation
              </p>
              <h2 className="text-3xl font-bold text-navy-900 leading-tight mb-4">
                EU ESPR & Digital Product Passports
              </h2>
              <div className="space-y-4 text-navy-600 text-sm leading-relaxed">
                <p>
                  The EU Ecodesign for Sustainable Products Regulation (ESPR) mandates Digital Product Passports 
                  for textiles sold in Europe by 2027. Every garment, every fabric roll, every home textile 
                  will need a passport.
                </p>
                <p>
                  For Indian textile exporters, this means documenting fiber origin, chemical usage, 
                  water consumption, and supply chain tiers — all in a machine-readable format that EU brands 
                  and regulators can verify instantly.
                </p>
                <p>
                  The brands you sell to — H&M, Zara, Adidas, Decathlon — are already asking for this data. 
                  ESPR just makes it law.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-navy-200/60 bg-navy-50 p-8"
            >
              <h3 className="text-sm font-semibold text-navy-900 mb-5">
                Compliance Coverage
              </h3>
              <div className="space-y-3">
                {complianceItems.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm text-navy-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 bg-navy-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-[11px] font-mono font-medium text-emerald-600 uppercase tracking-[0.15em] mb-3">
              Workflow
            </p>
            <h2 className="text-3xl font-bold text-navy-900">How Textile DPP Works</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-4xl font-bold text-navy-100 mb-3">0{i + 1}</div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">{step.title}</h3>
                <p className="text-sm text-navy-600 leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer Portal */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-navy-900 mb-4">
                What EU Buyers See
              </h2>
              <p className="text-navy-600 mb-6">
                When an EU brand scans your product's QR code, they get everything regulations require — 
                and nothing they don't.
              </p>
              <div className="space-y-3">
                {[
                  "Fiber composition (% cotton, polyester, wool, etc.)",
                  "OEKO-TEX / GOTS certification status",
                  "REACH compliance declaration",
                  "Supply chain tier map (Tier 1, 2, 3)",
                  "Facility names and locations",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-navy-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">
                  <strong>What they DON'T see:</strong> Your supplier pricing, your margins, 
                  your internal production data. Only regulatory-required information is shared.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-navy-200/60 bg-white p-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-navy-100">
                  <span className="text-sm font-semibold text-navy-900">Product DPP</span>
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Verified</span>
                </div>
                {[
                  { label: "Fiber", value: "100% Organic Cotton" },
                  { label: "OEKO-TEX", value: "Standard 100 — Class I" },
                  { label: "GOTS", value: "Certified — CU-123456" },
                  { label: "Facility", value: "Tiruppur Mill 3, India" },
                  { label: "REACH", value: "Compliant — No SVHC > 0.1%" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-navy-500">{row.label}</span>
                    <span className="text-sm text-navy-800 font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 bg-navy-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-navy-900 mb-4">Simple, one-time pricing</h2>
          <p className="text-navy-600 mb-8">
            Pay per batch activation. No subscriptions. No recurring fees. Your activations never expire.
          </p>
          <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto mb-8">
            {[
              { name: "Starter", price: "₹4,999", activations: "10 batches" },
              { name: "Growth", price: "₹19,999", activations: "50 batches", popular: true },
              { name: "Enterprise", price: "Custom", activations: "200+ batches" },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 text-left ${
                  plan.popular ? "border-emerald-500 border-2" : "border-navy-200/60"
                }`}
              >
                {plan.popular && (
                  <span className="inline-block text-[10px] font-semibold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider mb-3">
                    Most Popular
                  </span>
                )}
                <p className="text-sm font-semibold text-navy-900">{plan.name}</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">{plan.price}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{plan.activations}</p>
              </div>
            ))}
          </div>
          <a
            href="/request-access"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors"
          >
            Request Access
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer link */}
      <section className="py-12 border-t border-navy-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-sm text-navy-500 hover:text-navy-700">
            ← Back to Homepage
          </Link>
          <Link href="/battery" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Explore Battery Passport →
          </Link>
        </div>
      </section>
    </main>
  );
}
