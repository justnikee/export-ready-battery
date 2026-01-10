"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UploadCSV } from "@/components/batches/upload-csv"
import { ArrowLeft, Download, QrCode, FileSpreadsheet } from "lucide-react"

export default function BatchDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [batch, setBatch] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchBatch = async () => {
        try {
            const response = await api.get(`/batches/${params.id}`)
            setBatch(response.data.batch)
        } catch (error) {
            console.error("Failed to fetch batch:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBatch()
    }, [params.id])

    const handleDownloadQR = () => {
        // Trigger direct download
        // We use window.open or hidden link because it's a file download derived from auth
        // Since our API requires Auth header, a simple link won't work unless we use a cookie or token in URL.
        // For now, we'll fetch the blob using Axios.

        const download = async () => {
            try {
                const response = await api.get(`/batches/${params.id}/download`, {
                    responseType: 'blob'
                })

                // Create url
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${batch.batch_name}_qrcodes.zip`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (error) {
                console.error("Failed to download QR codes", error)
                alert("Failed to download QR codes")
            }
        }
        download()
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (!batch) return <div className="p-8">Batch not found</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{batch.batch_name}</h1>
                    <p className="text-muted-foreground text-sm">Created on {new Date(batch.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Batch Specifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                {Object.entries(batch.specs || {}).map(([key, value]: [string, any]) => (
                                    <div key={key}>
                                        <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                                        <dd className="font-medium">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5" />
                                Upload Data
                            </CardTitle>
                            <CardDescription>
                                Upload a CSV file containing passport data for this batch.
                                Unique Serial Numbers required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UploadCSV batchId={batch.id} onUploadComplete={fetchBatch} />
                        </CardContent>
                    </Card>
                </div>

                {/* Actions Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full" onClick={handleDownloadQR} variant="outline">
                                <QrCode className="mr-2 h-4 w-4" />
                                Download QR Codes
                            </Button>
                            <Button className="w-full" variant="secondary" disabled>
                                Generate Report (Coming Soon)
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-blue-900">Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-700">
                                {/* We can fetch count separately or add to batch endpoint */}
                                {/* For now, just a placeholder or need to refactor API to return count */}
                                --
                            </div>
                            <p className="text-xs text-blue-600 mt-1">Total Passports Generated</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
