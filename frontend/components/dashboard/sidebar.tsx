"use client"

import Link from "next/link"

import { usePathname } from "next/navigation"
import { Box, Home, Settings, CreditCard, Code, Users, Trophy, FileArchive, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { icon: Home, label: "Overview", href: "/dashboard" },
    { icon: Box, label: "Batches", href: "/batches" },
    { icon: Users, label: "Partners", href: "/partners" },
    { icon: FileArchive, label: "Exports", href: "/exports" },
    { icon: Trophy, label: "Rewards", href: "/rewards" },
    { icon: CreditCard, label: "Billing", href: "/billing" },
    { icon: Code, label: "Developer", href: "/developer" },
    { icon: Users, label: "Team", href: "/team" },
    { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white">
            <div className="flex h-14 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold group">
                    <BarChart3 className="h-7 w-7 text-[#1F7A5F]" />
                    <span className="text-xl font-bold tracking-tight text-[#0B1F3B]">EXPORTLENS</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="flex flex-col gap-1 px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100",
                                    isActive ? "bg-zinc-100 text-primary" : "text-zinc-500"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
