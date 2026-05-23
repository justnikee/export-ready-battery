"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Battery, Shield, FileText, Globe, Zap, Bell, Upload, Code } from "lucide-react";

const complianceItems = [
  { label: "Carbon Footprint (Art. 7)", icon: Zap },
  { label: "Recycled Content (Art. 8)", icon: Shield },
  { label: "Due Diligence (Art. 11)", icon: FileText },
  { label: "Performance (Annex IV)", icon: Battery },
  { label: "Passport (Art. 77)", icon: Globe },
  { label: "CE Marking & DoC", icon: Check },
  { label: "REACH / RoHS", icon: Shield },
  { label: "BIS IS 16046", icon: Check },
  { label: "CPCB EPR", icon: Check },
  { label: "UN38.3 / IEC 62133", icon: Check },
];

const workflowSteps = [
  {
    title: "Upload Batch Data",
    body: "Import serial numbers, chemistry specs, and certificate PDFs. Our AI reads BIS, UN38.3, IEC 62133, and MSDS documents to auto-fill compliance fields.",
  },
  {
    title: "Run Compliance Check",
    body: "Real-time validation against EU Battery Regulation 2023/1542 and India BIS/CPCB rules. Get a score from 0-100 with specific gaps flagged.",
  },
  {
    title: "Generate Passports",
    body: "Every battery unit gets a unique QR code. The passport includes: chemistry, carbon class, recycling info, due diligence status, and supply chain provenance.",
  },
  {
    title: "Print & Ship",
    body: "Generate industrial PDF labels with QR codes. Blockchain-anchor the certificate for immutable proof. Your buyer scans and verifies in 10 seconds.",
  },
];

const certItems = [
  { name: "BIS Certificate", validity: "24 months", alert: "90 days before expiry" },
  { name: "UN38.3 Test Report", validity: "24 months", alert: "90 days before expiry" },
  { name: "IEC 62133 Report", validity: "36 months", alert: "90 days before expiry" },
  { name: "MSDS / SDS", validity: "36 months", alert: "90 days before expiry" },
];

export default function BatteryPage() {
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
              Battery Passport
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
              EU Battery Regulation compliance, built for Indian Li-ion manufacturers.
            </h1>
            <p className="mt-6 text-lg text-navy-400 leading-relaxed max-w-xl">
              From BIS certification to blockchain-anchored EU Battery Passports. One platform. Zero consultants.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/request-access"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors"
              >
                Request Access for Battery Passport
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

      {/* The Regulation */}
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
                EU Battery Regulation 2023/1542
              </h2>
              <div className="space-y-4 text-navy-600 text-sm leading-relaxed">
                <p>
                  Starting February 2027, every battery sold in the European Union must have a digital passport. 
                  This isn't a suggestion — it's law. And the requirements are extensive.
                </p>
                <p>
                  Indian manufacturers face a unique challenge: you need to comply with both Indian regulations (BIS, EPR, BWM) 
                  AND EU regulations (Battery Regulation, REACH, RoHS) — often with the same batch of batteries.
                </p>
                <p>
                  ExportReady handles both. One upload. Two compliant outputs.
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
                What's Required (and what we cover)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {complianceItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm text-navy-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dual Mode */}
      <section className="py-20 bg-navy-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-navy-900">India + EU Dual Mode</h2>
            <p className="mt-3 text-navy-500 max-w-lg mx-auto">
              The same batch generates both India BIS/EPR documentation and EU Battery Passport. 
              One upload. Two outputs. Zero duplication.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-xl border border-navy-200/60 bg-white p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">IN</span>
                </div>
                <h3 className="font-semibold text-navy-900">India Compliance</h3>
              </div>
              <ul className="space-y-2 text-sm text-navy-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> BIS IS 16046 certification tracking</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> CPCB EPR registration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> BWM Rules 2022 documentation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> PLI Phase II reporting</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> HSN code & customs Bill of Entry</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">EU</span>
                </div>
                <h3 className="font-semibold text-navy-900">EU Compliance</h3>
              </div>
              <ul className="space-y-2 text-sm text-navy-600">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Battery Passport (Art. 77)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Carbon footprint declaration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Recycled content reporting</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Due diligence policy</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> CE marking & Declaration of Conformity</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20">
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
            <h2 className="text-3xl font-bold text-navy-900">How Battery Passport Works</h2>
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

      {/* Certificate Management */}
      <section className="py-20 bg-navy-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold text-navy-900">Certificate Management</h2>
            <p className="mt-3 text-navy-500">Never let a certificate expire silently again.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {certItems.map((cert) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-navy-200/60 bg-white p-6"
              >
                <h3 className="text-sm font-semibold text-navy-900 mb-1">{cert.name}</h3>
                <p className="text-xs text-navy-500 mb-3">Valid for {cert.validity}</p>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  <Bell className="w-3 h-3" />
                  {cert.alert}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20">
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
          <Link href="/textile" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Explore Textile DPP →
          </Link>
        </div>
      </section>
    </main>
  );
}
