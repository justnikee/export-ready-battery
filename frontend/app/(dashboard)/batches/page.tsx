"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { CreateBatchDialog } from "@/components/batches/create-batch-dialog"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight, Box } from "lucide-react"

interface Batch {
    id: string
    batch_name: string
    created_at: string
    specs: any
}

export default function BatchesPage() {
    const { user } = useAuth()
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBatches = async () => {
        if (!user) return
        try {
            const response = await api.get(`/batches?tenant_id=${user.tenant_id}`)
            setBatches(response.data.batches || [])
        } catch (error) {
            console.error("Failed to fetch batches:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBatches()
    }, [user])

    if (loading) {
        return <div className="p-8">Loading batches...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
                    <p className="text-muted-foreground">Manage your production batches</p>
                </div>
                <CreateBatchDialog onBatchCreated={fetchBatches} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {batches.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-muted-foreground">
                        No batches found. Create your first batch to get started.
                    </div>
                ) : (
                    batches.map((batch) => (
                        <Card key={batch.id} className="hover:bg-slate-50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">
                                    {batch.batch_name}
                                </CardTitle>
                                <Box className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground mt-2">
                                    Created {format(new Date(batch.created_at), 'MMM d, yyyy')}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Link href={`/batches/${batch.id}`}>
                                        <Button variant="outline" size="sm">
                                            View Details
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
