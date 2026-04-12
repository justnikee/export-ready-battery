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
 <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
 <div className="flex h-14 items-center border-b px-6">
 <Link href="/" className="flex items-center gap-2 group">
 <BarChart3 className="h-7 w-7 text-[var(--brand)]" />
 <span className="text-xl tracking-tight text-foreground">EXPORTLENS</span>
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
 "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
 isActive ? "bg-sidebar-accent text-sidebar-primary border-l-2 border-[var(--brand)]" : "text-sidebar-foreground"
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
