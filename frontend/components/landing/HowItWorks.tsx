"use client"

import { motion } from "framer-motion"
import { Upload, FileCheck, Printer, ArrowRight } from "lucide-react"

const steps = [
    {
        icon: Upload,
        title: "Upload Batch",
        description: "Drag & drop your production CSV file directly into the dashboard.",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30"
    },
    {
        icon: FileCheck,
        title: "Validate Data",
        description: "Our engine checks for missing PLI metrics, Carbon limits, and required fields.",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30"
    },
    {
        icon: Printer,
        title: "Print Labels",
        description: "Download sticker-ready PDF sheets (3x7) or separate QR codes instantly.",
        color: "text-teal-400",
        bgColor: "bg-teal-500/10",
        borderColor: "border-teal-500/30"
    }
]

export function HowItWorks() {
    return (
        <section className="py-24 bg-slate-900/50 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Compliance in 3 Simple Steps
                    </h2>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        From spreadsheet to sticker in less than 2 minutes.
                    </p>
                </motion.div>

                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        {/* Connector Line */}
                        {/* <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" /> */}

                        <div className="grid md:grid-cols-3 gap-8">
                            {steps.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15 }}
                                    className="text-center relative"
                                >
                                    {/* Step number badge */}
                                    {/* <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-400 text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center border border-zinc-700 z-10">
                                        {i + 1}
                                    </div> */}

                                    {/* Icon container */}
                                    <div className={`h-20 w-20 mx-auto ${step.bgColor} border ${step.borderColor} rounded-2xl flex items-center justify-center mb-6 relative`}>
                                        <step.icon className={`h-8 w-8 ${step.color}`} />
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>

                                    {/* Arrow between steps */}
                                    {/* {i < steps.length - 1 && (
                                        <div className="hidden md:flex absolute top-24 -right-4 transform translate-x-1/2">
                                            <ArrowRight className="h-4 w-4 text-zinc-600" />
                                        </div>
                                    )} */}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
