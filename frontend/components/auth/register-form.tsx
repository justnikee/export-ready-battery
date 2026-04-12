"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Building2, Loader2, Eye, EyeOff, Check, X, MailCheck } from "lucide-react"
import { authApi } from "@/lib/auth-api"
import { toast } from "sonner"

export function RegisterForm() {
 const [companyName, setCompanyName] = useState("")
 const [email, setEmail] = useState("")
 const [password, setPassword] = useState("")
 const [confirmPassword, setConfirmPassword] = useState("")
 const [isLoading, setIsLoading] = useState(false)
 const [showPassword, setShowPassword] = useState(false)
 const [showConfirmPassword, setShowConfirmPassword] = useState(false)
 const [passwordFocused, setPasswordFocused] = useState(false)
 const [tosAccepted, setTosAccepted] = useState(false)
 // After successful registration, show verify-email screen
 const [registered, setRegistered] = useState(false)

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

 if (!tosAccepted) {
 toast.error("Please accept the Terms of Service and Privacy Policy to continue")
 return
 }

 setIsLoading(true)

 try {
 const response = await authApi.register({
 email,
 password,
 company_name: companyName,
 })

 if (response.error) {
 toast.error(response.error)
 return
 }

 // 202 — server sends verification email, no tokens yet
 setRegistered(true)
 } catch {
 toast.error("Something went wrong. Please try again.")
 } finally {
 setIsLoading(false)
 }
 }

 // ── Verify-email confirmation screen ───────────────────────────────────────
 if (registered) {
 return (
 <div className="flex flex-col items-center gap-5 py-4 text-center">
 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1F7A5F]/10">
 <MailCheck className="h-8 w-8 text-[#1F7A5F]" />
 </div>

 <div className="space-y-2">
 <h2 className="text-xl text-[#0B1F3B]">Check your email</h2>
 <p className="text-sm text-muted-foreground">
 We sent a verification link to{" "}
 <span className=" text-[#0B1F3B]">{email}</span>.
 <br />
 Click the link to activate your account and sign in.
 </p>
 </div>

 <div className="w-full rounded-lg border border-border bg-background p-4 text-left space-y-1">
 <p className="text-xs font-medium text-muted-foreground">Didn&apos;t get it?</p>
 <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
 <li>Check your spam / junk folder</li>
 <li>The link expires in 24 hours</li>
 </ul>
 <ResendButton email={email} />
 </div>
 </div>
 )
 }

 // ── Registration form ──────────────────────────────────────────────────────
 return (
 <form onSubmit={handleSubmit} className="space-y-4">
 {/* Company Name */}
 <div className="space-y-2">
 <Label htmlFor="company" className="text-sm font-medium text-[#0B1F3B]">
 Company / Manufacturer name
 </Label>
 <div className="relative group">
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#1F7A5F] transition-colors">
 <Building2 className="h-5 w-5" />
 </div>
 <Input
 id="company"
 placeholder="e.g. Luminex Energy Pvt. Ltd."
 value={companyName}
 onChange={(e) => setCompanyName(e.target.value)}
 required
 className="pl-10 h-12 bg-card border-border text-[#0B1F3B] placeholder:text-muted-foreground focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
 />
 </div>
 </div>

 {/* Email */}
 <div className="space-y-2">
 <Label htmlFor="email" className="text-sm font-medium text-[#0B1F3B]">
 Business email
 </Label>
 <div className="relative group">
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#1F7A5F] transition-colors">
 <Mail className="h-5 w-5" />
 </div>
 <Input
 id="email"
 type="email"
 placeholder="you@yourcompany.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 className="pl-10 h-12 bg-card border-border text-[#0B1F3B] placeholder:text-muted-foreground focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
 />
 </div>
 </div>

 {/* Password */}
 <div className="space-y-2">
 <Label htmlFor="password" className="text-sm font-medium text-[#0B1F3B]">
 Password
 </Label>
 <div className="relative group">
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#1F7A5F] transition-colors">
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
 className="pl-10 pr-10 h-12 bg-card border-border text-[#0B1F3B] placeholder:text-muted-foreground focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#0B1F3B] transition-colors"
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
 <div className="mt-3 p-3 bg-card border border-border rounded-lg">
 <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
 <div className="grid grid-cols-2 gap-1.5">
 {passwordRequirements.map((req, index) => (
 <div key={index} className="flex items-center gap-1.5">
 {req.met ? (
 <Check className="h-3.5 w-3.5 text-[#1F7A5F]" />
 ) : (
 <X className="h-3.5 w-3.5 text-muted-foreground" />
 )}
 <span className={`text-xs ${req.met ? "text-[#1F7A5F]" : "text-muted-foreground"}`}>
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
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#1F7A5F] transition-colors">
 <Lock className="h-5 w-5" />
 </div>
 <Input
 id="confirmPassword"
 type={showConfirmPassword ? "text" : "password"}
 placeholder="Confirm your password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 className="pl-10 pr-10 h-12 bg-card border-border text-[#0B1F3B] placeholder:text-muted-foreground focus:border-[#1F7A5F] focus:ring-[#1F7A5F]/20 transition-all rounded-none"
 />
 <button
 type="button"
 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#0B1F3B] transition-colors"
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

 {/* Terms — explicit consent required by GDPR Art.7 & India DPDP Act 2023 */}
 <div className="flex items-start gap-3">
 <Checkbox
 id="tos-accept"
 checked={tosAccepted}
 onCheckedChange={(checked) => setTosAccepted(checked === true)}
 className="mt-0.5 border-border data-[state=checked]:border-[#1F7A5F] data-[state=checked]:bg-[#1F7A5F]"
 />
 <label
 htmlFor="tos-accept"
 className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
 >
 I have read and agree to the{" "}
 <a
 href="/terms"
 target="_blank"
 rel="noopener noreferrer"
 className="text-[#1F7A5F] hover:text-[#0B1F3B] underline"
 onClick={(e) => e.stopPropagation()}
 >
 Terms of Service
 </a>
 {" "}and{" "}
 <a
 href="/privacy"
 target="_blank"
 rel="noopener noreferrer"
 className="text-[#1F7A5F] hover:text-[#0B1F3B] underline"
 onClick={(e) => e.stopPropagation()}
 >
 Privacy Policy
 </a>
 . <span className="text-red-500">*</span>
 </label>
 </div>

 {/* Submit Button */}
 <Button
 type="submit"
 disabled={isLoading || !allRequirementsMet || !passwordsMatch || !tosAccepted}
 className="w-full h-12 bg-[#0B1F3B] hover:bg-[#0B1F3B]/90 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
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

 {/* Divider */}
 <div className="relative my-6">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-border" />
 </div>
 <div className="relative flex justify-center text-xs uppercase">
 <span className="bg-background px-2 text-muted-foreground">
 or continue with
 </span>
 </div>
 </div>

 {/* Social Login */}
 <div>
 <Button
 type="button"
 variant="outline"
 className="w-full h-11 border-border hover:bg-accent text-[#0B1F3B] rounded-none"
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

// ── Small inline component for resend button ───────────────────────────────────
function ResendButton({ email }: { email: string }) {
 const [sent, setSent] = useState(false)
 const [loading, setLoading] = useState(false)

 const handleResend = async () => {
 setLoading(true)
 try {
 await authApi.resendVerification(email)
 setSent(true)
 } finally {
 setLoading(false)
 }
 }

 if (sent) {
 return <p className="mt-2 text-xs font-medium text-[#1F7A5F]">✓ Email sent again!</p>
 }

 return (
 <button
 type="button"
 onClick={handleResend}
 disabled={loading}
 className="mt-2 flex items-center gap-1 text-xs font-medium text-[#1F7A5F] underline underline-offset-2 hover:text-[#0B1F3B] disabled:opacity-60"
 >
 {loading && <Loader2 className="h-3 w-3 animate-spin" />}
 Resend verification email
 </button>
 )
}
