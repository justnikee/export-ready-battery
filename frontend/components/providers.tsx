"use client"

import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <QueryProvider>
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </QueryProvider>
        </ThemeProvider>
    )
}
