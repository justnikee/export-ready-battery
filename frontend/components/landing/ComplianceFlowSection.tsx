"use client";

import { motion } from "framer-motion";
import { Upload, Cog, Download, ArrowRight, Check } from "lucide-react";

const steps = [
 {
 icon: Upload,
 step: "01",
 title: "Ingest Batteries",
 description:
 "Upload via CSV or integrate through our API. Each battery enters the lifecycle automatically with full traceability.",
 features: ["CSV Bulk Upload", "REST API", "ERP Integrations"],
 },
 {
 icon: Cog,
 step: "02",
 title: "Track & Enforce",
 description:
 "System enforces valid state transitions. Every event is logged with timestamp, actor, and tamper-proof hash.",
 features: [
 "7 Lifecycle States",
 "Immutable Audit Log",
 "QR Code Generation",
 ],
 },
 {
 icon: Download,
 step: "03",
 title: "Export & Prove",
 description:
 "Generate QR codes, PDFs, or API responses ready for EU Battery Regulation or India EPR auditors.",
 features: ["Passport PDFs", "QR Code Sheets", "API Endpoints"],
 },
];

export function ComplianceFlowSection() {
 return (
 <section className="py-24 bg-zinc-50 border-y border-zinc-200 overflow-hidden relative">
 {/* Background decoration */}
 <div className="absolute inset-0 opacity-30">
 <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent" />
 <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent" />
 </div>

 <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="mb-16 text-center"
 >
 <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F7A5F]/10 border border-[#1F7A5F]/20 rounded-full mb-6">
 <span className="text-xs font-medium text-[#1F7A5F]">
 How It Works
 </span>
 </span>
 <h2 className="text-3xl md:text-4xl font-heading text-[#0B1F3B] mb-4">
 Three steps to audit-ready.
 </h2>
 <p className="text-base text-zinc-600 max-w-[50ch] mx-auto">
 From battery intake to regulator-ready passport in minutes.
 </p>
 </motion.div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
 {/* Connection Lines - Desktop Only */}
 <div className="hidden md:block absolute top-20 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-[#0B1F3B]/20 via-[#1F7A5F]/30 to-[#0B1F3B]/20" />

 {steps.map((step, i) => {
 const Icon = step.icon;
 return (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.15 }}
 className="relative group"
 >
 <div className="bg-white rounded-2xl border border-zinc-200 p-8 h-full transition-all duration-300 hover:border-[#1F7A5F]/30 hover:shadow-none hover:shadow-zinc-200/50 hover:-translate-y-1 relative z-10">
 {/* Step Number Badge */}
 <div className="absolute top-4 left-6 px-3 py-1 bg-[#0B1F3B] text-white text-xs font-mono rounded-full shadow-none shadow-[#0B1F3B]/20">
 Step {step.step}
 </div>

 <div className="flex items-center justify-between mb-6 mt-2">
 <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1F3B] to-[#1a3a5c] text-white shadow-none shadow-[#0B1F3B]/20 transition-transform duration-300 group-hover:scale-110">
 <Icon className="h-6 w-6" />
 </div>
 {i < steps.length - 1 && (
 <ArrowRight className="hidden md:block h-5 w-5 text-[#1F7A5F]/50" />
 )}
 </div>

 <h3 className="text-lg text-[#0B1F3B] mb-3">
 {step.title}
 </h3>
 <p className="text-zinc-600 leading-relaxed mb-5 text-sm">
 {step.description}
 </p>

 {/* Features List */}
 <div className="space-y-2">
 {step.features.map((feature, fi) => (
 <div
 key={fi}
 className="flex items-center gap-2 text-xs text-zinc-500"
 >
 <Check className="h-3.5 w-3.5 text-[#1F7A5F]" />
 <span>{feature}</span>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>
 );
}
