"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LogOut, HelpCircle, Menu, X, Home, Box, Truck, Users, Trophy, CreditCard, Settings, UserPlus } from "lucide-react"
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
import { useState } from "react"

export function TopNav() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: Home },
        { name: "Batches", href: "/batches", icon: Box },
        { name: "Dispatch", href: "/dashboard/dispatch", icon: Truck },
        { name: "Partners", href: "/partners", icon: Users },
        { name: "Team", href: "/team", icon: UserPlus },
        { name: "Rewards", href: "/rewards", icon: Trophy },
        { name: "Billing", href: "/billing", icon: CreditCard },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    const quotaBalance = user?.quota_balance ?? 0
    const isLowQuota = quotaBalance <= 2

    const initials = user?.company_name
        ? user.company_name.substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || "U"

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
                <div className="flex h-14 items-center justify-between px-4 md:px-6">
                    {/* Left: Mobile Menu + Logo */}
                    <div className="flex items-center gap-2">
                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden h-9 w-9"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu className="h-5 w-5 text-slate-700" />
                        </Button>

                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                            <Image src="/logo/logo.svg" alt="ExportReady" width={140} height={28} className="h-7 w-auto invert" />
                        </Link>
                    </div>

                    {/* Center: Navigation (Desktop only) */}
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
                                            ? "text-blue-700 border-b-2 border-blue-500 rounded-none pb-4"
                                            : "text-slate-600 hover:text-slate-900 pb-4"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right: Quota Badge + User Profile */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Quota Badge */}
                        <Link href="/billing">
                            <div className={clsx(
                                "flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border",
                                isLowQuota
                                    ? "border-red-300 text-red-600 hover:bg-red-50"
                                    : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                            )}>
                                <span className={clsx("h-1.5 w-1.5 rounded-full", isLowQuota ? "bg-red-500" : "bg-emerald-500")} />
                                <span className="hidden sm:inline">Licenses:</span>
                                <span>{quotaBalance}</span>
                            </div>
                        </Link>

                        {/* User Avatar Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-slate-100">
                                    <Avatar className="h-8 w-8 border border-slate-200">
                                        <AvatarImage src={user?.logo_url} />
                                        <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-medium">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white border-slate-200 text-slate-900" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none text-slate-900">{user?.company_name || 'Account'}</p>
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
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Slide-out Menu */}
                    <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl animate-in slide-in-from-left duration-300">
                        {/* Menu Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 p-4">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Image src="/logo/logo.svg" alt="ExportReady" width={140} height={28} className="h-7 w-auto invert" />
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </Button>
                        </div>

                        {/* Menu Items */}
                        <nav className="flex flex-col p-4 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href ||
                                    (item.href !== "/dashboard" && pathname.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={clsx(
                                            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* User Info at Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-slate-200">
                                    <AvatarImage src={user?.logo_url} />
                                    <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-medium">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{user?.company_name || 'Account'}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => {
                                    logout()
                                    setMobileMenuOpen(false)
                                }}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
