"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { PublicHeader } from "@/components/layout/public-header"
import { PricingCard } from "@/components/pricing/PricingCard"
import { clsx } from "clsx"
import { Check, Sparkles } from "lucide-react"

export default function PricingPage() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")

    return (
        <div className="min-h-screen bg-black">
            <PublicHeader />

            <div className="pt-32 pb-24 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16 space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">Simple, transparent pricing</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white">
                            Compliance that costs less than{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                ₹1 per battery
                            </span>
                        </h1>
                        <p className="text-lg text-zinc-400">Choose the right plan for your production volume.</p>

                        {/* Toggle */}
                        <div className="flex justify-center items-center mt-8">
                            <div
                                className="relative bg-zinc-900 p-1 rounded-full flex items-center cursor-pointer border border-zinc-800"
                                onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
                            >
                                <motion.div
                                    className="absolute left-1 top-1 bottom-1 w-[100px] bg-zinc-800 rounded-full"
                                    animate={{ x: billing === "monthly" ? 0 : 100 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                                <button className={clsx(
                                    "relative z-10 w-[100px] py-2 text-sm font-semibold transition-colors",
                                    billing === "monthly" ? "text-white" : "text-zinc-500"
                                )}>
                                    Monthly
                                </button>
                                <button className={clsx(
                                    "relative z-10 w-[100px] py-2 text-sm font-semibold transition-colors",
                                    billing === "yearly" ? "text-white" : "text-zinc-500"
                                )}>
                                    Yearly
                                </button>
                            </div>
                            {billing === "yearly" && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="ml-4 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20"
                                >
                                    Save 20%
                                </motion.span>
                            )}
                        </div>
                    </motion.div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-16">

                        {/* Starter */}
                        <PricingCard
                            planName="Starter"
                            description="For Pilot Testing and small batches."
                            price={0}
                            billingPeriod={billing}
                            ctaText="Start for Free"
                            ctaLink="/register"
                            features={[
                                { text: "100 Passports / month" },
                                { text: "India Mode Only (BPAN)" },
                                { text: "Public Hosting (Standard Theme)" },
                                { text: "PDF Sticker Printing", available: false },
                                { text: "ExportReady Branding", available: false }
                            ]}
                        />

                        {/* Growth */}
                        <PricingCard
                            planName="Growth"
                            description="For Standard Production runs."
                            price={4999}
                            billingPeriod={billing}
                            recommended={true}
                            ctaText="Get Started"
                            ctaLink="/register?plan=growth"
                            ctaVariant="default"
                            features={[
                                { text: "5,000 Passports / month", highlight: true },
                                { text: "PDF Label Printing (A4 Sheets)", highlight: true },
                                { text: "Custom Company Logo" },
                                { text: "PLI Compliance Reports" },
                                { text: "Standard Email Support" }
                            ]}
                        />

                        {/* Exporter */}
                        <PricingCard
                            planName="Exporter"
                            description="For Global Brands & EU Exports."
                            price={14999}
                            billingPeriod={billing}
                            ctaText="Contact Sales"
                            ctaLink="/contact"
                            features={[
                                { text: "25,000 Passports / month" },
                                { text: "EU Mode Unlocked (Carbon/Materials)", highlight: true },
                                { text: "API Access" },
                                { text: "No 'ExportReady' Branding" },
                                { text: "Priority Support" }
                            ]}
                        />

                    </div>

                    {/* FAQ / Features comparison */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"
                    >
                        <h3 className="text-xl font-semibold text-white mb-6 text-center">All Plans Include</h3>
                        <div className="grid md:grid-cols-4 gap-6">
                            {[
                                "Unlimited Users",
                                "SSL Security",
                                "99.9% Uptime SLA",
                                "GDPR Compliant"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Check className="h-4 w-4 text-emerald-400" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="mt-12 text-center">
                        <p className="text-zinc-500">
                            Need a custom enterprise plan?{" "}
                            <Link href="/contact" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                                Contact us
                            </Link>
                            {" "}for volume discounts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
