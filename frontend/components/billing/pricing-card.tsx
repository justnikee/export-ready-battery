"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, Zap, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PricingFeature {
    text: string
}

interface PricingCardProps {
    title: string
    price: string
    batchCount: number
    pricePerBatch: string
    features: string[]
    description: string
    isPopular?: boolean
    isEnterprise?: boolean
    onAction: () => void
    loading?: boolean
    actionLabel: string
}

export function PricingCard({
    title,
    price,
    batchCount,
    pricePerBatch,
    features,
    description,
    isPopular = false,
    isEnterprise = false,
    onAction,
    loading = false,
    actionLabel
}: PricingCardProps) {
    return (
        <Card className={`relative flex flex-col h-full border-slate-800 bg-[#0F172A] overflow-hidden transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:shadow-slate-900/20 ${isPopular ? 'border-primary/50' : ''}`}>
            {isPopular && (
                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-primary/20">
                    MOST POPULAR
                </div>
            )}

            {/* Ambient Backlight */}
            <div className={`absolute top-0 inset-x-0 h-40 bg-linear-to-b ${isEnterprise ? 'from-teal-900/20' : isPopular ? 'from-emerald-900/20' : 'from-slate-900/20'} to-transparent pointer-events-none`} />

            <CardHeader className="p-8 pb-4 relative z-10">
                <div className="space-y-2">
                    <h3 className={`text-lg font-medium ${isEnterprise ? 'text-teal-400' : isPopular ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-100">{price}</span>
                        {!isEnterprise && <span className="text-lg text-slate-500 font-normal">/ license</span>}
                    </div>
                    {!isEnterprise && (
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 mt-2">
                            <Zap className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-slate-400">
                                <span className="text-slate-100 font-medium">{batchCount} batches</span> @ {pricePerBatch}/batch
                            </span>
                        </div>
                    )}
                    {isEnterprise && (
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 mt-2">
                            <Zap className="h-3 w-3 text-teal-500" />
                            <span className="text-xs text-slate-400">
                                <span className="text-slate-100 font-medium">200+ batches</span> @ Custom rates
                            </span>
                        </div>
                    )}
                </div>
                <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                    {description}
                </p>
            </CardHeader>

            <CardContent className="p-8 pt-4 flex-1 flex flex-col relative z-10">
                <div className="space-y-4 flex-1">
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`mt-1 p-0.5 rounded-full ${isPopular ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                                <Check className="h-3 w-3" />
                            </div>
                            <span className="text-sm text-slate-400">{feature}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-900">
                    <Button
                        onClick={onAction}
                        disabled={loading}
                        className={`w-full py-6 font-medium text-base ${isEnterprise
                            ? 'bg-slate-900 text-slate-100 hover:bg-slate-800 border border-slate-800'
                            : isPopular
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'
                                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            actionLabel
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
