"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function BatchDetailSkeleton() {
 return (
 <div className="min-h-screen bg-background text-foreground p-8 font-sans">
 <div className="w-full mx-auto space-y-8">

 {/* Header Card */}
 <div className="relative overflow-visible border border-border bg-transparent p-6"><div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <Skeleton className="h-10 w-10 bg-muted/50" />
 <div>
 <div className="flex items-center gap-3">
 <Skeleton className="h-9 w-64 bg-muted" />
 <Skeleton className="h-7 w-20 bg-muted/50" />
 </div>
 <div className="flex items-center gap-2 mt-2">
 <Skeleton className="h-6 w-24 bg-muted/50" />
 <Skeleton className="h-4 w-36 bg-muted/30" />
 </div>
 </div>
 </div>
 <div className="flex gap-2">
 <Skeleton className="h-10 w-36 bg-emerald-500/20" />
 </div>
 </div>
 </div>

 <div className="grid gap-6 md:grid-cols-3">
 {/* Main Content - Col Span 2 */}
 <div className="md:col-span-2 space-y-6">

 {/* Core Specifications Card */}
 <Card className="bg-transparent border-border">
 <CardHeader>
 <div className="flex items-center gap-2">
 <Skeleton className="h-9 w-9 bg-blue-500/10" />
 <Skeleton className="h-6 w-40 bg-muted" />
 </div>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 gap-x-4 gap-y-6">
 {[1, 2, 3, 4, 5, 6].map((i) => (
 <div key={i} className="p-3 bg-background border border-border">
 <Skeleton className="h-3 w-20 bg-muted/50" />
 <Skeleton className="h-5 w-32 mt-2 bg-muted" />
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 {/* Compliance Card Skeleton */}
 <Card className="bg-transparent border-border border-l-4 border-l-orange-500">
 <CardHeader className="pb-4">
 <div className="flex items-center gap-3">
 <Skeleton className="h-8 w-8 rounded bg-muted/50" />
 <Skeleton className="h-6 w-36 bg-muted" />
 <Skeleton className="h-5 w-24 rounded bg-orange-500/10" />
 </div>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 gap-4">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="p-4 bg-background border border-border">
 <Skeleton className="h-3 w-28 bg-muted/50" />
 <Skeleton className="h-7 w-20 mt-2 bg-muted" />
 </div>
 ))}
 <div className="col-span-2 p-4 bg-background border border-border">
 <Skeleton className="h-3 w-32 bg-muted/50" />
 <Skeleton className="h-8 w-64 mt-2 bg-orange-500/10" />
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Upload Section Card */}
 <Card className="bg-transparent border-border">
 <CardHeader>
 <div className="flex items-center gap-2">
 <Skeleton className="h-9 w-9 bg-teal-50" />
 <Skeleton className="h-6 w-28 bg-muted" />
 </div>
 <Skeleton className="h-4 w-80 mt-2 bg-muted/50" />
 </CardHeader>
 <CardContent>
 <div className="border-2 border-dashed border-border p-8 flex flex-col items-center justify-center">
 <Skeleton className="h-12 w-12 bg-muted/50" />
 <Skeleton className="h-5 w-48 mt-4 bg-muted" />
 <Skeleton className="h-4 w-64 mt-2 bg-muted/50" />
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Actions Card */}
 <Card className="bg-transparent border-border">
 <CardHeader>
 <Skeleton className="h-6 w-20 bg-muted" />
 </CardHeader>
 <CardContent className="space-y-3">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-10 w-full bg-muted/50" />
 ))}
 </CardContent>
 </Card>

 {/* Stats Card */}
 <Card className="bg-transparent border-border">
 <CardHeader>
 <Skeleton className="h-6 w-32 bg-muted" />
 </CardHeader>
 <CardContent className="space-y-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="flex items-center justify-between">
 <Skeleton className="h-4 w-24 bg-muted/50" />
 <Skeleton className="h-6 w-16 bg-muted" />
 </div>
 ))}
 </CardContent>
 </Card>
 </div>
 </div>

 {/* Passports Table Section */}
 <Card className="bg-transparent border-border">
 <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-border">
 <div className="flex items-center gap-2">
 <Skeleton className="h-9 w-9 bg-muted/50" />
 <Skeleton className="h-6 w-40 bg-muted" />
 </div>
 <div className="flex items-center gap-2">
 <Skeleton className="h-8 w-24 bg-muted/50" />
 <Skeleton className="h-8 w-24 bg-muted/50" />
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {/* Table Header */}
 <div className="flex items-center px-5 py-3 border-b border-border/50 bg-background">
 <Skeleton className="h-3 w-32 bg-muted/50" />
 <Skeleton className="h-3 w-24 ml-8 bg-muted/50" />
 <Skeleton className="h-3 w-24 ml-8 bg-muted/50" />
 <Skeleton className="h-3 w-16 ml-auto bg-muted/50" />
 </div>
 {/* Table Rows */}
 {[1, 2, 3, 4, 5].map((i) => (
 <div key={i} className="flex items-center px-5 py-3 border-b border-border last:border-0">
 <Skeleton className="h-4 w-40 bg-muted" />
 <Skeleton className="h-4 w-28 ml-8 bg-muted/50" />
 <Skeleton className="h-4 w-28 ml-8 bg-muted/50" />
 <Skeleton className="h-6 w-6 rounded ml-auto bg-muted/30" />
 </div>
 ))}
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
