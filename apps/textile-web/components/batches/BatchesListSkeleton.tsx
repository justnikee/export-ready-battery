"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function BatchesListSkeleton() {
 return (
 <div className="min-h-screen bg-background p-6">
 <div className="w-full mx-auto space-y-6">

 {/* Page Header */}
 <div className="flex items-center justify-between">
 <div>
 <Skeleton className="h-8 w-48 bg-muted" />
 <Skeleton className="h-4 w-80 mt-2 bg-muted/50" />
 </div>
 <div className="flex items-center gap-3">
 <Skeleton className="h-10 w-28 bg-muted" />
 <Skeleton className="h-10 w-32 bg-background/10" />
 </div>
 </div>

 {/* Stats Row */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="relative bg-transparent border border-border p-4 flex items-center gap-4">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
 <Skeleton className="w-10 h-10 bg-muted/50" />
 <div>
 <Skeleton className="h-7 w-16 bg-muted" />
 <Skeleton className="h-3 w-24 mt-1 bg-muted/50" />
 </div>
 </div>
 ))}
 </div>

 {/* Toolbar */}
 <div className="relative flex items-center justify-between gap-4 bg-transparent p-4 border border-border">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
 <div className="flex items-center gap-3 flex-1">
 <Skeleton className="h-9 flex-1 max-w-md bg-muted/50" />
 <Skeleton className="h-9 w-32 bg-muted/50" />
 </div>
 </div>

 {/* Table */}
 <div className="relative bg-transparent border border-border overflow-visible">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
 {/* Table Header */}
 <div className="border-b border-border bg-background flex items-center px-4 py-3 gap-4">
 <Skeleton className="w-5 h-5 rounded bg-muted/50" />
 <Skeleton className="h-3 w-24 bg-muted/50" />
 <Skeleton className="h-3 w-16 bg-muted/50" />
 <Skeleton className="h-3 w-28 bg-muted/50" />
 <Skeleton className="h-3 w-20 bg-muted/50" />
 <Skeleton className="h-3 w-16 bg-muted/50" />
 <Skeleton className="h-3 w-16 ml-auto bg-muted/50" />
 </div>

 {/* Table Rows */}
 {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
 <div
 key={i}
 className="flex items-center px-4 py-4 border-b border-border last:border-0 gap-4"
 >
 {/* Checkbox */}
 <Skeleton className="w-5 h-5 rounded bg-muted/50" />

 {/* Batch Name */}
 <div className="flex-1 min-w-[200px]">
 <Skeleton className="h-5 w-40 bg-muted" />
 <div className="flex items-center gap-2 mt-1">
 <Skeleton className="h-4 w-32 bg-muted/30 rounded" />
 <Skeleton className="h-3 w-3 bg-muted/30" />
 </div>
 </div>

 {/* Market */}
 <div className="w-20">
 <Skeleton className="h-6 w-16 rounded bg-muted/50" />
 </div>

 {/* Specs */}
 <div className="w-28">
 <Skeleton className="h-4 w-20 bg-muted" />
 <Skeleton className="h-3 w-24 mt-1 bg-muted/30" />
 </div>

 {/* Passports */}
 <div className="w-24">
 <Skeleton className="h-6 w-16 bg-muted" />
 </div>

 {/* Status */}
 <div className="w-20">
 <Skeleton className="h-6 w-16 bg-muted/50" />
 </div>

 {/* Actions */}
 <div className="w-8">
 <Skeleton className="h-6 w-6 rounded bg-muted/30" />
 </div>
 </div>
 ))}
 </div>

 {/* Pagination */}
 <div className="flex items-center justify-between">
 <Skeleton className="h-4 w-48 bg-muted/50" />
 <div className="flex items-center gap-2">
 <Skeleton className="h-8 w-24 bg-muted/50" />
 <div className="flex items-center gap-1">
 {[1, 2, 3, 4, 5].map((i) => (
 <Skeleton key={i} className="h-8 w-8 bg-muted/30" />
 ))}
 </div>
 <Skeleton className="h-8 w-20 bg-muted/50" />
 </div>
 </div>
 </div>
 </div>
 )
}
