"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTAFooter() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-blue-950/20 to-[#0F172A]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-500/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8">
                        <Sparkles className="h-4 w-4 text-teal-400" />
                        <span className="text-sm font-medium text-teal-300">Free tier available</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to simplify battery compliance?
                    </h2>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Join leading assemblers and importers preparing for the 2026 mandates today.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="h-14 px-10 text-lg bg-white text-slate-900 hover:bg-slate-100 font-semibold rounded-xl"
                        >
                            <Link href="/register">
                                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-14 px-10 text-lg bg-transparent border-slate-700 text-white hover:bg-slate-900 rounded-xl"
                        >
                            <Link href="/pricing">View Pricing</Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Footer links */}
                <div className="mt-24 pt-8 border-t border-slate-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-600">
                            © 2026 ExportReady. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">Privacy</Link>
                            <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">Terms</Link>
                            <Link href="/docs" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">Documentation</Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
