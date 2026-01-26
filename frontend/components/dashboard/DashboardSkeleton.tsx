"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header Skeleton */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
                    <Skeleton className="h-8 w-48 bg-slate-800" />
                    <Skeleton className="h-4 w-80 mt-2 bg-slate-800/50" />
                </div>

                {/* Stats Row - 4 cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="bg-slate-900/80 border-slate-800">
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 bg-slate-800/50" />
                                <Skeleton className="h-10 w-20 mt-3 bg-slate-800" />
                                <Skeleton className="h-3 w-32 mt-2 bg-slate-800/30" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <Card className="lg:col-span-2 bg-slate-900/80 border-slate-800">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-40 bg-slate-800/50" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[250px] w-full bg-slate-800/30 rounded-lg" />
                        </CardContent>
                    </Card>

                    {/* Right Column - Quota & Status */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900/80 border-slate-800">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-5 w-32 bg-slate-800/50" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full bg-slate-800/30 rounded-full" />
                                <div className="flex justify-between mt-2">
                                    <Skeleton className="h-3 w-16 bg-slate-800/30" />
                                    <Skeleton className="h-3 w-16 bg-slate-800/30" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/80 border-slate-800">
                            <CardHeader className="pb-2">
                                <Skeleton className="h-5 w-36 bg-slate-800/50" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[120px] w-[120px] mx-auto rounded-full bg-slate-800/30" />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Row - Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Batches */}
                    <Card className="lg:col-span-2 bg-slate-900/80 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-800">
                            <Skeleton className="h-4 w-32 bg-slate-800/50" />
                            <Skeleton className="h-3 w-16 bg-slate-800/30" />
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Table Header */}
                            <div className="flex items-center px-5 py-2.5 border-b border-slate-800/50">
                                <Skeleton className="h-2 w-12 bg-slate-800/30 flex-1" />
                                <Skeleton className="h-2 w-12 bg-slate-800/30" />
                                <Skeleton className="h-2 w-12 bg-slate-800/30 ml-4" />
                            </div>
                            {/* Table Rows */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center px-5 py-3 border-b border-slate-800/30 last:border-0">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Skeleton className="h-5 w-5 rounded bg-slate-800/50" />
                                        <div>
                                            <Skeleton className="h-4 w-32 bg-slate-800/50" />
                                            <Skeleton className="h-2 w-20 mt-1 bg-slate-800/30" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-16 bg-slate-800/30" />
                                    <Skeleton className="h-6 w-14 rounded-full ml-4 bg-slate-800/40" />
                                    <Skeleton className="h-6 w-6 rounded ml-4 bg-slate-800/30" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Activity Feed */}
                    <Card className="bg-slate-900/80 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-800">
                            <Skeleton className="h-4 w-24 bg-slate-800/50" />
                            <Skeleton className="h-5 w-12 rounded-full bg-emerald-500/10" />
                        </CardHeader>
                        <CardContent className="p-0">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-slate-800/30 last:border-0">
                                    <Skeleton className="h-7 w-7 rounded-md bg-slate-800/50 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-28 bg-slate-800/50" />
                                            <Skeleton className="h-3 w-10 bg-slate-800/30" />
                                        </div>
                                        <Skeleton className="h-3 w-36 mt-1 bg-slate-800/30" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    )
}
