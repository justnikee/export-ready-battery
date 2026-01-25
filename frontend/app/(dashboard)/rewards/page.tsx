"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
    Trophy, Users, Zap, Star, Loader2,
    Medal, Award, TrendingUp, Crown
} from "lucide-react"
import { useAuth } from "@/context/auth-context"

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
    BRONZE: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    SILVER: { bg: "bg-slate-400/10", text: "text-slate-300", border: "border-slate-400/20" },
    GOLD: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    PLATINUM: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
    DIAMOND: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
}

const RANK_ICONS = [Crown, Medal, Award]

export default function RewardsPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<LeaderboardData | null>(null)
    const [error, setError] = useState("")

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token")
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

    useEffect(() => {
        const fetchLeaderboard = async () => {
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
            } catch (err: any) {
                console.error("Failed to fetch leaderboard:", err)
                setError(err.message || "Failed to load rewards data")
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [])

    // Calculate stats from leaderboard
    const leaderboard = data?.leaderboard ?? []
    const totalPointsAwarded = leaderboard.reduce((sum, e) => sum + e.total_points, 0)
    const topEarner = leaderboard[0] || null
    const totalParticipants = data?.count || 0

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Partner Loyalty Program</h1>
                        <p className="text-slate-400 text-sm">
                            Track partner status points and leaderboard standings
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Total Points Awarded */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Total Points Awarded</p>
                            <p className="text-2xl font-bold text-white">
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
                    className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Crown className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Top Earner</p>
                            <p className="text-lg font-bold text-white truncate max-w-[150px]">
                                {loading ? "..." : topEarner?.email || "No data"}
                            </p>
                            {topEarner && (
                                <p className="text-sm text-amber-400">{topEarner.total_points} pts</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Participants */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Active Participants</p>
                            <p className="text-2xl font-bold text-white">
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
                className="bg-gradient-to-r from-emerald-500/5 to-amber-500/5 rounded-xl border border-slate-700 p-6 mb-8"
            >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400" />
                    How Points Work
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-emerald-400 font-bold">50</span>
                        </div>
                        <div>
                            <p className="text-white font-medium">Installation</p>
                            <p className="text-slate-500 text-sm">Mark battery as IN_SERVICE</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <span className="text-orange-400 font-bold">20</span>
                        </div>
                        <div>
                            <p className="text-white font-medium">Return Request</p>
                            <p className="text-slate-500 text-sm">Flag for return or service</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <span className="text-purple-400 font-bold">100</span>
                        </div>
                        <div>
                            <p className="text-white font-medium">Recycling</p>
                            <p className="text-slate-500 text-sm">Certified recycling action</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Leaderboard Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
            >
                <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16 text-slate-500">
                        <p>{error}</p>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No rewards data yet</p>
                        <p className="text-sm">Points will appear here when users start scanning</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Rank</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">User</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Level</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Points</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {leaderboard.map((entry, index) => {
                                    const levelColors = LEVEL_COLORS[entry.loyalty_level] || LEVEL_COLORS.BRONZE
                                    const RankIcon = RANK_ICONS[index] || null

                                    return (
                                        <tr key={entry.email} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    {RankIcon ? (
                                                        <RankIcon className={`h-5 w-5 ${index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : "text-orange-400"}`} />
                                                    ) : (
                                                        <span className="text-slate-500 font-medium">#{entry.rank}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-white font-medium">{entry.email}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors.bg} ${levelColors.text} ${levelColors.border} border`}>
                                                    {entry.loyalty_level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-white font-semibold">{entry.total_points.toLocaleString()}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-slate-500 text-sm">
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
    )
}
