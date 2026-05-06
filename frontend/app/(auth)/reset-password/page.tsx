"use client"

import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Loader2 } from "lucide-react"

function ResetPasswordContent() {
 return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
 return (
 <Suspense fallback={
 <div className="min-h-screen flex items-center justify-center bg-background">
 <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
 </div>
 }>
 <ResetPasswordContent />
 </Suspense>
 )
}
