"use client"

import { Shield, Award, Globe, Lock, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

const regulations = [
    {
        icon: Shield,
        title: "BWM Rules 2022",
        status: "Certified",
        color: "text-emerald-400"
    },
    {
        icon: Award,
        title: "AIS-156 Ready",
        status: "Compliant",
        color: "text-blue-400"
    },
    {
        icon: Globe,
        title: "EU Battery Regulation",
        status: "2027 Ready",
        color: "text-cyan-400"
    },
    {
        icon: Lock,
        title: "Data Security",
        status: "SOC 2",
        color: "text-purple-400"
    }
]

export function TrustBar() {
    return (
        <section className="py-16 border-y border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm relative overflow-hidden">
            {/* Subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-blue-500/5" />

            <div className="container mx-auto px-4 relative">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-xs font-semibold text-zinc-500 mb-10 uppercase tracking-[0.2em]"
                >
                    Trusted for regulatory compliance
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto"
                >
                    {regulations.map((item, i) => (
                        <div
                            key={i}
                            className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all duration-300"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg bg-zinc-800/50 ${item.color}`}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{item.title}</div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                        <span className="text-xs text-zinc-500">{item.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
