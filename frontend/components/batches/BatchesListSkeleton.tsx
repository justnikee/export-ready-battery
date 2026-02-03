"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function BatchesListSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="w-full mx-auto space-y-6">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 bg-slate-200" />
                        <Skeleton className="h-4 w-80 mt-2 bg-slate-200/50" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-28 rounded-md bg-slate-200" />
                        <Skeleton className="h-10 w-32 rounded-md bg-slate-900/10" />
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-lg bg-slate-200/50" />
                            <div>
                                <Skeleton className="h-7 w-16 bg-slate-200" />
                                <Skeleton className="h-3 w-24 mt-1 bg-slate-200/50" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-9 flex-1 max-w-md rounded-md bg-slate-200/50" />
                        <Skeleton className="h-9 w-32 rounded-md bg-slate-200/50" />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="border-b border-slate-200 bg-slate-50 flex items-center px-4 py-3 gap-4">
                        <Skeleton className="w-5 h-5 rounded bg-slate-200/50" />
                        <Skeleton className="h-3 w-24 bg-slate-200/50" />
                        <Skeleton className="h-3 w-16 bg-slate-200/50" />
                        <Skeleton className="h-3 w-28 bg-slate-200/50" />
                        <Skeleton className="h-3 w-20 bg-slate-200/50" />
                        <Skeleton className="h-3 w-16 bg-slate-200/50" />
                        <Skeleton className="h-3 w-16 ml-auto bg-slate-200/50" />
                    </div>

                    {/* Table Rows */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="flex items-center px-4 py-4 border-b border-slate-100 last:border-0 gap-4"
                        >
                            {/* Checkbox */}
                            <Skeleton className="w-5 h-5 rounded bg-slate-200/50" />

                            {/* Batch Name */}
                            <div className="flex-1 min-w-[200px]">
                                <Skeleton className="h-5 w-40 bg-slate-200" />
                                <div className="flex items-center gap-2 mt-1">
                                    <Skeleton className="h-4 w-32 bg-slate-200/30 rounded" />
                                    <Skeleton className="h-3 w-3 bg-slate-200/30" />
                                </div>
                            </div>

                            {/* Market */}
                            <div className="w-20">
                                <Skeleton className="h-6 w-16 rounded bg-slate-200/50" />
                            </div>

                            {/* Specs */}
                            <div className="w-28">
                                <Skeleton className="h-4 w-20 bg-slate-200" />
                                <Skeleton className="h-3 w-24 mt-1 bg-slate-200/30" />
                            </div>

                            {/* Passports */}
                            <div className="w-24">
                                <Skeleton className="h-6 w-16 bg-slate-200" />
                            </div>

                            {/* Status */}
                            <div className="w-20">
                                <Skeleton className="h-6 w-16 rounded-md bg-slate-200/50" />
                            </div>

                            {/* Actions */}
                            <div className="w-8">
                                <Skeleton className="h-6 w-6 rounded bg-slate-200/30" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48 bg-slate-200/50" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24 rounded-md bg-slate-200/50" />
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-8 w-8 rounded-md bg-slate-200/30" />
                            ))}
                        </div>
                        <Skeleton className="h-8 w-20 rounded-md bg-slate-200/50" />
                    </div>
                </div>
            </div>
        </div>
    )
}
