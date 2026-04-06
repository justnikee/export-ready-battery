"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, Zap, Loader2 } from "lucide-react"

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
        <Card className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-md ${isPopular ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-zinc-200'}`}>
            {isPopular && (
                <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-emerald-200">
                    MOST POPULAR
                </div>
            )}

            <CardHeader className="p-8 pb-4 relative z-10">
                <div className="space-y-2">
                    <h3 className={`text-lg font-medium ${isEnterprise ? 'text-zinc-500' : isPopular ? 'text-emerald-600' : 'text-zinc-500'}`}>
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-zinc-900">{price}</span>
                        {!isEnterprise && <span className="text-lg text-zinc-400 font-normal">/ license</span>}
                    </div>
                    {!isEnterprise && (
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-50 border border-zinc-200 mt-2">
                            <Zap className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-zinc-500">
                                <span className="text-zinc-900 font-medium">{batchCount} batches</span> @ {pricePerBatch}/batch
                            </span>
                        </div>
                    )}
                    {isEnterprise && (
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-50 border border-zinc-200 mt-2">
                            <Zap className="h-3 w-3 text-emerald-500" />
                            <span className="text-xs text-zinc-500">
                                <span className="text-zinc-900 font-medium">200+ batches</span> @ Custom rates
                            </span>
                        </div>
                    )}
                </div>
                <p className="text-sm text-zinc-500 mt-4 leading-relaxed">
                    {description}
                </p>
            </CardHeader>

            <CardContent className="p-8 pt-4 flex-1 flex flex-col relative z-10">
                <div className="space-y-4 flex-1">
                    {features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`mt-1 p-0.5 rounded-full ${isPopular ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                <Check className="h-3 w-3" />
                            </div>
                            <span className="text-sm text-zinc-600">{feature}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100">
                    <Button
                        onClick={onAction}
                        disabled={loading}
                        className={`w-full py-6 font-medium text-base ${isEnterprise
                            ? 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200'
                            : isPopular
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100'
                                : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
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
