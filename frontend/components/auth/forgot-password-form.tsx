"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "./auth-layout"
import api from "@/lib/api"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await api.post("/auth/forgot-password", { email })
            setIsSubmitted(true)
            toast.success("Reset instructions sent to your email")
        } catch (error: unknown) {
            // Always show success for security (don't reveal if email exists)
            setIsSubmitted(true)
            toast.success("If the email exists, reset instructions will be sent")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <AuthLayout
                title="Check your email"
                subtitle="We've sent password reset instructions"
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

                    <div className="space-y-2">
                        <p className="text-slate-300">
                            If an account exists for <span className="font-medium text-white">{email}</span>,
                            you'll receive an email with instructions to reset your password.
                        </p>
                        <p className="text-slate-500 text-sm">
                            Didn't receive an email? Check your spam folder or try again.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => setIsSubmitted(false)}
                            variant="outline"
                            className="w-full h-11 bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800"
                        >
                            Try another email
                        </Button>

                        <Link href="/login" className="w-full">
                            <Button
                                variant="ghost"
                                className="w-full h-11 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Forgot password?"
            subtitle="Enter your email and we'll send you reset instructions"
            type="login"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                        Email address
                    </Label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 h-12 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send reset instructions"
                        )}
                    </Button>
                </motion.div>

                {/* Back to login */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm text-teal-400 hover:text-teal-300 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Link>
                </motion.div>
            </form>
        </AuthLayout>
    )
}
