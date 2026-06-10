"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
 Trophy, Users, Zap, Star, Loader2,
 Medal, Award, TrendingUp, Crown
} from "lucide-react"
import api from "@/lib/api"

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
 BRONZE: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200" },
 SILVER: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
 GOLD: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
 PLATINUM: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
 DIAMOND: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
}

const RANK_ICONS = [Crown, Medal, Award]

export default function RewardsPage() {
 const [loading, setLoading] = useState(true)
 const [data, setData] = useState<LeaderboardData | null>(null)
 const [error, setError] = useState("")

 const fetchLeaderboard = useCallback(async () => {
 try {
 const response = await api.get('/rewards/leaderboard', { params: { limit: 20 } })
 setData(response.data)
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message : "Failed to load rewards data")
 } finally {
 setLoading(false)
 }
 }, [])

 useEffect(() => {
 fetchLeaderboard()
 }, [fetchLeaderboard])

 // Calculate stats from leaderboard
 const leaderboard = data?.leaderboard ?? []
 const totalPointsAwarded = leaderboard.reduce((sum, e) => sum + e.total_points, 0)
 const topEarner = leaderboard[0] || null
 const totalParticipants = data?.count || 0

 return (
 <div className="min-h-screen bg-background p-6">
 <div className="w-full mx-auto space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-3">
 <div className="p-2 bg-amber-500/10 border border-amber-500/20">
 <Trophy className="h-5 w-5 text-amber-500" />
 </div>
 Partner Loyalty Program
 </h1>
 <p className="text-sm text-muted-foreground mt-1">
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
 className="relative bg-transparent border border-border p-6"
 ><div className="flex items-center gap-4">
 <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
 <Zap className="h-6 w-6 text-emerald-500" />
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Total Points Awarded</p>
 <p className="text-2xl text-foreground">
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
 className="relative bg-transparent border border-border p-6"
 ><div className="flex items-center gap-4">
 <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
 <Crown className="h-6 w-6 text-amber-500" />
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Top Earner</p>
 <p className="text-lg text-foreground truncate max-w-[150px]">
 {loading ? "..." : topEarner?.email || "No data"}
 </p>
 {topEarner && (
 <p className="text-sm text-amber-500">{topEarner.total_points} pts</p>
 )}
 </div>
 </div>
 </motion.div>

 {/* Participants */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="relative bg-transparent border border-border p-6"
 ><div className="flex items-center gap-4">
 <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
 <Users className="h-6 w-6 text-blue-500" />
 </div>
 <div>
 <p className="text-sm text-muted-foreground">Active Participants</p>
 <p className="text-2xl text-foreground">
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
 className="bg-linear-to-r from-emerald-50 to-amber-50 border border-border p-6"
 >
 <h3 className="text-lg text-foreground mb-4 flex items-center gap-2">
 <Star className="h-5 w-5 text-amber-500" />
 How Points Work
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 bg-emerald-100 border border-emerald-500/20 flex items-center justify-center">
 <span className="text-emerald-500 ">50</span>
 </div>
 <div>
 <p className="text-foreground font-medium">Installation</p>
 <p className="text-muted-foreground text-sm">Mark battery as IN_SERVICE</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 bg-orange-100 border border-orange-200 flex items-center justify-center">
 <span className="text-orange-600 ">20</span>
 </div>
 <div>
 <p className="text-foreground font-medium">Return Request</p>
 <p className="text-muted-foreground text-sm">Flag for return or service</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 bg-teal-100 border border-teal-200 flex items-center justify-center">
 <span className="text-teal-600 ">100</span>
 </div>
 <div>
 <p className="text-foreground font-medium">Recycling</p>
 <p className="text-muted-foreground text-sm">Certified recycling action</p>
 </div>
 </div>
 </div>
 </motion.div>

 {/* Leaderboard Table */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 className="relative bg-transparent border border-border overflow-visible"
 ><div className="p-4 border-b border-border flex items-center gap-2">
 <TrendingUp className="h-5 w-5 text-emerald-500" />
 <h3 className="text-lg text-foreground">Leaderboard</h3>
 </div>

 {loading ? (
 <div className="flex items-center justify-center py-16">
 <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
 </div>
 ) : error ? (
 <div className="text-center py-16 text-muted-foreground">
 <p>{error}</p>
 </div>
 ) : leaderboard.length === 0 ? (
 <div className="text-center py-16 text-muted-foreground">
 <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
 <p>No rewards data yet</p>
 <p className="text-sm">Points will appear here when users start scanning</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-muted">
 <tr>
 <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider">Rank</th>
 <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider">User</th>
 <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider">Level</th>
 <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground uppercase tracking-wider">Points</th>
 <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {leaderboard.map((entry, index) => {
 const levelColors = LEVEL_COLORS[entry.loyalty_level] || LEVEL_COLORS.BRONZE
 const RankIcon = RANK_ICONS[index] || null

 return (
 <tr key={entry.email} className="hover:bg-accent transition-colors">
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 {RankIcon ? (
 <RankIcon className={`h-5 w-5 ${index === 0 ? "text-amber-500" : index === 1 ? "text-muted-foreground" : "text-orange-500"}`} />
 ) : (
 <span className="text-muted-foreground font-medium">#{entry.rank}</span>
 )}
 </div>
 </td>
 <td className="px-4 py-4">
 <p className="text-foreground font-medium">{entry.email}</p>
 </td>
 <td className="px-4 py-4">
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors.bg} ${levelColors.text} ${levelColors.border} border`}>
 {entry.loyalty_level}
 </span>
 </td>
 <td className="px-4 py-4 text-right">
 <span className="text-foreground ">{entry.total_points.toLocaleString()}</span>
 </td>
 <td className="px-4 py-4 text-right">
 <div className="flex items-center justify-end gap-2 text-muted-foreground text-sm">
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
