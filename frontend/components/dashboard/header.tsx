"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, HelpCircle, Battery } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
    { label: "Overview", href: "/dashboard" },
    { label: "Batches", href: "/batches" },
    { label: "Analytics", href: "/analytics" },
    { label: "Billing", href: "/billing" },
    { label: "Settings", href: "/settings" },
]

export function Header() {
    const { user, logout } = useAuth()
    const pathname = usePathname()

    const initials = user?.company_name
        ? user.company_name.substring(0, 2).toUpperCase()
        : "U"

    const quotaBalance = user?.quota_balance ?? 0
    const isLowQuota = quotaBalance <= 2

    return (
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
            {/* Left: Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Battery className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-slate-900 text-lg">ExportReady</span>
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
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                }`}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Right: Quota Badge + User Profile */}
            <div className="flex items-center gap-3">
                {/* Quota Badge */}
                <Link href="/billing">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${isLowQuota
                        ? 'border-red-300 text-red-600 hover:bg-red-50'
                        : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isLowQuota ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span>Licenses: {quotaBalance}</span>
                    </div>
                </Link>

                {/* User Avatar Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-slate-100">
                            <Avatar className="h-8 w-8 border border-slate-200">
                                <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-medium">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border-slate-200 text-slate-900" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-slate-900">{user?.company_name}</p>
                                <p className="text-xs leading-none text-slate-500">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-200" />
                        <DropdownMenuItem asChild className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer">
                            <a href="mailto:support@exportready.in">
                                <HelpCircle className="mr-2 h-4 w-4" />
                                <span>Support</span>
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
