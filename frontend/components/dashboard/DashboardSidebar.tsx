"use client"

import Link from "next/link"

import { usePathname } from "next/navigation"
import {
    LogOut, X, Home, Box, Users,
    CreditCard, Settings, FileDown,
    ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
    Key, BookOpen, BarChart3,
    LayoutTemplate, TrendingUp, Shield, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { clsx } from "clsx"
import { useState, useEffect } from "react"
import NProgress from "nprogress"

interface NavItem {
    name: string
    href: string
    icon: React.ElementType
}

interface NavGroup {
    label: string
    items: NavItem[]
    collapsible?: boolean
}

const navGroups: NavGroup[] = [
    {
        label: "Overview",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: Home },
            { name: "Analytics", href: "/analytics", icon: TrendingUp },
        ]
    },
    {
        label: "Production",
        items: [
            { name: "Batches", href: "/batches", icon: Box },
            { name: "Lifecycle", href: "/lifecycle", icon: Activity },
            { name: "Templates", href: "/templates", icon: LayoutTemplate },
        ]
    },
    {
        label: "Compliance",
        items: [
            { name: "Compliance", href: "/compliance", icon: Shield },
            { name: "Exports", href: "/exports", icon: FileDown },
        ]
    },
    {
        label: "Account",
        items: [
            { name: "Team", href: "/team", icon: Users },
            { name: "Billing", href: "/billing", icon: CreditCard },
            { name: "Settings", href: "/settings", icon: Settings },
        ]
    },
    {
        label: "Developer",
        collapsible: true,
        items: [
            { name: "API Keys", href: "/developer", icon: Key },
            { name: "Docs", href: "/docs", icon: BookOpen },
        ]
    }
]

interface DashboardSidebarProps {
    isOpen: boolean
    onClose: () => void
    isCollapsed: boolean
    onToggleCollapse: () => void
}

export function DashboardSidebar({
    isOpen,
    onClose,
    isCollapsed,
    onToggleCollapse
}: DashboardSidebarProps) {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    const [devExpanded, setDevExpanded] = useState(() => {
        if (typeof window === "undefined") return false
        const saved = localStorage.getItem('sidebar-dev-expanded')
        return saved ? JSON.parse(saved) : false
    })

    useEffect(() => {
        localStorage.setItem('sidebar-dev-expanded', JSON.stringify(devExpanded))
    }, [devExpanded])

    const initials = user?.company_name
        ? user.company_name.substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || "U"

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === href
        return pathname === href || pathname.startsWith(href)
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
                // Mobile: slide in/out
                "md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full",
                // Width based on collapsed state
                isCollapsed ? "md:w-16" : "md:w-60",
                "w-72" // Mobile always full width
            )}>
                {/* Header */}
                <div className={clsx(
                    "flex items-center border-b border-sidebar-border h-14 px-4",
                    isCollapsed ? "md:justify-center" : "justify-between"
                )}>
                    <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
                        <BarChart3 className="h-7 w-7 text-[var(--brand)]" />
                        <span className={clsx("text-xl font-bold tracking-tight text-foreground", isCollapsed && "md:hidden")}>EXPORTLENS</span>
                    </Link>

                    {/* Mobile Close */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 md:hidden"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </Button>

                    {/* Desktop Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={clsx(
                            "h-7 w-7 hidden md:flex",
                            isCollapsed && "md:absolute md:-right-3 md:top-4 md:bg-card md:border md:border-border md:rounded-full"
                        )}
                        onClick={onToggleCollapse}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    {navGroups.map((group, groupIndex) => {
                        const isDevGroup = group.collapsible
                        const isGroupExpanded = isDevGroup ? devExpanded : true

                        return (
                            <div key={group.label} className={clsx(groupIndex > 0 && "mt-6")}>
                                {/* Group Label */}
                                {isDevGroup ? (
                                    <button
                                        onClick={() => setDevExpanded((prev: boolean) => !prev)}
                                        className={clsx(
                                            "flex items-center justify-between w-full px-3 mb-2 hover:opacity-80 transition-colors code-label",
                                            isCollapsed && "md:hidden"
                                        )}
                                    >
                                        <span>{group.label}</span>
                                        {devExpanded ? (
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        ) : (
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                ) : (
                                    <div className={clsx(
                                        "px-3 mb-2 code-label",
                                        isCollapsed && "md:hidden"
                                    )}>
                                        {group.label}
                                    </div>
                                )}

                                {/* Group Items */}
                                {isGroupExpanded && (
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const Icon = item.icon
                                            const active = isActive(item.href)

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => {
                                                        if (!active) NProgress.start()
                                                        onClose()
                                                    }}
                                                    title={isCollapsed ? item.name : undefined}
                                                    className={clsx(
                                                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                                                        active
                                                            ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-[var(--brand)]"
                                                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                        isCollapsed && "md:justify-center md:px-0"
                                                    )}
                                                >
                                                    <Icon className={clsx(
                                                        "h-5 w-5 shrink-0 transition-colors",
                                                        active ? "text-[var(--brand)]" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                                                    )} />
                                                    <span className={clsx(
                                                        isCollapsed && "md:hidden"
                                                    )}>
                                                        {item.name}
                                                    </span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* User Section */}
                <div className="border-t border-sidebar-border p-3">
                    <div className={clsx(
                        "flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent transition-colors",
                        isCollapsed && "md:justify-center"
                    )}>
                        <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                            <AvatarImage src={user?.logo_url} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className={clsx(
                            "flex-1 min-w-0",
                            isCollapsed && "md:hidden"
                        )}>
                            <p className="text-sm font-medium text-foreground truncate">
                                {user?.company_name || 'Account'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user?.email}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => {
                            logout()
                            onClose()
                        }}
                        className={clsx(
                            "w-full mt-2 text-destructive hover:bg-destructive/10 hover:text-destructive justify-start",
                            isCollapsed && "md:justify-center md:px-0"
                        )}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span className={clsx(isCollapsed && "md:hidden")}>
                            Sign Out
                        </span>
                    </Button>
                </div>
            </aside>
        </>
    )
}

// Hook to manage sidebar state
export function useSidebarState() {
    const [isOpen, setIsOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window === "undefined") return false
        const saved = localStorage.getItem('sidebar-collapsed')
        return saved ? JSON.parse(saved) : false
    })

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    }, [isCollapsed])

    return {
        isOpen,
        setIsOpen,
        isCollapsed,
        setIsCollapsed,
        toggleOpen: () => setIsOpen((prev: boolean) => !prev),
        toggleCollapse: () => setIsCollapsed((prev: boolean) => !prev),
    }
}
