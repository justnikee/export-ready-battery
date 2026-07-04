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
 <Card className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 ${isPopular ? 'bg-emerald-500/5 ring-2 ring-emerald-400/40' : ''}`}>
 {isPopular && (
 <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-500 text-xs px-3 py-1 rounded-bl-xl border-l border-b border-emerald-200">
 MOST POPULAR
 </div>
 )}

 <CardHeader className="p-8 pb-4 relative z-10">
 <div className="space-y-2">
 <h3 className={`text-lg font-medium ${isEnterprise ? 'text-muted-foreground' : isPopular ? 'text-emerald-500' : 'text-muted-foreground'}`}>
 {title}
 </h3>
 <div className="flex items-baseline gap-1">
 <span className="text-4xl text-foreground">{price}</span>
 {!isEnterprise && <span className="text-lg text-muted-foreground font-normal">/ license</span>}
 </div>
 {!isEnterprise && (
 <div className="inline-flex items-center gap-2 px-2 py-1 bg-background border border-border mt-2">
 <Zap className="h-3 w-3 text-amber-500" />
 <span className="text-xs text-muted-foreground">
 <span className="text-foreground font-medium">{batchCount} batches</span> @ {pricePerBatch}/batch
 </span>
 </div>
 )}
 {isEnterprise && (
 <div className="inline-flex items-center gap-2 px-2 py-1 bg-background border border-border mt-2">
 <Zap className="h-3 w-3 text-emerald-500" />
 <span className="text-xs text-muted-foreground">
 <span className="text-foreground font-medium">200+ batches</span> @ Custom rates
 </span>
 </div>
 )}
 </div>
 <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
 {description}
 </p>
 </CardHeader>

 <CardContent className="p-8 pt-4 flex-1 flex flex-col relative z-10">
 <div className="space-y-4 flex-1">
 {features.map((feature, i) => (
 <div key={i} className="flex items-start gap-3">
 <div className={`mt-1 p-0.5 rounded-full ${isPopular ? 'bg-emerald-100 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
 <Check className="h-3 w-3" />
 </div>
 <span className="text-sm text-muted-foreground">{feature}</span>
 </div>
 ))}
 </div>

 <div className="mt-8 pt-6 border-t border-border">
 <Button
 onClick={onAction}
 disabled={loading}
 className={`w-full py-6 font-medium text-base ${isEnterprise
 ? 'bg-transparent text-foreground hover:bg-background border border-border'
 : isPopular
 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-none shadow-emerald-100'
 : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
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
