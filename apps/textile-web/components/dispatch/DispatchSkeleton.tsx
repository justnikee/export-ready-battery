"use client"

import { Card } from "@/components/ui/card"
import { Truck, Package, Scan } from "lucide-react"

export function DispatchSkeleton() {
 return (
 <div className="min-h-screen bg-background p-6 md:p-8">
 <div className="w-full mx-auto flex flex-col gap-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-none shadow-amber-500/20">
 <Truck className="h-5 w-5 text-white" />
 </div>
 <div className="h-9 w-48 bg-muted rounded-lg animate-pulse" />
 </div>
 <div className="h-5 w-80 bg-muted rounded ml-[52px] mt-2 animate-pulse" />
 </div>
 <div className="flex items-center gap-2">
 <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
 <div className="h-10 w-24 bg-muted rounded-lg border border-border animate-pulse" />
 </div>
 </div>

 {/* Main Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

 {/* Left Col: Scanning Area */}
 <div className="lg:col-span-2 flex flex-col gap-6">

 {/* Scanner Input Card */}
 <Card className="relative p-6 bg-card border-2 border-border shadow-none">
 {/* Targeting corners */}
 <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-amber-500/40" />
 <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-amber-500/40" />
 <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-amber-500/40" />
 <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-amber-500/40" />

 <div className="flex flex-col gap-3">
 <div className="flex items-center gap-2">
 <Scan className="h-4 w-4 text-amber-500" />
 <div className="h-4 w-28 bg-amber-100 rounded animate-pulse" />
 </div>
 <div className="h-20 bg-background border border-border rounded-md animate-pulse" />
 <div className="flex justify-between">
 <div className="h-4 w-32 bg-muted rounded animate-pulse" />
 <div className="h-4 w-40 bg-muted rounded animate-pulse" />
 </div>
 </div>
 </Card>

 {/* Pending List */}
 <div className="flex-1 flex flex-col bg-card rounded-xl border border-border p-5 min-h-[300px] shadow-none">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Package className="h-5 w-5 text-amber-500" />
 <div className="h-6 w-32 bg-muted rounded animate-pulse" />
 </div>
 <div className="h-7 w-20 bg-muted rounded-full animate-pulse" />
 </div>

 {/* Empty state skeleton */}
 <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-background/50">
 <div className="relative mb-4">
 <div className="h-16 w-16 bg-muted rounded-full animate-pulse" />
 </div>
 <div className="h-5 w-44 bg-muted rounded animate-pulse mb-2" />
 <div className="h-4 w-52 bg-muted rounded animate-pulse" />
 </div>
 </div>
 </div>

 {/* Right Col: Action Panel */}
 <div className="flex flex-col">
 <Card className="p-6 flex flex-col gap-6 h-full bg-card border-border shadow-none">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
 <Truck className="h-4 w-4 text-amber-500" />
 </div>
 <div className="h-7 w-36 bg-muted rounded animate-pulse" />
 </div>
 <div className="h-4 w-full bg-muted rounded animate-pulse" />
 </div>

 <div className="space-y-4 flex-1">
 {/* Carrier Input */}
 <div className="grid gap-2">
 <div className="h-5 w-24 bg-muted rounded animate-pulse" />
 <div className="h-10 bg-background border border-border rounded-md animate-pulse" />
 </div>
 {/* Tracking Input */}
 <div className="grid gap-2">
 <div className="h-5 w-36 bg-muted rounded animate-pulse" />
 <div className="h-10 bg-background border border-border rounded-md animate-pulse" />
 </div>
 </div>

 <div className="pt-6 border-t border-border">
 {/* Dispatch Button */}
 <div className="w-full h-16 bg-muted rounded-lg animate-pulse" />
 <div className="flex justify-center mt-4">
 <div className="h-4 w-56 bg-muted rounded animate-pulse" />
 </div>
 </div>
 </Card>
 </div>
 </div>
 </div>
 </div>
 )
}
