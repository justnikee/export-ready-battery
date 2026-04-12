"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, Download, ArrowRight, CheckCircle2 } from "lucide-react";

const steps = [
 {
 number: "01",
 icon: Upload,
 title: "Upload Your Batch",
 description:
 "Drag & drop your production CSV or connect via API. Supports any format — we map the fields automatically.",
 details: ["CSV, Excel, JSON", "API integration", "Auto field mapping"],
 color: "from-blue-500 to-cyan-500",
 },
 {
 number: "02",
 icon: Cpu,
 title: "Auto Validation",
 description:
 "Our compliance engine validates PLI metrics, carbon limits, and all mandatory fields in real-time.",
 details: ["PLI eligibility check", "Carbon compliance", "Data integrity"],
 color: "from-emerald-500 to-teal-500",
 },
 {
 number: "03",
 icon: Download,
 title: "Export & Print",
 description:
 "Download print-ready sticker sheets (3×7 A4) or individual QR codes. Labels ready in seconds.",
 details: ["PDF sticker sheets", "Individual QRs", "Label roll format"],
 color: "from-purple-500 to-pink-500",
 },
];

export function HowItWorks() {
 return (
 <section className="py-24 bg-zinc-900 relative overflow-hidden">
 {/* Background */}
 <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-teal-500/5 rounded-full blur-3xl" />

 <div className="container mx-auto px-4 relative">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="text-center mb-16"
 >
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-xs font-medium text-zinc-400 mb-6">
 <span>⚡</span>
 Under 2 minutes, start to finish
 </div>
 <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4">
 How It Works
 </h2>
 <p className="text-zinc-500 max-w-xl mx-auto text-lg">
 From spreadsheet to compliance-ready stickers in three simple steps.
 </p>
 </motion.div>

 {/* Steps Grid */}
 <div className="max-w-5xl mx-auto">
 <div className="grid md:grid-cols-3 gap-6 relative">
 {steps.map((step, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.15 }}
 className="relative"
 >
 {/* Step card */}
 <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-6 h-full hover:border-zinc-600/50 transition-colors">
 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <div
 className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-none`}
 >
 <step.icon className="h-6 w-6 text-white" />
 </div>
 <span className="text-3xl text-zinc-700">
 {step.number}
 </span>
 </div>

 {/* Content */}
 <h3 className="text-xl text-white mb-3">
 {step.title}
 </h3>
 <p className="text-zinc-400 text-sm leading-relaxed mb-4">
 {step.description}
 </p>

 {/* Details */}
 <div className="space-y-2">
 {step.details.map((detail, j) => (
 <div
 key={j}
 className="flex items-center gap-2 text-xs text-zinc-500"
 >
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />
 {detail}
 </div>
 ))}
 </div>
 </div>

 {/* Arrow connector (mobile) */}
 {i < steps.length - 1 && (
 <div className="md:hidden flex justify-center py-4">
 <ArrowRight className="h-5 w-5 text-zinc-600 rotate-90" />
 </div>
 )}
 </motion.div>
 ))}
 </div>
 </div>
 </div>
 </section>
 );
}
