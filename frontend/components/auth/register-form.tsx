"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

export function RegisterForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()

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

            toast.success("Registered successfully")
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to register")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-[350px] bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
                <CardTitle>Register</CardTitle>
                <CardDescription>Create a new account for your company.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="company">Company Name</Label>
                            <Input
                                id="company"
                                placeholder="Acme Corp"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Register"}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
