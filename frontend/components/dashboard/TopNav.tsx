"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, Settings as SettingsIcon, Plus, Command, Battery } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { clsx } from "clsx"

export function TopNav() {
    const pathname = usePathname()
    const { user } = useAuth()

    const navItems = [
        { name: "Overview", href: "/dashboard" },
        { name: "Batches", href: "/batches" },
        { name: "Templates", href: "/templates" },
        { name: "Analytics", href: "/analytics" },
        { name: "Settings", href: "/settings" },
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black text-zinc-100">
            <div className="flex h-16 items-center px-6 gap-8">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <div className="bg-purple-600 text-white p-1 rounded-md">
                        <Battery className="h-4 w-4 fill-current" />
                    </div>
                    ExportReady
                </Link>

                {/* Main Nav */}
                <nav className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                                )}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Right Side Actions */}
                <div className="ml-auto flex items-center gap-4">

                    {/* Search */}
                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search batches..."
                            className="bg-zinc-900/50 border-zinc-800 pl-9 pr-10 text-zinc-300 focus-visible:ring-zinc-700 placeholder:text-zinc-600 h-9"
                        />
                        <div className="absolute right-2 top-2 h-5 w-5 bg-zinc-800 rounded flex items-center justify-center border border-zinc-700">
                            <span className="text-[10px] text-zinc-400">⌘K</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-r border-zinc-800 pr-4 mr-2">
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                            <Bell className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                            <SettingsIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* New Batch Button */}
                    <Link href="/batches/new">
                        <Button className="bg-zinc-100 text-zinc-900 hover:bg-white border-none font-semibold h-9">
                            <Plus className="mr-2 h-4 w-4" /> New Batch
                        </Button>
                    </Link>

                    {/* Avatar */}
                    <Avatar className="h-8 w-8 bg-purple-600 text-white border border-zinc-700">
                        <AvatarImage src={user?.logo_url} />
                        <AvatarFallback className="bg-purple-600 text-xs">
                            {user?.email?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                </div>
            </div>
        </header>
    )
}
