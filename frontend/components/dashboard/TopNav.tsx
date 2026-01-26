"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Battery, LogOut, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { clsx } from "clsx"

export function TopNav() {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    const navItems = [
        { name: "Overview", href: "/dashboard" },
        { name: "Batches", href: "/batches" },
        { name: "Dispatch", href: "/dashboard/dispatch" },
        { name: "Partners", href: "/partners" },
        { name: "Rewards", href: "/rewards" },
        { name: "Billing", href: "/billing" },
        { name: "Settings", href: "/settings" },
    ]

    const quotaBalance = user?.quota_balance ?? 0
    const isLowQuota = quotaBalance <= 2

    const initials = user?.company_name
        ? user.company_name.substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || "U"

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950">
            <div className="flex h-14 items-center justify-between px-6">
                {/* Left: Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                    <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
                        <Battery className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-white text-lg hidden sm:block">ExportReady</span>
                </Link>

                {/* Center: Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "text-white border-b-2 border-teal-500 rounded-none pb-4"
                                        : "text-slate-400 hover:text-white pb-4"
                                )}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Right: Quota Badge + User Profile */}
                <div className="flex items-center gap-3">
                    {/* Quota Badge */}
                    <Link href="/billing">
                        <div className={clsx(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border",
                            isLowQuota
                                ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
                                : "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                        )}>
                            <span className={clsx("h-1.5 w-1.5 rounded-full", isLowQuota ? "bg-red-500" : "bg-emerald-500")} />
                            <span>Licenses: {quotaBalance}</span>
                        </div>
                    </Link>

                    {/* User Avatar Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-slate-800">
                                <Avatar className="h-8 w-8 border border-zinc-700">
                                    <AvatarImage src={user?.logo_url} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs font-medium">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-100" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none text-white">{user?.company_name || 'Account'}</p>
                                    <p className="text-xs leading-none text-zinc-500">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem asChild className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
                                <a href="mailto:support@exportready.in">
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    <span>Support</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-zinc-800 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}

