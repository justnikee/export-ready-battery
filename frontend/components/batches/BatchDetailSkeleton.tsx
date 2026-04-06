"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function BatchDetailSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8 font-sans">
            <div className="w-full mx-auto space-y-8">

                {/* Header Card */}
                <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-md bg-zinc-200/50" />
                            <div>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-64 bg-zinc-200" />
                                    <Skeleton className="h-7 w-20 rounded-md bg-zinc-200/50" />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Skeleton className="h-6 w-24 rounded-md bg-zinc-200/50" />
                                    <Skeleton className="h-4 w-36 bg-zinc-200/30" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-36 rounded-md bg-emerald-500/20" />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content - Col Span 2 */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Core Specifications Card */}
                        <Card className="bg-white border-zinc-200">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg bg-blue-50" />
                                    <Skeleton className="h-6 w-40 bg-zinc-200" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                                            <Skeleton className="h-3 w-20 bg-zinc-200/50" />
                                            <Skeleton className="h-5 w-32 mt-2 bg-zinc-200" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Compliance Card Skeleton */}
                        <Card className="bg-white border-zinc-200 border-l-4 border-l-orange-500">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded bg-zinc-200/50" />
                                    <Skeleton className="h-6 w-36 bg-zinc-200" />
                                    <Skeleton className="h-5 w-24 rounded bg-orange-50" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                                            <Skeleton className="h-3 w-28 bg-zinc-200/50" />
                                            <Skeleton className="h-7 w-20 mt-2 bg-zinc-200" />
                                        </div>
                                    ))}
                                    <div className="col-span-2 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                                        <Skeleton className="h-3 w-32 bg-zinc-200/50" />
                                        <Skeleton className="h-8 w-64 mt-2 rounded-lg bg-orange-500/10" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upload Section Card */}
                        <Card className="bg-white border-zinc-200">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg bg-teal-50" />
                                    <Skeleton className="h-6 w-28 bg-zinc-200" />
                                </div>
                                <Skeleton className="h-4 w-80 mt-2 bg-zinc-200/50" />
                            </CardHeader>
                            <CardContent>
                                <div className="border-2 border-dashed border-zinc-200 rounded-lg p-8 flex flex-col items-center justify-center">
                                    <Skeleton className="h-12 w-12 rounded-lg bg-zinc-200/50" />
                                    <Skeleton className="h-5 w-48 mt-4 bg-zinc-200" />
                                    <Skeleton className="h-4 w-64 mt-2 bg-zinc-200/50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Actions Card */}
                        <Card className="bg-white border-zinc-200">
                            <CardHeader>
                                <Skeleton className="h-6 w-20 bg-zinc-200" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded-md bg-zinc-200/50" />
                                ))}
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <Card className="bg-white border-zinc-200">
                            <CardHeader>
                                <Skeleton className="h-6 w-32 bg-zinc-200" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-24 bg-zinc-200/50" />
                                        <Skeleton className="h-6 w-16 bg-zinc-200" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Passports Table Section */}
                <Card className="bg-white border-zinc-200">
                    <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-zinc-200">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-9 rounded-lg bg-zinc-200/50" />
                            <Skeleton className="h-6 w-40 bg-zinc-200" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-24 rounded-md bg-zinc-200/50" />
                            <Skeleton className="h-8 w-24 rounded-md bg-zinc-200/50" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Table Header */}
                        <div className="flex items-center px-5 py-3 border-b border-zinc-200/50 bg-zinc-50">
                            <Skeleton className="h-3 w-32 bg-zinc-200/50" />
                            <Skeleton className="h-3 w-24 ml-8 bg-zinc-200/50" />
                            <Skeleton className="h-3 w-24 ml-8 bg-zinc-200/50" />
                            <Skeleton className="h-3 w-16 ml-auto bg-zinc-200/50" />
                        </div>
                        {/* Table Rows */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center px-5 py-3 border-b border-zinc-100 last:border-0">
                                <Skeleton className="h-4 w-40 bg-zinc-200" />
                                <Skeleton className="h-4 w-28 ml-8 bg-zinc-200/50" />
                                <Skeleton className="h-4 w-28 ml-8 bg-zinc-200/50" />
                                <Skeleton className="h-6 w-6 rounded ml-auto bg-zinc-200/30" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
