"use client"

import { motion } from "framer-motion"
import { Shield, Globe, Zap, QrCode, FileCheck, Printer } from "lucide-react"

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

const features = [
    {
        icon: Shield,
        title: "Battery Aadhaar (BPAN)",
        description: "Auto-generate 21-digit IDs instantly. Track Domestic Value Addition for PLI subsidies and local compliance.",
        gradient: "from-orange-500 to-amber-500",
        bgGlow: "bg-orange-500/10"
    },
    {
        icon: Globe,
        title: "Global Passport",
        description: "One switch unlocks EU compliance. Automatically track Carbon Footprint limits & Critical Material composition.",
        gradient: "from-blue-500 to-cyan-500",
        bgGlow: "bg-blue-500/10"
    },
    {
        icon: Zap,
        title: "Ops Automation",
        description: "Bulk CSV Upload & PDF Sticker Printing. Seamlessly integrates with your existing ERP & Manufacturing workflows.",
        gradient: "from-emerald-500 to-green-500",
        bgGlow: "bg-emerald-500/10"
    },
    {
        icon: QrCode,
        title: "Smart QR Codes",
        description: "Dynamic QR codes that link to live passport data. Track scans and access patterns in real-time.",
        gradient: "from-teal-500 to-cyan-500",
        bgGlow: "bg-teal-500/10"
    },
    {
        icon: FileCheck,
        title: "Compliance Reports",
        description: "Auto-generated PLI eligibility reports and EU carbon declaration documents ready for export.",
        gradient: "from-pink-500 to-rose-500",
        bgGlow: "bg-pink-500/10"
    },
    {
        icon: Printer,
        title: "Label Printing",
        description: "Print-ready sticker sheets in A4 or roll formats. Compatible with standard label printers.",
        gradient: "from-indigo-500 to-blue-500",
        bgGlow: "bg-indigo-500/10"
    }
]

export function FeatureGrid() {
    return (
        <section className="py-24 bg-[#0F172A] relative overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Everything you need for battery compliance
                    </h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        From India's BPAN requirements to EU export regulations, we've got you covered.
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            variants={fadeIn}
                            className="group relative"
                        >
                            <div className={`absolute inset-0 ${feature.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className="relative h-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 backdrop-blur-sm">
                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
