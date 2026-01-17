"use client"

import { useState, useEffect } from "react"
import { Calculator, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface DVACalculatorProps {
    onApply: (value: number) => void
    trigger?: React.ReactNode
}

export function DVACalculator({ onApply, trigger }: DVACalculatorProps) {
    const [open, setOpen] = useState(false)
    const [salePrice, setSalePrice] = useState<string>("")
    const [importedCost, setImportedCost] = useState<string>("")
    const [dva, setDva] = useState<number>(0)

    useEffect(() => {
        const price = parseFloat(salePrice) || 0
        const cost = parseFloat(importedCost) || 0

        if (price > 0) {
            // Formula: ((Sale Price - Imported Cost) / Sale Price) * 100
            let calculated = ((price - cost) / price) * 100
            if (calculated < 0) calculated = 0
            if (calculated > 100) calculated = 100
            setDva(calculated)
        } else {
            setDva(0)
        }
    }, [salePrice, importedCost])

    const handleApply = () => {
        onApply(parseFloat(dva.toFixed(2)))
        setOpen(false)
    }

    const isEligible = dva >= 50

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <button type="button" className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <Calculator className="h-4 w-4" />
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Calculator className="h-5 w-5 text-purple-500" />
                        PLI DVA Calculator
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Calculate Domestic Value Addition per MHI formulas for PLI compliance.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Input Fields */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Ex-Factory Sale Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="e.g 15000"
                            />
                            <p className="text-[10px] text-zinc-500">Net selling price of battery excluding GST.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Cost of Imported Materials (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={importedCost}
                                onChange={(e) => setImportedCost(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="e.g 6000"
                            />
                            <p className="text-[10px] text-zinc-500">CIF value of all imported cells, electronics, and potential raw materials.</p>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className={`rounded-xl border p-4 ${isEligible
                        ? "bg-emerald-950/20 border-emerald-900/50"
                        : "bg-red-950/20 border-red-900/50"
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-400 text-sm font-medium">Calculated DVA</span>
                            {isEligible ? (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-900">
                                    <CheckCircle2 className="h-3 w-3" />
                                    PLI Eligible
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-950/50 px-2 py-0.5 rounded-full border border-red-900">
                                    <XCircle className="h-3 w-3" />
                                    Low Value Add
                                </span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-bold tracking-tight ${isEligible ? "text-emerald-400" : "text-red-400"
                                }`}>
                                {dva.toFixed(1)}%
                            </span>
                            <span className="text-zinc-500 text-sm">value addition</span>
                        </div>
                        <div className="mt-3 h-2 w-full bg-black/40 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ease-out ${isEligible ? "bg-emerald-500" : "bg-red-500"}`}
                                style={{ width: `${dva}%` }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleApply}
                        disabled={parseFloat(salePrice) <= 0}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white text-black px-4 py-2.5 text-sm font-medium hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                        Apply to Batch
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
