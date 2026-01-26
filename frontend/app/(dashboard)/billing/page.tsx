"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { toast } from "sonner"
import { PricingCard } from "@/components/billing/pricing-card"
import { LiveBalanceBanner } from "@/components/billing/live-balance-banner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, ArrowUpRight, ArrowDownRight, Receipt, Loader2 } from "lucide-react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { formatDistanceToNow } from "date-fns"

// Declare Razorpay type for TypeScript
declare global {
    interface Window {
        Razorpay: any
    }
}

interface Package {
    id: string
    title: string
    price: string
    batchCount: number
    pricePerBatch: string
    features: string[]
    description: string
    isPopular?: boolean
    isEnterprise?: boolean
    quota_units?: number
}

interface Transaction {
    id: string
    tenant_id: string
    description: string
    quota_change: number  // Negative for usage, positive for top-up
    batch_id?: string
    created_at: string
}

// Default packages as fallback
const defaultPackages: Package[] = [
    {
        id: "starter",
        title: "Starter License",
        price: "₹4,999",
        batchCount: 10,
        pricePerBatch: "₹499",
        quota_units: 10,
        description: "Perfect for pilot runs and small scale manufacturing.",
        features: [
            "10 Batch Activations",
            "Standard PDF Label Generation",
            "India Compliance (EPR/BIS)",
            "Email Support",
            "Basic Analytics"
        ]
    },
    {
        id: "growth",
        title: "Growth License",
        price: "₹19,999",
        batchCount: 50,
        pricePerBatch: "₹399",
        quota_units: 50,
        isPopular: true,
        description: "For high-volume production and export compliance.",
        features: [
            "Everything in Starter",
            "50 Batch Activations",
            "Priority Label Generation",
            "Importer Mode (China/Korea)",
            "WhatsApp Priority Support"
        ]
    },
    {
        id: "enterprise",
        title: "Enterprise License",
        price: "Custom",
        batchCount: 200,
        pricePerBatch: "Contact Us",
        quota_units: 200,
        isEnterprise: true,
        description: "Industrial scale solution for large manufacturers.",
        features: [
            "Everything in Growth",
            "200+ Batch Activations",
            "Custom Label Formats",
            "Dedicated Account Manager",
            "API Access & Custom Integrations"
        ]
    }
]

const faqs = [
    {
        question: "Do quota credits expire?",
        answer: "No, your purchased batch activation licenses are valid forever. They never expire."
    },
    {
        question: "What defines a 'batch'?",
        answer: "A batch is defined as a single production run (up to 5,000 batteries) with unique manufacturing specifications."
    },
    {
        question: "Can I top up later?",
        answer: "Yes, you can purchase additional licenses at any time. They will be added to your existing balance immediately."
    }
]

// Transform API response to frontend Package interface
function transformApiPackage(apiPkg: any): Package {
    return {
        id: apiPkg.id,
        title: apiPkg.name || apiPkg.title,
        price: apiPkg.display_price || apiPkg.price,
        batchCount: apiPkg.quota || apiPkg.batchCount,
        pricePerBatch: apiPkg.price_per_batch || apiPkg.pricePerBatch,
        quota_units: apiPkg.quota || apiPkg.quota_units,
        description: apiPkg.description,
        features: apiPkg.features || [],
        isPopular: apiPkg.is_popular || apiPkg.isPopular,
        isEnterprise: apiPkg.is_enterprise || apiPkg.isEnterprise
    }
}

export default function BillingPage() {
    const { user, refreshUser } = useAuth()
    const [purchasing, setPurchasing] = useState<string | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(true)
    const [packages, setPackages] = useState<Package[]>(defaultPackages)
    const [loadingPackages, setLoadingPackages] = useState(true)

    useEffect(() => {
        fetchTransactions()
        fetchPackages()
    }, [])

    const fetchPackages = async () => {
        try {
            const response = await api.get("/billing/packages")
            if (response.data.packages && response.data.packages.length > 0) {
                const transformedPackages = response.data.packages.map(transformApiPackage)
                setPackages(transformedPackages)
            }
        } catch (error) {
            console.warn("Using default packages - API unavailable:", error)
            // Keep using default packages
        } finally {
            setLoadingPackages(false)
        }
    }

    const fetchTransactions = async () => {
        try {
            const response = await api.get("/billing/transactions")
            setTransactions(response.data.transactions || [])
        } catch (error) {
            console.error("Failed to fetch transactions:", error)
        } finally {
            setLoadingTransactions(false)

        }
    }

    const handleBuyPackage = async (pkg: Package) => {
        if (pkg.isEnterprise) {
            window.location.href = "mailto:sales@exportready.com?subject=Enterprise License Inquiry"
            return
        }

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
                            // Dispatch event to update balance banner
                            window.dispatchEvent(new Event('quota-updated'))
                            // Refresh transactions
                            fetchTransactions()
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

    const getTransactionIcon = (quotaChange: number) => {
        if (quotaChange > 0) {
            return <ArrowUpRight className="h-4 w-4 text-emerald-400" />
        }
        return <ArrowDownRight className="h-4 w-4 text-orange-400" />
    }

    const getTransactionColor = (quotaChange: number) => {
        if (quotaChange > 0) {
            return 'text-emerald-400'
        }
        return 'text-orange-400'
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Page Header */}
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-8 md:p-12">
                    <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Production Capacity</h1>
                        <p className="text-slate-400 text-lg">
                            Purchase licenses to activate batches and generate compliant labels.
                            Scale your manufacturing with our flexible quota system.
                        </p>
                    </div>
                </div>

                {/* Live Balance */}
                <LiveBalanceBanner />

                {/* Transaction History */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Transaction History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingTransactions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No transactions yet. Purchase a license to get started.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {transactions.slice(0, 10).map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                                                {getTransactionIcon(tx.quota_change)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">{tx.description}</p>
                                                <p className="text-xs text-slate-500">
                                                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${getTransactionColor(tx.quota_change)}`}>
                                                {tx.quota_change > 0 ? '+' : ''}{tx.quota_change} units
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>


                {/* Pricing Grid */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {packages.map((pkg) => (
                        <PricingCard
                            key={pkg.id}
                            {...pkg}
                            loading={purchasing === pkg.id}
                            onAction={() => handleBuyPackage(pkg)}
                            actionLabel={pkg.isEnterprise ? "Contact Sales" : "Buy License"}
                        />
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="pt-10 border-t border-slate-800">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                <HelpCircle className="h-6 w-6 text-slate-500" />
                                Frequently Asked Questions
                            </h2>
                        </div>
                        <Accordion className="w-full">
                            {faqs.map((faq, i) => (
                                <AccordionItem key={i} value={`item-${i}`}>
                                    <AccordionTrigger className="text-slate-200">{faq.question}</AccordionTrigger>
                                    <AccordionContent>
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
    )
}

