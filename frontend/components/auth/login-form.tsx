"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, RefreshCw } from "lucide-react"
import { authApi } from "@/lib/auth-api"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

export function LoginForm() {
    const { login } = useAuth()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    // Track when server tells us email isn't verified
    const [emailNotVerified, setEmailNotVerified] = useState(false)
    const [isResending, setIsResending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setEmailNotVerified(false)

        try {
            const response = await authApi.login(email, password)

            if (response.error) {
                // Special gate: email not yet verified
                if (response.code === "email_not_verified") {
                    setEmailNotVerified(true)
                    return
                }
                toast.error(response.error)
                return
            }

            toast.success("Welcome back!")

            // Use AuthContext login — sets token, cookie, fetches full user, and navigates.
            // Awaiting ensures the loading spinner stays visible until navigation begins.
            const redirectTo = searchParams.get("redirect") || "/dashboard"
            await login(response.token, {
                id: response.tenant_id,
                tenant_id: response.tenant_id,
                email: response.email,
                company_name: response.company_name,
            }, redirectTo)
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendVerification = async () => {
        setIsResending(true)
        try {
            await authApi.resendVerification(email)
            toast.success("Verification email sent! Check your inbox.")
        } catch {
            toast.error("Failed to resend. Please try again.")
        } finally {
            setIsResending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#0B1F3B]">
                    Email address
                </Label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#1F7A5F] transition-colors">
                        <Mail className="h-5 w-5" />
                    </div>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@yourcompany.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailNotVerified(false) }}
                        required
                        className="pl-10 h-12 bg-white border-zinc-300 text-[#0B1F3B] placeholder:text-zinc-400 focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
                    />
                </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-[#0B1F3B]">
                        Password
                    </Label>
                    <Link
                        href="/forgot-password"
                        className="text-sm text-[#1F7A5F] hover:text-[#0B1F3B] transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#1F7A5F] transition-colors">
                        <Lock className="h-5 w-5" />
                    </div>
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-12 bg-white border-zinc-300 text-[#0B1F3B] placeholder:text-zinc-400 focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#0B1F3B] transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Email not verified banner */}
            {emailNotVerified && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-amber-800">
                            Please verify your email first
                        </p>
                        <p className="text-xs text-amber-700">
                            Check your inbox for a verification link. If you didn&apos;t receive it, click below.
                        </p>
                        <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 disabled:opacity-60"
                        >
                            {isResending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Resend verification email
                        </button>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#0B1F3B] hover:bg-[#0B1F3B]/90 text-white font-semibold transition-all duration-200 rounded-none"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                    </>
                ) : (
                    "Sign in"
                )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-50 px-2 text-zinc-400">
                        or continue with
                    </span>
                </div>
            </div>

            {/* Social Login */}
            <div>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-zinc-300 hover:bg-zinc-100 text-[#0B1F3B] rounded-none"
                    onClick={() => {
                        const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1').replace('/api/v1', '')
                        window.location.href = `${apiBase}/api/v1/auth/google`
                    }}
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </Button>
            </div>
        </form>
    )
}
