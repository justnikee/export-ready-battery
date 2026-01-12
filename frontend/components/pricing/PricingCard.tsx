"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { clsx } from "clsx"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PricingCardProps {
    planName: string
    description: string
    price: number
    billingPeriod: "monthly" | "yearly"
    features: { text: string; available?: boolean; highlight?: boolean }[]
    recommended?: boolean
    ctaText: string
    ctaLink: string
    ctaVariant?: "default" | "outline"
}

export function PricingCard({
    planName,
    description,
    price,
    billingPeriod,
    features,
    recommended,
    ctaText,
    ctaLink,
    ctaVariant = "outline"
}: PricingCardProps) {

    // Calculate displayed price (20% off for yearly)
    const displayPrice = billingPeriod === "yearly" && price > 0
        ? Math.floor(price * 0.8)
        : price

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={clsx(
                "relative rounded-2xl border p-1 transition-all duration-300",
                recommended
                    ? "bg-gradient-to-b from-purple-500/20 to-transparent border-purple-500/30 md:-translate-y-4"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
            )}
        >
            {recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 shadow-lg shadow-purple-500/25">
                        Most Popular
                    </Badge>
                </div>
            )}

            <div className="bg-zinc-900 rounded-xl p-6 h-full">
                <div className="mb-6">
                    <h3 className={clsx(
                        "text-xl font-semibold mb-1",
                        recommended ? "text-purple-400" : "text-white"
                    )}>
                        {planName}
                    </h3>
                    <p className="text-sm text-zinc-500">{description}</p>
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">
                            {price === 0 ? "Free" : `₹${displayPrice.toLocaleString('en-IN')}`}
                        </span>
                        {price > 0 && <span className="text-zinc-500">/mo</span>}
                    </div>
                    {billingPeriod === "yearly" && price > 0 && (
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                            Billed ₹{(displayPrice * 12).toLocaleString('en-IN')} yearly (Save 20%)
                        </p>
                    )}
                </div>

                <div className="space-y-3 mb-8">
                    {features.map((feature, i) => (
                        <FeatureItem key={i} {...feature} />
                    ))}
                </div>

                <Button
                    asChild
                    className={clsx(
                        "w-full h-11 font-semibold rounded-lg",
                        recommended
                            ? "bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                            : ctaVariant === "default"
                                ? "bg-white hover:bg-zinc-200 text-black"
                                : "bg-transparent border border-zinc-700 text-white hover:bg-zinc-800"
                    )}
                    variant={recommended ? "default" : ctaVariant}
                >
                    <Link href={ctaLink}>{ctaText}</Link>
                </Button>
            </div>
        </motion.div>
    )
}

function FeatureItem({ text, available = true, highlight = false }: { text: string, available?: boolean, highlight?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            {available ? (
                <Check className={clsx("h-5 w-5 shrink-0 mt-0.5", highlight ? "text-purple-400" : "text-emerald-400")} />
            ) : (
                <X className="h-5 w-5 shrink-0 mt-0.5 text-zinc-600" />
            )}
            <span className={clsx("text-sm", available ? "text-zinc-300" : "text-zinc-600 line-through")}>
                {text}
            </span>
        </div>
    )
}
