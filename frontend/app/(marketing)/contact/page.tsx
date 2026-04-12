"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Headphones, BadgeDollarSign } from "lucide-react"

export default function ContactPage() {
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
 Contact ExportReady
 </h1>
 <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
 Reach out for product questions, compliance support, or sales. We respond within 1 business day.
 </p>
 </motion.div>

 {/* Contact Cards */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16"
 >
 <div className="p-8 rounded-xl border border-zinc-200 bg-zinc-50">
 <div className="w-10 h-10 rounded-lg bg-[#0B1F3B]/10 flex items-center justify-center mb-4">
 <Headphones className="h-5 w-5 text-[#0B1F3B]" />
 </div>
 <h2 className="text-xl text-[#0B1F3B] mb-2">Support</h2>
 <p className="text-sm text-zinc-600">
 For technical help or account issues, email us at{" "}
 <a className="text-[#1F7A5F] font-medium hover:underline" href="mailto:support@exportready.com">
 support@exportready.com
 </a>
 .
 </p>
 </div>
 <div className="p-8 rounded-xl border border-zinc-200 bg-zinc-50">
 <div className="w-10 h-10 rounded-lg bg-[#1F7A5F]/10 flex items-center justify-center mb-4">
 <BadgeDollarSign className="h-5 w-5 text-[#1F7A5F]" />
 </div>
 <h2 className="text-xl text-[#0B1F3B] mb-2">Sales</h2>
 <p className="text-sm text-zinc-600">
 Want a demo or a custom plan? Email{" "}
 <a className="text-[#1F7A5F] font-medium hover:underline" href="mailto:sales@exportready.com">
 sales@exportready.com
 </a>
 .
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
 <a
 href="mailto:sales@exportready.com"
 className="inline-flex items-center justify-center bg-[#0B1F3B] px-10 py-4 text-sm text-white transition-all duration-200 hover:bg-[#1F7A5F]"
 >
 Book a Demo
 </a>
 <Link
 href="/docs"
 className="inline-flex items-center justify-center px-10 py-4 text-sm text-[#0B1F3B] border border-[#0B1F3B] transition-all duration-200 hover:bg-[#0B1F3B] hover:text-white"
 >
 Documentation
 </Link>
 </motion.div>
 </div>
 </section>
 )
}
