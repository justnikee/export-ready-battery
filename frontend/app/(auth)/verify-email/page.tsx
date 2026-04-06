"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, MailCheck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

type Status = "verifying" | "success" | "error"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<Status>("verifying")
    const [message, setMessage] = useState("")

    useEffect(() => {
        const token = searchParams.get("token")
        if (!token) {
            setStatus("error")
            setMessage("No verification token found in the link.")
            return
        }

        api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then(() => setStatus("success"))
            .catch((err: unknown) => {
                const axiosErr = err as { response?: { data?: { error?: string } } }
                setStatus("error")
                setMessage(
                    axiosErr.response?.data?.error ||
                    "This verification link has expired or is invalid."
                )
            })
    }, [searchParams])

    if (status === "verifying") {
        return (
            <div className="flex flex-col items-center gap-4 text-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-[#1F7A5F]" />
                <p className="text-sm text-zinc-600">Verifying your email…</p>
            </div>
        )
    }

    if (status === "success") {
        return (
            <div className="flex flex-col items-center gap-5 text-center py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1F7A5F]/10">
                    <MailCheck className="h-8 w-8 text-[#1F7A5F]" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-[#0B1F3B]">Email verified!</h2>
                    <p className="text-sm text-zinc-600">
                        Your account is now active. You can sign in anytime.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/login")}
                    className="h-11 w-full bg-[#0B1F3B] hover:bg-[#0B1F3B]/90 text-white font-semibold rounded-none"
                >
                    Go to Sign in
                </Button>
            </div>
        )
    }

    // error
    return (
        <div className="flex flex-col items-center gap-5 text-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#0B1F3B]">Verification failed</h2>
                <p className="text-sm text-zinc-600">{message}</p>
            </div>
            <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="h-11 w-full border-zinc-300 text-[#0B1F3B] rounded-none"
            >
                Back to Sign in
            </Button>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <div className="mx-auto max-w-sm space-y-6 pt-12 px-4">
            <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold text-[#0B1F3B]">Email Verification</h1>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <Suspense fallback={
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1F7A5F]" />
                    </div>
                }>
                    <VerifyEmailContent />
                </Suspense>
            </div>
        </div>
    )
}
