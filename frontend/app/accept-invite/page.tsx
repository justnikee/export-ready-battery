"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function AcceptInviteContent() {
 const searchParams = useSearchParams()
 const token = searchParams.get("token")
 const router = useRouter()
 const hasToken = Boolean(token)
 const [status, setStatus] = useState<"loading" | "success" | "error">(hasToken ? "loading" : "error")
 const [message, setMessage] = useState(
 hasToken ? "Verifying invitation..." : "Invalid invitation link. Token is missing."
 )

 useEffect(() => {
 if (!token) return

 const acceptInvite = async () => {
 try {
 const response = await api.post("/team/accept", { token })

 // Check for 202 Accepted (Registration Required)
 if (response.status === 202) {
 const data = response.data
 setStatus("success")
 setMessage("Invitation valid. Redirecting to registration...")
 // Redirect to register with email and invite token
 setTimeout(() => {
 router.push(data.register_url || `/register?invite=${token}`)
 }, 2000)
 return
 }

 // 200 OK (Already a user, just linked)
 setStatus("success")
 setMessage("Invitation accepted! Redirecting to dashboard...")
 setTimeout(() => {
 router.push("/dashboard")
 }, 2000)

 } catch (error: unknown) {
 const apiError = error as { response?: { data?: { error?: string } } }
 setStatus("error")
 setMessage(apiError.response?.data?.error || "Failed to accept invitation. It may have expired.")
 }
 }

 acceptInvite()
 }, [token, router])

 return (
 <div className="container flex h-screen w-screen flex-col items-center justify-center">
 <Card className="w-full max-w-md">
 <CardHeader className="text-center">
 <CardTitle>Team Invitation</CardTitle>
 <CardDescription>
 Processing your invitation to join the team.
 </CardDescription>
 </CardHeader>
 <CardContent className="flex flex-col items-center justify-center space-y-4 p-8">
 {status === "loading" && (
 <>
 <Loader2 className="h-10 w-10 animate-spin text-primary" />
 <p className="text-sm text-muted-foreground">{message}</p>
 </>
 )}

 {status === "success" && (
 <>
 <CheckCircle2 className="h-10 w-10 text-[var(--brand)]" />
 <p className="text-sm font-medium">{message}</p>
 </>
 )}

 {status === "error" && (
 <>
 <AlertCircle className="h-10 w-10 text-destructive" />
 <p className="text-sm font-medium text-destructive">{message}</p>
 <Button
 variant="outline"
 className="mt-4"
 onClick={() => router.push("/login")}
 >
 Return to Login
 </Button>
 </>
 )}
 </CardContent>
 </Card>
 </div>
 )
}

export default function AcceptInvitePage() {
 return (
 <Suspense fallback={
 <div className="container flex h-screen w-screen flex-col items-center justify-center">
 <Loader2 className="h-10 w-10 animate-spin text-primary" />
 </div>
 }>
 <AcceptInviteContent />
 </Suspense>
 )
}
