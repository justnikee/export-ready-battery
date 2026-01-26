"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "./auth-layout"
import api from "@/lib/api"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Password strength checks
    const passwordChecks = {
        minLength: password.length >= 8,
        hasNumber: /\d/.test(password),
        hasLetter: /[a-zA-Z]/.test(password),
    }
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token")
        }
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!passwordChecks.minLength) {
            toast.error("Password must be at least 8 characters")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await api.post("/auth/reset-password", {
                token,
                new_password: password
            })
            setIsSuccess(true)
            toast.success("Password reset successfully!")
            // Redirect to login after 2 seconds
            setTimeout(() => router.push("/login"), 2000)
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || "Failed to reset password"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    if (error && !token) {
        return (
            <AuthLayout
                title="Invalid link"
                subtitle="This password reset link is invalid or has expired"
                type="login"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                >
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-400" />
                    </div>

                    <p className="text-slate-400">
                        Please request a new password reset link.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link href="/forgot-password" className="w-full">
                            <Button className="w-full h-11 bg-teal-600 hover:bg-teal-500 text-white">
                                Request new link
                            </Button>
                        </Link>
                        <Link href="/login" className="w-full">
                            <Button variant="ghost" className="w-full h-11 text-slate-400">
                                Back to login
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </AuthLayout>
        )
    }

    if (isSuccess) {
        return (
            <AuthLayout
                title="Password reset!"
                subtitle="Your password has been successfully updated"
                type="login"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                >
                    <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-emerald-400" />
                    </div>

                    <p className="text-slate-300">
                        Redirecting you to login...
                    </p>

                    <Link href="/login" className="w-full">
                        <Button className="w-full h-11 bg-teal-600 hover:bg-teal-500 text-white">
                            Continue to login
                        </Button>
                    </Link>
                </motion.div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="Enter your new password below"
            type="login"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password Field */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                        New Password
                    </Label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pl-10 pr-10 h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Password strength indicators */}
                    {password.length > 0 && (
                        <div className="space-y-1 mt-2">
                            <div className={`flex items-center gap-2 text-xs ${passwordChecks.minLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {passwordChecks.minLength ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                At least 8 characters
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${passwordChecks.hasLetter ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {passwordChecks.hasLetter ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                Contains a letter
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${passwordChecks.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {passwordChecks.hasNumber ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                Contains a number
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                >
                    <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">
                        Confirm Password
                    </Label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="pl-10 pr-10 h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Password match indicator */}
                    {confirmPassword.length > 0 && (
                        <div className={`flex items-center gap-2 text-xs ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                            {passwordsMatch ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </div>
                    )}
                </motion.div>

                {/* Error display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Submit Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        type="submit"
                        disabled={isLoading || !passwordsMatch || !passwordChecks.minLength}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            "Reset password"
                        )}
                    </Button>
                </motion.div>
            </form>
        </AuthLayout>
    )
}
