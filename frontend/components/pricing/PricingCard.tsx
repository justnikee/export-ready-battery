"use client"

import Link from "next/link"
import { Check, ArrowRight } from "lucide-react"
import { clsx } from "clsx"
import { motion } from "framer-motion"

interface PricingCardProps {
    planName: string
    description: string
    price: number | string
    billingPeriod?: "monthly" | "yearly"
    features: { text: string; available?: boolean; highlight?: boolean }[]
    recommended?: boolean
    ctaText: string
    ctaLink: string
    ctaVariant?: "default" | "outline"
    priceSuffix?: string
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
    ctaVariant = "outline",
    priceSuffix
}: PricingCardProps) {

    const displayPrice = billingPeriod === "yearly" && typeof price === 'number' && price > 0
        ? Math.floor(price * 0.8)
        : price

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="relative group"
        >
            {/* Recommended glow effect */}
            {recommended && (
                <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent rounded-2xl" />
            )}

            <div className={clsx(
                "relative h-full rounded-2xl transition-all duration-300",
                recommended
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
            )}>
                {/* Popular badge */}
                {recommended && (
                    <div className="absolute -top-3 left-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-white shadow-lg">
                            Most Popular
                        </span>
                    </div>
                )}

                <div className="p-8 flex flex-col h-full">
                    {/* Plan header */}
                    <div className="mb-8">
                        <h3 className={clsx(
                            "text-lg font-semibold mb-2",
                            recommended ? "text-zinc-900" : "text-white"
                        )}>
                            {planName}
                        </h3>
                        <p className={clsx(
                            "text-sm leading-relaxed",
                            recommended ? "text-zinc-600" : "text-zinc-400"
                        )}>
                            {description}
                        </p>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className={clsx(
                                "text-5xl font-bold tracking-tight",
                                recommended ? "text-zinc-900" : "text-white"
                            )}>
                                {typeof displayPrice === 'number'
                                    ? (displayPrice === 0 ? "Free" : `₹${displayPrice.toLocaleString('en-IN')}`)
                                    : displayPrice}
                            </span>
                        </div>
                        {priceSuffix && (
                            <p className={clsx(
                                "text-sm mt-1",
                                recommended ? "text-zinc-500" : "text-zinc-500"
                            )}>
                                {priceSuffix}
                            </p>
                        )}
                        {billingPeriod === "yearly" && typeof price === 'number' && typeof displayPrice === 'number' && price > 0 && (
                            <p className="text-xs text-emerald-500 font-medium mt-2">
                                Save 20% with yearly billing
                            </p>
                        )}
                    </div>

                    {/* CTA Button */}
                    <Link
                        href={ctaLink}
                        className={clsx(
                            "flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 mb-8",
                            recommended
                                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                                : ctaVariant === "default"
                                    ? "bg-white text-zinc-900 hover:bg-zinc-100"
                                    : "border border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600"
                        )}
                    >
                        {ctaText}
                        <ArrowRight className="h-4 w-4" />
                    </Link>

                    {/* Divider */}
                    <div className={clsx(
                        "h-px mb-8",
                        recommended ? "bg-zinc-200" : "bg-zinc-800"
                    )} />

                    {/* Features */}
                    <div className="space-y-4 flex-grow">
                        <p className={clsx(
                            "text-xs font-medium uppercase tracking-wider",
                            recommended ? "text-zinc-500" : "text-zinc-500"
                        )}>
                            What&apos;s included
                        </p>
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={clsx(
                                    "flex items-center justify-center w-5 h-5 rounded-full mt-0.5 shrink-0",
                                    recommended
                                        ? "bg-zinc-900 text-white"
                                        : feature.highlight
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-zinc-800 text-zinc-400"
                                )}>
                                    <Check className="h-3 w-3" />
                                </div>
                                <span className={clsx(
                                    "text-sm",
                                    recommended ? "text-zinc-700" : "text-zinc-300",
                                    feature.highlight && !recommended && "text-white font-medium"
                                )}>
                                    {feature.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
