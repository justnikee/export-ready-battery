"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Battery, AlertTriangle, CheckCircle } from "lucide-react"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

export function LiveBalanceBanner() {
 const [balance, setBalance] = useState<number | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
 fetchBalance()

 // Listen for balance updates from payments
 window.addEventListener('quota-updated', fetchBalance)
 return () => window.removeEventListener('quota-updated', fetchBalance)
 }, [])

 const fetchBalance = async () => {
 try {
 const response = await api.get("/billing/balance")

 if (response.data && typeof response.data.quota_balance === 'number') {
 setBalance(response.data.quota_balance)
 setError(null)
 } else {
 console.error("Invalid balance data:", response.data)
 setError("Invalid data received")
 }
 } catch (error: unknown) {
 console.error("Failed to fetch balance:", error)
 const apiError = error as { message?: string }
 setError(apiError.message || "Failed to load balance")
 } finally {
 setLoading(false)
 }
 }

 if (loading) {
 return <Skeleton className="h-32 w-full rounded-xl bg-white/50" />
 }

 if (error) {
 return (
 <Card className="bg-red-500/10 border-red-200">
 <CardContent className="p-8 flex items-center gap-4 text-red-500">
 <AlertTriangle className="h-6 w-6" />
 <div>
 <h3 className="">Unable to load balance</h3>
 <p className="text-sm opacity-80">{error}</p>
 </div>
 </CardContent>
 </Card>
 )
 }

 const isLow = (balance || 0) < 2

 return (
 <Card className={`relative overflow-hidden ${isLow ? 'border-red-200 bg-red-500/10/50' : 'border-border bg-card'}`}>
 <div className={`absolute inset-0 bg-linear-to-r ${isLow ? 'from-red-100/50 via-transparent to-transparent' : 'from-emerald-50/50 via-transparent to-transparent'} pointer-events-none`} />

 <CardContent className="p-8 flex items-center justify-between relative z-10">
 <div className="space-y-2">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Battery className="h-5 w-5" />
 <span className="text-sm font-medium uppercase tracking-wider">Current Quota Balance</span>
 </div>
 <div className="flex items-baseline gap-2">
 <h2 className={`text-5xl ${isLow ? 'text-red-500' : 'text-emerald-500'}`}>
 {balance}
 </h2>
 <span className="text-xl text-muted-foreground font-medium">Batches</span>
 </div>
 <p className="text-muted-foreground max-w-md">
 {isLow
 ? "Your quota is running low. Purchase a license package to ensure uninterrupted production."
 : "You have sufficient quota for your upcoming production runs."
 }
 </p>
 </div>

 <div className="hidden md:flex items-center gap-4">
 {isLow ? (
 <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-200 rounded-full text-red-500">
 <AlertTriangle className="h-4 w-4" />
 <span className="text-sm font-medium">Action Required</span>
 </div>
 ) : (
 <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-200 rounded-full text-emerald-500">
 <CheckCircle className="h-4 w-4" />
 <span className="text-sm font-medium">Production Ready</span>
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 )
}
