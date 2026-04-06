"use client"

import Link from "next/link"
import { Check } from "lucide-react"
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
            {/* Recommended ring effect */}
            {recommended && (
                <div className="absolute -inset-[2px] bg-[#1F7A5F] rounded-xl" />
            )}

            <div className={clsx(
                "relative h-full rounded-xl transition-all duration-300",
                recommended
                    ? "bg-white border-2 border-[#1F7A5F]"
                    : "bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg"
            )}>
                {/* Popular badge */}
                {recommended && (
                    <div className="absolute -top-3 left-6">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-[#1F7A5F] text-white">
                            Most Popular
                        </span>
                    </div>
                )}

                <div className="p-8 flex flex-col h-full">
                    {/* Plan header */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-[#0B1F3B] mb-2">
                            {planName}
                        </h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold tracking-tight text-[#0B1F3B]">
                                {typeof displayPrice === 'number'
                                    ? (displayPrice === 0 ? "Free" : `₹${displayPrice.toLocaleString('en-IN')}`)
                                    : displayPrice}
                            </span>
                        </div>
                        {priceSuffix && (
                            <p className="text-sm text-zinc-500 mt-1">
                                {priceSuffix}
                            </p>
                        )}
                        {billingPeriod === "yearly" && typeof price === 'number' && typeof displayPrice === 'number' && price > 0 && (
                            <p className="text-xs text-[#1F7A5F] font-medium mt-2">
                                Save 20% with yearly billing
                            </p>
                        )}
                    </div>

                    {/* CTA Button */}
                    <Link
                        href={ctaLink}
                        className={clsx(
                            "flex items-center justify-center w-full py-3 px-4 font-semibold text-sm transition-all duration-200 mb-8",
                            recommended
                                ? "bg-[#0B1F3B] text-white hover:bg-[#1F7A5F]"
                                : ctaVariant === "default"
                                    ? "bg-[#0B1F3B] text-white hover:bg-[#1F7A5F]"
                                    : "border border-[#0B1F3B] text-[#0B1F3B] hover:bg-[#0B1F3B] hover:text-white"
                        )}
                    >
                        {ctaText}
                    </Link>

                    {/* Divider */}
                    <div className="h-px bg-zinc-200 mb-8" />

                    {/* Features */}
                    <div className="space-y-4 grow">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                            What&apos;s included
                        </p>
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={clsx(
                                    "flex items-center justify-center w-5 h-5 rounded-full mt-0.5 shrink-0",
                                    feature.highlight
                                        ? "bg-[#1F7A5F]/20 text-[#1F7A5F]"
                                        : "bg-zinc-100 text-zinc-600"
                                )}>
                                    <Check className="h-3 w-3" />
                                </div>
                                <span className={clsx(
                                    "text-sm text-zinc-700",
                                    feature.highlight && "text-[#0B1F3B] font-medium"
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
