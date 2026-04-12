"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Target, Cpu } from "lucide-react"

export default function AboutPage() {
 return (
 <section className="pt-32 pb-24 px-4 bg-white">
 <div className="mx-auto w-full max-w-6xl">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-center mb-16 space-y-6"
 >
 <h1 className="text-4xl md:text-5xl font-heading text-[#0B1F3B]">
 About ExportReady
 </h1>
 <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
 ExportReady helps battery manufacturers meet India and EU compliance with audit-grade data,
 automated passports, and reliable traceability from cell to pack.
 </p>
 </motion.div>

 {/* Cards */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="grid md:grid-cols-2 gap-6 mb-16"
 >
 <div className="p-8 rounded-xl border border-zinc-200 bg-zinc-50">
 <div className="w-10 h-10 rounded-lg bg-[#1F7A5F]/10 flex items-center justify-center mb-4">
 <Target className="h-5 w-5 text-[#1F7A5F]" />
 </div>
 <h2 className="text-xl text-[#0B1F3B] mb-2">Our Mission</h2>
 <p className="text-sm text-zinc-600">
 Make battery compliance simple, transparent, and enforcement-ready for every manufacturer.
 </p>
 </div>
 <div className="p-8 rounded-xl border border-zinc-200 bg-zinc-50">
 <div className="w-10 h-10 rounded-lg bg-[#0B1F3B]/10 flex items-center justify-center mb-4">
 <Cpu className="h-5 w-5 text-[#0B1F3B]" />
 </div>
 <h2 className="text-xl text-[#0B1F3B] mb-2">What We Build</h2>
 <p className="text-sm text-zinc-600">
 A production-grade compliance platform with lifecycle tracking, immutable records, and
 export-ready documentation.
 </p>
 </div>
 </motion.div>

 {/* CTA Buttons */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="flex flex-wrap justify-center gap-4"
 >
 <Link
 href="/contact"
 className="inline-flex items-center justify-center bg-[#0B1F3B] px-10 py-4 text-sm text-white transition-all duration-200 hover:bg-[#1F7A5F]"
 >
 Contact Us
 </Link>
 <Link
 href="/docs"
 className="inline-flex items-center justify-center px-10 py-4 text-sm text-[#0B1F3B] border border-[#0B1F3B] transition-all duration-200 hover:bg-[#0B1F3B] hover:text-white"
 >
 Read the Docs
 </Link>
 </motion.div>
 </div>
 </section>
 )
}
