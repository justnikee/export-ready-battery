"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Building2, User, Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import { authApi } from "@/lib/auth-api"
import { toast } from "sonner"

export function RegisterForm() {
    const router = useRouter()
    const [companyName, setCompanyName] = useState("")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordFocused, setPasswordFocused] = useState(false)

    // Password requirements
    const passwordRequirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "One uppercase letter", met: /[A-Z]/.test(password) },
        { label: "One lowercase letter", met: /[a-z]/.test(password) },
        { label: "One number", met: /\d/.test(password) },
    ]

    const allRequirementsMet = passwordRequirements.every(req => req.met)
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!allRequirementsMet) {
            toast.error("Please meet all password requirements")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        setIsLoading(true)

        try {
            const response = await authApi.register({
                email,
                password,
                company_name: companyName,
                full_name: fullName,
            })

            if (response.error) {
                toast.error(response.error)
                return
            }

            toast.success("Account created successfully!")
            router.push("/dashboard")
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium text-[#0B1F3B]">
                    Company name
                </Label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1F7A5F] transition-colors">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <Input
                        id="company"
                        placeholder="Acme Battery Co."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="pl-10 h-12 bg-white border-slate-300 text-[#0B1F3B] placeholder:text-slate-400 focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
                    />
                </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-[#0B1F3B]">
                    Full name
                </Label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1F7A5F] transition-colors">
                        <User className="h-5 w-5" />
                    </div>
                    <Input
                        id="fullName"
                        placeholder="John Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="pl-10 h-12 bg-white border-slate-300 text-[#0B1F3B] placeholder:text-slate-400 focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
                    />
                </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#0B1F3B]">
                    Work email
                </Label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1F7A5F] transition-colors">
                        <Mail className="h-5 w-5" />
                    </div>
                    <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 bg-white border-slate-300 text-[#0B1F3B] placeholder:text-slate-400 focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
                    />
                </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#0B1F3B]">
                    Password
                </Label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1F7A5F] transition-colors">
                        <Lock className="h-5 w-5" />
                    </div>
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        required
                        className="pl-10 pr-10 h-12 bg-white border-slate-300 text-[#0B1F3B] placeholder:text-slate-400 focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1F3B] transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                </div>

                {/* Password Requirements */}
                {(passwordFocused || password.length > 0) && (
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 mb-2">Password requirements:</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {passwordRequirements.map((req, index) => (
                                <div key={index} className="flex items-center gap-1.5">
                                    {req.met ? (
                                        <Check className="h-3.5 w-3.5 text-[#1F7A5F]" />
                                    ) : (
                                        <X className="h-3.5 w-3.5 text-slate-300" />
                                    )}
                                    <span className={`text-xs ${req.met ? "text-[#1F7A5F]" : "text-slate-400"}`}>
                                        {req.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#0B1F3B]">
                    Confirm password
                </Label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1F7A5F] transition-colors">
                        <Lock className="h-5 w-5" />
                    </div>
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-12 bg-white border-slate-300 text-[#0B1F3B] placeholder:text-slate-400 focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1F3B] transition-colors"
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                </div>
                {confirmPassword.length > 0 && (
                    <p className={`text-xs ${passwordsMatch ? "text-[#1F7A5F]" : "text-red-500"}`}>
                        {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
                    </p>
                )}
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-500">
                By creating an account, you agree to our{" "}
                <a href="/terms" className="text-[#1F7A5F] hover:text-[#0B1F3B] underline">
                    Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-[#1F7A5F] hover:text-[#0B1F3B] underline">
                    Privacy Policy
                </a>
                .
            </p>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                className="w-full h-12 bg-[#0B1F3B] hover:bg-[#0B1F3B]/90 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
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
        </form>
    )
}
