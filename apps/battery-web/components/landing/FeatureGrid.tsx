"use client";

import { motion } from "framer-motion";
import {
 Shield,
 Globe,
 Zap,
 QrCode,
 FileCheck,
 BarChart3,
 ArrowRight,
} from "lucide-react";

const features = [
 {
 icon: Shield,
 title: "Battery Aadhaar (BPAN)",
 description:
 "Auto-generate 21-digit IDs instantly. Track Domestic Value Addition for PLI subsidies and local compliance.",
 highlight: "India 2026",
 iconBg: "bg-orange-500/10",
 iconColor: "text-orange-400",
 borderHover: "hover:border-orange-500/30",
 },
 {
 icon: Globe,
 title: "EU Battery Passport",
 description:
 "One toggle unlocks full EU compliance. Track Carbon Footprint limits & Critical Material composition automatically.",
 highlight: "2027 Ready",
 iconBg: "bg-blue-500/10",
 iconColor: "text-blue-400",
 borderHover: "hover:border-blue-500/30",
 },
 {
 icon: QrCode,
 title: "Dynamic QR Codes",
 description:
 "Smart QR codes that link to live passport data. Track every scan with location, timestamp, and device info.",
 highlight: "Real-time",
 iconBg: "bg-teal-500/10",
 iconColor: "text-teal-400",
 borderHover: "hover:border-teal-500/30",
 },
 {
 icon: Zap,
 title: "Bulk Operations",
 description:
 "CSV import for a production lot (up to the product cap of 10,000 units). Download print-ready sticker sheets.",
 highlight: "10K+ / 2min",
 iconBg: "bg-amber-500/10",
 iconColor: "text-amber-400",
 borderHover: "hover:border-amber-500/30",
 },
 {
 icon: FileCheck,
 title: "Compliance Reports",
 description:
 "Auto-generated PLI eligibility reports and EU carbon declarations. Export-ready documentation in one click.",
 highlight: "PDF Export",
 iconBg: "bg-emerald-500/10",
 iconColor: "text-emerald-400",
 borderHover: "hover:border-emerald-500/30",
 },
 {
 icon: BarChart3,
 title: "Analytics Dashboard",
 description:
 "Real-time visibility into passport creation, scan patterns, and compliance metrics across your entire operation.",
 highlight: "Live Stats",
 iconBg: "bg-purple-500/10",
 iconColor: "text-purple-400",
 borderHover: "hover:border-purple-500/30",
 },
];

export function FeatureGrid() {
 return (
 <section className="py-24 bg-zinc-950 relative overflow-hidden">
 {/* Background pattern */}
 <div
 className="absolute inset-0 opacity-[0.02]"
 style={{
 backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
 backgroundSize: "32px 32px",
 }}
 />

 {/* Gradient orbs */}
 <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
 <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />

 <div className="container mx-auto px-4 relative">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="text-center mb-16"
 >
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-xs font-medium text-zinc-400 mb-6">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
 Full-stack compliance platform
 </div>
 <h2 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4">
 Everything for Battery Compliance
 </h2>
 <p className="text-zinc-500 max-w-2xl mx-auto text-lg">
 From India&apos;s BPAN mandates to EU export regulations — one
 platform covers it all.
 </p>
 </motion.div>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
 {features.map((feature, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 className={`group relative bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 ${feature.borderHover} transition-colors duration-200 hover:bg-zinc-900/80`}
 >
 {/* Header */}
 <div className="flex items-start justify-between mb-4">
 <div className={`p-2.5 rounded-lg ${feature.iconBg}`}>
 <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
 </div>
 <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
 {feature.highlight}
 </span>
 </div>

 {/* Content */}
 <h3 className="text-lg text-white mb-2">
 {feature.title}
 </h3>
 <p className="text-zinc-400 text-sm leading-relaxed">
 {feature.description}
 </p>

 {/* Hover indicator */}
 <div className="mt-4 flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
 <span>Learn more</span>
 <ArrowRight className="h-3 w-3" />
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
}
