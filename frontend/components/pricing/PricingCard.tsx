"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { clsx } from "clsx"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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
        <Card className={clsx("shadow-sm hover:shadow-md transition-shadow relative bg-white", recommended ? "border-blue-200 shadow-lg md:-translate-y-4" : "border-slate-200")}>
            {recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1">Most Popular</Badge>
                </div>
            )}
            <CardHeader>
                <CardTitle className={clsx("text-xl", recommended ? "text-blue-700" : "text-slate-700")}>{planName}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-4xl font-bold text-slate-900">
                    ₹{displayPrice.toLocaleString('en-IN')} <span className="text-lg text-slate-500 font-normal">/mo</span>
                </div>
                {billingPeriod === "yearly" && price > 0 && (
                    <p className="text-xs text-emerald-600 font-medium -mt-4">
                        Billed ₹{(displayPrice * 12).toLocaleString('en-IN')} yearly (Save 20%)
                    </p>
                )}
                <div className="space-y-3">
                    {features.map((feature, i) => (
                        <FeatureItem key={i} {...feature} />
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild className={clsx("w-full", recommended && "bg-blue-600 hover:bg-blue-700 text-white h-11")} variant={ctaVariant}>
                    <Link href={ctaLink}>{ctaText}</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

function FeatureItem({ text, available = true, highlight = false }: { text: string, available?: boolean, highlight?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            {available ? (
                <Check className={clsx("h-5 w-5 shrink-0", highlight ? "text-blue-600" : "text-emerald-500")} />
            ) : (
                <X className="h-5 w-5 shrink-0 text-slate-300" />
            )}
            <span className={clsx("text-sm", available ? "text-slate-700 font-medium" : "text-slate-400 line-through")}>
                {text}
            </span>
        </div>
    )
}
