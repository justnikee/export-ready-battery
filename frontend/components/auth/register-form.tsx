"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "./auth-layout"
import api from "@/lib/api"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Mail, Lock, Building2, Loader2, Eye, EyeOff, Check, X } from "lucide-react"

export function RegisterForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login } = useAuth()

    // Password validation
    const passwordChecks = [
        { label: "At least 8 characters", valid: password.length >= 8 },
        { label: "Contains a number", valid: /\d/.test(password) },
        { label: "Contains uppercase", valid: /[A-Z]/.test(password) },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await api.post("/auth/register", {
                email,
                password,
                company_name: companyName,
            })

            const { token, refresh_token, tenant_id } = response.data

            login(token, refresh_token, {
                tenant_id,
                email,
                company_name: companyName,
            })

            toast.success("Account created successfully!")
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to register")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Register Organization"
            subtitle="Streamline your battery compliance and labeling today"
            type="register"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Company Name Field */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <Label htmlFor="company" className="text-zinc-300 text-sm font-medium">
                        Company name
                    </Label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Building2 className="h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <Input
                            id="company"
                            placeholder="Acme Battery Co."
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                        />
                    </div>
                </motion.div>

                {/* Email Field */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                >
                    <Label htmlFor="email" className="text-zinc-300 text-sm font-medium">
                        Work email
                    </Label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 h-12 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                        />
                    </div>
                </motion.div>

                {/* Password Field */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                >
                    <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">
                        Password
                    </Label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="pl-10 pr-10 h-12 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Password Requirements */}
                    {password.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="pt-2 space-y-1"
                        >
                            {passwordChecks.map((check, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    {check.valid ? (
                                        <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <X className="h-3 w-3 text-zinc-600" />
                                    )}
                                    <span className={check.valid ? "text-green-500" : "text-zinc-500"}>
                                        {check.label}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

                {/* Submit Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="pt-2"
                >
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create account"
                        )}
                    </Button>
                </motion.div>

                {/* Terms */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-center text-zinc-500"
                >
                    By creating an account, you agree to our{" "}
                    <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
                        Privacy Policy
                    </a>
                </motion.p>
            </form>
        </AuthLayout>
    )
}
