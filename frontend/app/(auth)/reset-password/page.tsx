"use client"

import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

function ResetPasswordContent() {
    return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
