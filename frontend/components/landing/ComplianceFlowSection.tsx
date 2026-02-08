"use client"

import { motion } from "framer-motion"

const steps = [
    {
        step: "01",
        title: "Declare",
        description: "Upload batch data. Define lifecycle. Lock the schema.",
        weight: "text-slate-400"
    },
    {
        step: "02",
        title: "Verify",
        description: "Every change is logged. Missing fields prevent generation.",
        weight: "text-slate-600"
    },
    {
        step: "03",
        title: "Enforce",
        description: "Passports cannot be edited or deleted. QR scans are public and permanent.",
        weight: "text-slate-900"
    }
]

export function ComplianceFlowSection() {
    return (
        <section className="py-24 bg-slate-50 border-y border-slate-200">
            <div className="mx-auto w-full max-w-6xl px-4">
                <div className="max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-10"
                    >
                        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-slate-900 mb-3">
                            Declare. Verify. Enforce.
                        </h2>
                        <p className="text-sm text-slate-600 max-w-[60ch]">
                            Every passport goes through the same flow. No shortcuts, no exceptions.
                        </p>
                    </motion.div>

                    <div className="relative">
                        <div className="hidden md:block absolute left-0 right-0 top-6 h-px bg-slate-200" />
                        <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-6">
                            {steps.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="flex-1 border-l border-slate-200 pl-6 md:border-l-0 md:pl-0"
                                >
                                    <div className="flex items-baseline gap-3">
                                        <span className={`text-4xl font-heading font-semibold ${step.weight}`}>
                                            {step.step}
                                        </span>
                                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                            {step.title}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-[42ch]">
                                        {step.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
