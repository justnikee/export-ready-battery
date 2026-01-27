"use client"

import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/providers/query-provider"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <AuthProvider>
                {children}
                <Toaster />
            </AuthProvider>
        </QueryProvider>
    )
}
