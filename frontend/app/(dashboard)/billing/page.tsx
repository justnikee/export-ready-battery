"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Zap, Crown, Clock, ArrowUpRight, ArrowDownLeft, CreditCard, CheckCircle } from "lucide-react"
import { toast } from "sonner"

// Declare Razorpay type for TypeScript
declare global {
    interface Window {
        Razorpay: any
    }
}

interface Transaction {
    id: string
    description: string
    quota_change: number
    batch_id?: string
    created_at: string
}

interface Package {
    id: string
    name: string
    quota_units: number
    price_paise: number
    price_inr: number
    description: string
}

const packages: Package[] = [
    {
        id: "starter",
        name: "Starter License",
        quota_units: 10,
        price_paise: 499900,
        price_inr: 4999,
        description: "10 Batch Activations",
    },
    {
        id: "growth",
        name: "Growth License",
        quota_units: 50,
        price_paise: 1999900,
        price_inr: 19999,
        description: "50 Batch Activations",
    },
]

export default function BillingPage() {
    const { user, refreshUser } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState<string | null>(null)

    const quotaBalance = user?.quota_balance ?? 0

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            const response = await api.get("/billing/transactions")
            setTransactions(response.data.transactions || [])
        } catch (error) {
            console.error("Failed to fetch transactions:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleBuyPackage = async (pkg: Package) => {
        setPurchasing(pkg.id)

        try {
            // Step 1: Create Razorpay order
            const orderResponse = await api.post("/billing/razorpay/order", {
                package_id: pkg.id
            })

            const { order_id, key_id, amount } = orderResponse.data

            // Step 2: Open Razorpay checkout modal
            const options = {
                key: key_id,
                amount: amount,
                currency: "INR",
                name: "ExportReady Battery",
                description: pkg.description,
                order_id: order_id,
                handler: async function (response: any) {
                    // Step 3: Verify payment on backend
                    try {
                        const verifyResponse = await api.post("/billing/razorpay/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            package_id: pkg.id
                        })

                        if (verifyResponse.data.success) {
                            toast.success(`Payment successful! Added ${pkg.quota_units} quota units.`)
                            await refreshUser()
                            await fetchTransactions()
                        }
                    } catch (error: any) {
                        console.error("Payment verification failed:", error)
                        toast.error("Payment verification failed. Please contact support.")
                    }
                },
                prefill: {
                    email: user?.email || "",
                    contact: ""
                },
                theme: {
                    color: "#10B981" // Emerald green
                },
                modal: {
                    ondismiss: function () {
                        setPurchasing(null)
                    }
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()

        } catch (error: any) {
            console.error("Failed to create order:", error)
            toast.error("Failed to initiate payment. Please try again.")
        } finally {
            setPurchasing(null)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Billing</h1>
                <p className="text-muted-foreground">Manage your quota and purchase licenses</p>
            </div>

            {/* Current Balance */}
            <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-full ${quotaBalance < 2 ? 'bg-red-100' : 'bg-green-100'}`}>
                            <Coins className={`h-8 w-8 ${quotaBalance < 2 ? 'text-red-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                            <p className="text-4xl font-bold">{quotaBalance} Quota</p>
                        </div>
                    </div>
                    {quotaBalance < 2 && (
                        <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            ⚠️ Low quota! Purchase a license to continue activating batches.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        How Licensing Works
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="text-sm text-zinc-400 space-y-2">
                        <li>✓ Create batches for <span className="text-white font-medium">FREE</span> (Draft Mode)</li>
                        <li>✓ Activate a batch to unlock downloads (uses 1 quota)</li>
                        <li>✓ Each quota = 1 batch activation</li>
                        <li>✓ Payments are secured by Razorpay</li>
                    </ul>
                </CardContent>
            </Card>

            {/* Pricing Cards */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Purchase License
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {packages.map((pkg, index) => (
                        <Card
                            key={pkg.id}
                            className={`relative ${index === 1 ? 'border-2 border-primary shadow-lg' : ''}`}
                        >
                            {index === 1 && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                                        Best Value
                                    </span>
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        {index === 0 ? <Zap className="h-6 w-6 text-primary" /> : <Crown className="h-6 w-6 text-primary" />}
                                    </div>
                                    <div>
                                        <CardTitle>{pkg.name}</CardTitle>
                                        <CardDescription>{pkg.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-3xl font-bold">₹{pkg.price_inr.toLocaleString("en-IN")}</span>
                                        <span className="text-muted-foreground ml-2">for {pkg.quota_units} batches</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        ₹{Math.round(pkg.price_inr / pkg.quota_units)} per batch activation
                                    </p>
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        variant={index === 1 ? "default" : "outline"}
                                        onClick={() => handleBuyPackage(pkg)}
                                        disabled={purchasing !== null}
                                    >
                                        {purchasing === pkg.id ? "Processing..." : "Buy Now"}
                                    </Button>
                                    <p className="text-xs text-center text-zinc-500">
                                        Secured by Razorpay
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Transaction History */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                <Card>
                    <CardContent className="pt-6">
                        {loading ? (
                            <p className="text-center text-muted-foreground py-8">Loading...</p>
                        ) : transactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tx.quota_change > 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                                                {tx.quota_change > 0 ? (
                                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <ArrowDownLeft className="h-4 w-4 text-orange-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{tx.description}</p>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatDate(tx.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`font-semibold ${tx.quota_change > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                            {tx.quota_change > 0 ? '+' : ''}{tx.quota_change}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
