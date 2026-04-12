"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TabsContextType {
 activeTab: string
 setActiveTab: (tab: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
 defaultValue: string
 children: React.ReactNode
 className?: string
 value?: string
 onValueChange?: (value: string) => void
}

export function Tabs({ defaultValue, children, className, value, onValueChange }: TabsProps) {
 const [internalTab, setInternalTab] = React.useState(defaultValue)
 const activeTab = value !== undefined ? value : internalTab
 const setActiveTab = (tab: string) => {
 setInternalTab(tab)
 onValueChange?.(tab)
 }

 return (
 <TabsContext.Provider value={{ activeTab, setActiveTab }}>
 <div className={className}>{children}</div>
 </TabsContext.Provider>
 )
}

interface TabsListProps {
 children: React.ReactNode
 className?: string
}

export function TabsList({ children, className }: TabsListProps) {
 return (
 <div
 className={cn(
 "inline-flex h-10 items-center justify-center rounded-full p-1 text-muted-foreground",
 "bg-muted border border-border",
 className
 )}
 >
 {children}
 </div>
 )
}

interface TabsTriggerProps {
 value: string
 children: React.ReactNode
 className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
 const context = React.useContext(TabsContext)
 if (!context) throw new Error("TabsTrigger must be used within Tabs")

 const isActive = context.activeTab === value

 return (
 <button
 type="button"
 onClick={() => context.setActiveTab(value)}
 className={cn(
 "inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium",
 "ring-offset-background transition-all",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
 "disabled:pointer-events-none disabled:opacity-50",
 isActive
 ? "bg-primary text-primary-foreground shadow-none"
 : "text-muted-foreground hover:text-foreground hover:bg-accent",
 className
 )}
 >
 {children}
 </button>
 )
}

interface TabsContentProps {
 value: string
 children: React.ReactNode
 className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
 const context = React.useContext(TabsContext)
 if (!context) throw new Error("TabsContent must be used within Tabs")

 if (context.activeTab !== value) return null

 return (
 <div
 className={cn(
 "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
 className
 )}
 >
 {children}
 </div>
 )
}
