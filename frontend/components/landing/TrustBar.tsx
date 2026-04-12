"use client";

import { motion } from "framer-motion";
import { Shield, Award, CheckCircle } from "lucide-react";

const trustBadges = [
 {
 icon: Shield,
 label: "SOC 2 Type II",
 sublabel: "Certified",
 },
 {
 icon: Award,
 label: "ISO 27001",
 sublabel: "Compliant",
 },
 {
 icon: CheckCircle,
 label: "GDPR",
 sublabel: "Ready",
 },
];

const partnerLogos = [
 "Nexus Power",
 "EcoCell GmbH",
 "GreenTech",
 "BatteryCorp",
 "PowerFlow",
 "CellTech",
];

export function TrustBar() {
 return (
 <section className="py-8 bg-zinc-50 border-b border-zinc-200">
 <div className="mx-auto w-full max-w-6xl px-4">
 {/* Trust Badges Row */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-6"
 >
 {trustBadges.map((badge, i) => (
 <div key={i} className="flex items-center gap-2 text-zinc-600">
 <div className="h-8 w-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-[#1F7A5F]">
 <badge.icon className="h-4 w-4" />
 </div>
 <div className="text-left">
 <p className="text-xs text-zinc-700">
 {badge.label}
 </p>
 <p className="text-[10px] text-zinc-500">{badge.sublabel}</p>
 </div>
 </div>
 ))}
 </motion.div>

 {/* Partner Logos */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.5, delay: 0.2 }}
 className="text-center"
 >
 <p className="text-xs text-zinc-500 mb-4 uppercase tracking-wide">
 Trusted by leading battery manufacturers
 </p>
 <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
 {partnerLogos.map((logo, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.3, delay: 0.1 * i }}
 className="text-zinc-400 hover:text-zinc-600 transition-colors"
 >
 <span className="text-sm tracking-tight">
 {logo}
 </span>
 </motion.div>
 ))}
 </div>
 </motion.div>
 </div>
 </section>
 );
}
