"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { PublicHeader } from "@/components/layout/public-header"
import { PricingCard } from "@/components/pricing/PricingCard"
import { clsx } from "clsx"

export default function PricingPage() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicHeader />

            <div className="py-24 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-16 space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                            Compliance that costs less than <span className="text-blue-600">₹1 per battery</span>.
                        </h1>
                        <p className="text-lg text-slate-600">Choose the right plan for your production volume.</p>

                        {/* Toggle */}
                        <div className="flex justify-center items-center mt-8">
                            <div className="relative bg-slate-200 p-1 rounded-full flex items-center cursor-pointer" onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}>
                                <motion.div
                                    className="absolute left-1 top-1 bottom-1 w-[100px] bg-white rounded-full shadow-sm"
                                    animate={{ x: billing === "monthly" ? 0 : 96 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                                <button className={clsx("relative z-10 w-[100px] py-2 text-sm font-semibold transition-colors", billing === "monthly" ? "text-slate-900" : "text-slate-500")}>
                                    Monthly
                                </button>
                                <button className={clsx("relative z-10 w-[100px] py-2 text-sm font-semibold transition-colors", billing === "yearly" ? "text-slate-900" : "text-slate-500")}>
                                    Yearly
                                </button>
                            </div>
                            {billing === "yearly" && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="ml-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200"
                                >
                                    Save 20%
                                </motion.span>
                            )}
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8">

                        {/* Starter */}
                        <PricingCard
                            planName="Starter"
                            description="For Pilot Testing and small batches."
                            price={0}
                            billingPeriod={billing}
                            ctaText="Start for Free"
                            ctaLink="/onboarding"
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
                            ctaLink="/onboarding?plan=growth"
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

                    <div className="mt-16 text-center">
                        <p className="text-slate-500">Need a custom enterprise plan? <Link href="/contact" className="text-blue-600 font-semibold hover:underline">Contact us</Link> for volume discounts.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
