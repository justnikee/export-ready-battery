"use client"

import { Shield, Award, Globe, Lock } from "lucide-react"
import { motion } from "framer-motion"

export function TrustBar() {
    const items = [
        { icon: Shield, text: "BWM Rules 2022" },
        { icon: Award, text: "AIS-156 Ready" },
        { icon: Globe, text: "EU Battery Regulation" },
        { icon: Lock, text: "GDPR Compliant" }
    ]

    return (
        <section className="py-12 border-y border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
            <div className="container mx-auto px-4">
                <p className="text-center text-xs font-medium text-zinc-600 mb-8 uppercase tracking-widest">
                    Built for compliance with
                </p>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center items-center gap-6 md:gap-12"
                >
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                        >
                            <item.icon className="h-4 w-4 text-zinc-500" />
                            <span className="text-sm font-medium text-zinc-400">{item.text}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
