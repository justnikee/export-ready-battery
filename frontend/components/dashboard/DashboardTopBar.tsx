"use client"

import Link from "next/link"
import { Menu, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur border-b border-zinc-200 flex items-center justify-between px-4 md:px-6">
            {/* Left: Mobile Menu Button */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 md:hidden"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5 text-zinc-700" />
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
                            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    )}>
                        <span className={clsx(
                            "h-2 w-2 rounded-full animate-pulse",
                            isLowQuota ? "bg-red-500" : "bg-emerald-500"
                        )} />
                        <span className="hidden sm:inline">Licenses:</span>
                        <span className="font-semibold">{quotaBalance}</span>
                    </div>
                </Link>

                {/* Help Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-zinc-500 hover:text-zinc-700"
                    asChild
                >
                    <a href="mailto:support@exportready.in">
                        <HelpCircle className="h-5 w-5" />
                    </a>
                </Button>
            </div>
        </header>
    )
}
