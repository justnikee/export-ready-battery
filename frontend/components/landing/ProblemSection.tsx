"use client"

import { motion } from "framer-motion"

const bullets = [
    "EU Battery Passports require dynamic lifecycle data, not static PDFs",
    "India EPR audits are retroactive and evidence-driven",
    "Deleting or editing records is non-compliant by design"
]

export function ProblemSection() {
    return (
        <section className="relative bg-white py-20">
            <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
                <div className="max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-slate-900 leading-tight">
                            Battery compliance isn&apos;t paperwork.
                            <br />
                            <span className="text-rose-700">It&apos;s legal liability.</span>
                        </h2>

                        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-[60ch]">
                            A single missing field, invalid lifecycle event, or unverifiable QR scan can block exports,
                            fail EU audits, or invalidate PLI claims - even years later.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-10 border-l border-slate-200 pl-6 max-w-[52ch] space-y-4"
                    >
                        {bullets.map((bullet, i) => (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="text-sm text-slate-600"
                            >
                                {bullet}
                            </motion.p>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
