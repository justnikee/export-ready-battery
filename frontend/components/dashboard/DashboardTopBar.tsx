"use client"

import Link from "next/link"
import { Menu, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/context/auth-context"
import { clsx } from "clsx"

interface DashboardTopBarProps {
 onMenuClick: () => void
}

export function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
 const { user } = useAuth()

 const quotaBalance = user?.quota_balance ?? 0
 const isLowQuota = quotaBalance <= 2

 return (
 <header className="sticky top-0 z-30 h-14 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-6">
 {/* Left: Mobile Menu Button */}
 <div className="flex items-center gap-3">
 <Button
 variant="ghost"
 size="icon"
 className="h-9 w-9 md:hidden"
 onClick={onMenuClick}
 >
 <Menu className="h-5 w-5 text-foreground" />
 </Button>

 {/* Breadcrumb or Page Title could go here */}
 </div>

 {/* Right: Quota + Support */}
 <div className="flex items-center gap-3">
 {/* Quota Badge */}
 <Link href="/billing">
 <div className={clsx(
 "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border",
 isLowQuota
 ? "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/15"
 : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/15"
 )}>
 <span className={clsx(
 "h-2 w-2 rounded-full animate-pulse",
 isLowQuota ? "bg-red-500/100" : "bg-emerald-500/100"
 )} />
 <span className="hidden sm:inline">Licenses:</span>
 <span className="">{quotaBalance}</span>
 </div>
 </Link>

 {/* Help Button */}
 <Button
 variant="ghost"
 size="icon"
 className="h-9 w-9 text-muted-foreground hover:text-foreground"
 asChild
 >
 <a href="mailto:support@exportready.in">
 <HelpCircle className="h-5 w-5" />
 </a>
 </Button>

 {/* Theme Toggle */}
 <ThemeToggle />
 </div>
 </header>
 )
}
