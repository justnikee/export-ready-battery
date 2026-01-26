"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-24 overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[#0F172A]" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-900/10 to-transparent rounded-full" />
            </div>

            <div className="container mx-auto px-4 text-center">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 backdrop-blur-sm"
                    >
                        <Sparkles className="h-4 w-4 text-teal-400" />
                        <span className="text-sm font-medium text-blue-300">Ready for 2026 Draft Rules</span>
                    </motion.div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        The Battery Passport Platform for{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-400 to-cyan-400">
                            India's EV Revolution.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Generate compliant <strong className="text-white">BPAN QR Codes</strong> for the 2026 Draft Rules.
                        Ready for Importers, Assemblers, and EU Exporters.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            asChild
                            size="lg"
                            className="h-14 px-8 text-base bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-lg shadow-white/10 rounded-xl"
                        >
                            <Link href="/register">
                                Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-14 px-8 text-base bg-transparent border-slate-700 text-white hover:bg-slate-900 hover:border-slate-600 rounded-xl"
                        >
                            <Link href="/pricing">View Pricing</Link>
                        </Button>
                    </div>

                    {/* Stats Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap justify-center gap-8 pt-12"
                    >
                        {[
                            { value: "50K+", label: "Passports Generated" },
                            { value: "100+", label: "Manufacturers" },
                            { value: "<2min", label: "Batch Processing" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-bold text-white">{stat.value}</div>
                                <div className="text-sm text-slate-500">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-20 mx-auto max-w-5xl relative"
                >
                    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 shadow-2xl overflow-hidden p-1.5 backdrop-blur-sm">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl blur-xl -z-10" />

                        <div className="bg-slate-900 rounded-xl overflow-hidden aspect-[16/9] relative">
                            {/* Fake Dashboard UI */}
                            <div className="absolute inset-0 p-6">
                                {/* Top bar */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-blue-500/20 rounded-lg" />
                                        <div className="h-4 w-24 bg-slate-800 rounded" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 w-20 bg-slate-800 rounded-lg" />
                                        <div className="h-8 w-8 bg-teal-500/30 rounded-lg" />
                                    </div>
                                </div>

                                {/* Stats cards */}
                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                                            <div className="h-3 w-16 bg-slate-700 rounded" />
                                            <div className="h-6 w-12 bg-slate-600 rounded" />
                                        </div>
                                    ))}
                                </div>

                                {/* Chart area */}
                                <div className="bg-slate-800/30 rounded-xl p-4 h-36">
                                    <div className="flex items-end gap-2 h-full">
                                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-gradient-to-t from-teal-500/60 to-teal-500/20 rounded-t-sm"
                                                style={{ height: `${h}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Floating badge */}
                            <div className="absolute bottom-6 right-6 bg-emerald-500/10 backdrop-blur border border-emerald-500/30 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold text-emerald-400">
                                <Zap className="h-4 w-4" /> Live Data
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
