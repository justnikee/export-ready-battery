"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
    Trophy, Users, Zap, Star, Loader2,
    Medal, Award, TrendingUp, Crown
} from "lucide-react"

interface LeaderboardEntry {
    rank: number
    email: string
    total_points: number
    loyalty_level: string
    stats: {
        installations: number
        recycles: number
        returns: number
    }
}

interface LeaderboardData {
    leaderboard: LeaderboardEntry[]
    count: number
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    BRONZE: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    SILVER: { bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-200" },
    GOLD: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    PLATINUM: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
    DIAMOND: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
}

const RANK_ICONS = [Crown, Medal, Award]

export default function RewardsPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<LeaderboardData | null>(null)
    const [error, setError] = useState("")

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token")
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    }, [])

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

    const fetchLeaderboard = useCallback(async () => {
        try {
            const response = await fetch(`${apiUrl}/rewards/leaderboard?limit=20`, {
                headers: getAuthHeaders()
            })

            if (response.ok) {
                const result = await response.json()
                setData(result)
            } else {
                throw new Error("Failed to fetch leaderboard")
            }
        } catch (err: unknown) {
            console.error("Failed to fetch leaderboard:", err)
            setError(err instanceof Error ? err.message : "Failed to load rewards data")
        } finally {
            setLoading(false)
        }
    }, [apiUrl, getAuthHeaders])

    useEffect(() => {
        fetchLeaderboard()
    }, [fetchLeaderboard])

    // Calculate stats from leaderboard
    const leaderboard = data?.leaderboard ?? []
    const totalPointsAwarded = leaderboard.reduce((sum, e) => sum + e.total_points, 0)
    const topEarner = leaderboard[0] || null
    const totalParticipants = data?.count || 0

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            <div className="w-full mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                                <Trophy className="h-5 w-5 text-amber-600" />
                            </div>
                            Partner Loyalty Program
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Track partner status points and leaderboard standings
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Points Awarded */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-zinc-200 rounded-lg p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <Zap className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Total Points Awarded</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    {loading ? "..." : totalPointsAwarded.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Top Earner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border border-zinc-200 rounded-lg p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                                <Crown className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Top Earner</p>
                                <p className="text-lg font-bold text-zinc-900 truncate max-w-[150px]">
                                    {loading ? "..." : topEarner?.email || "No data"}
                                </p>
                                {topEarner && (
                                    <p className="text-sm text-amber-600">{topEarner.total_points} pts</p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Participants */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white border border-zinc-200 rounded-lg p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">Active Participants</p>
                                <p className="text-2xl font-bold text-zinc-900">
                                    {loading ? "..." : totalParticipants}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* How Points Work */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-linear-to-r from-emerald-50 to-amber-50 rounded-lg border border-zinc-200 p-6"
                >
                    <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        How Points Work
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                                <span className="text-emerald-600 font-bold">50</span>
                            </div>
                            <div>
                                <p className="text-zinc-900 font-medium">Installation</p>
                                <p className="text-zinc-500 text-sm">Mark battery as IN_SERVICE</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center">
                                <span className="text-orange-600 font-bold">20</span>
                            </div>
                            <div>
                                <p className="text-zinc-900 font-medium">Return Request</p>
                                <p className="text-zinc-500 text-sm">Flag for return or service</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center">
                                <span className="text-teal-600 font-bold">100</span>
                            </div>
                            <div>
                                <p className="text-zinc-900 font-medium">Recycling</p>
                                <p className="text-zinc-500 text-sm">Certified recycling action</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Leaderboard Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white border border-zinc-200 rounded-lg overflow-hidden"
                >
                    <div className="p-4 border-b border-zinc-100 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-semibold text-zinc-900">Leaderboard</h3>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 text-zinc-500">
                            <p>{error}</p>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-16 text-zinc-500">
                            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No rewards data yet</p>
                            <p className="text-sm">Points will appear here when users start scanning</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 uppercase tracking-wider">Rank</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500 uppercase tracking-wider">Level</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500 uppercase tracking-wider">Points</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {leaderboard.map((entry, index) => {
                                        const levelColors = LEVEL_COLORS[entry.loyalty_level] || LEVEL_COLORS.BRONZE
                                        const RankIcon = RANK_ICONS[index] || null

                                        return (
                                            <tr key={entry.email} className="hover:bg-zinc-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {RankIcon ? (
                                                            <RankIcon className={`h-5 w-5 ${index === 0 ? "text-amber-500" : index === 1 ? "text-zinc-400" : "text-orange-500"}`} />
                                                        ) : (
                                                            <span className="text-zinc-500 font-medium">#{entry.rank}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-zinc-900 font-medium">{entry.email}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors.bg} ${levelColors.text} ${levelColors.border} border`}>
                                                        {entry.loyalty_level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-zinc-900 font-semibold">{entry.total_points.toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 text-zinc-500 text-sm">
                                                        <span title="Installations">{entry.stats.installations}📦</span>
                                                        <span title="Recycles">{entry.stats.recycles}♻️</span>
                                                        <span title="Returns">{entry.stats.returns}↩️</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
