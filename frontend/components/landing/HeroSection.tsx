"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white -z-10" />
            <div className="container mx-auto px-4 text-center">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="max-w-4xl mx-auto space-y-6"
                >
                    <Badge variant="outline" className="px-4 py-1.5 text-sm border-blue-200 bg-blue-50 text-blue-700 rounded-full mb-4">
                        🚀 Ready for 2026 Draft Rules
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        The Battery Passport Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">India's EV Revolution.</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Generate compliant <strong className="text-slate-900">BPAN QR Codes</strong> for the 2026 Draft Rules.
                        Ready for Importers, Assemblers, and EU Exporters.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button asChild size="lg" className="h-12 px-8 text-base bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                            <Link href="/onboarding">
                                Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base backdrop-blur-sm bg-white/50 border-slate-300 hover:bg-slate-50">
                            <Link href="#">Book a Demo</Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Visual Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotateX: 10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mt-16 mx-auto max-w-5xl relative z-10"
                    style={{ perspective: "1000px" }}
                >
                    <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden p-2 transform rotate-x-6 hover:rotate-x-0 transition-transform duration-700 ease-out">
                        <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100 aspect-[16/9] flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-slate-50/50" />
                            <div className="grid grid-cols-2 gap-8 p-12 w-full max-w-3xl">
                                {/* Fake Card 1 */}
                                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 space-y-4">
                                    <div className="h-8 w-24 bg-orange-100 rounded-md" />
                                    <div className="h-4 w-3/4 bg-slate-100 rounded" />
                                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                                    <div className="flex gap-2 pt-2">
                                        <div className="h-16 w-16 bg-slate-900 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-3 w-full bg-slate-100 rounded" />
                                            <div className="h-3 w-4/5 bg-slate-100 rounded" />
                                        </div>
                                    </div>
                                </div>
                                {/* Fake Card 2 */}
                                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 space-y-4 opacity-80 scale-95 translate-y-4">
                                    <div className="h-8 w-24 bg-blue-100 rounded-md" />
                                    <div className="h-4 w-3/4 bg-slate-100 rounded" />
                                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                                    <div className="flex gap-2 pt-2">
                                        <div className="h-16 w-16 bg-slate-900 rounded-lg" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-3 w-full bg-slate-100 rounded" />
                                            <div className="h-3 w-4/5 bg-slate-100 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur border border-emerald-100 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                <CheckCircle className="h-4 w-4 text-emerald-500" /> Verified PLI Eligible
                            </div>
                        </div>
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-3xl -z-10 rounded-[100%]" />
                </motion.div>
            </div>
        </section>
    )
}
