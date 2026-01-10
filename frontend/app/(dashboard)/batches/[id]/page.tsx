"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UploadCSV } from "@/components/batches/upload-csv"
import { ArrowLeft, Download, QrCode, FileSpreadsheet } from "lucide-react"

import { PassportList } from "@/components/batches/passport-list"

export default function BatchDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [batch, setBatch] = useState<any>(null)
    const [passportCount, setPassportCount] = useState<number>(0)
    const [passports, setPassports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchBatch = async () => {
        try {
            const response = await api.get(`/batches/${params.id}`)
            setBatch(response.data.batch)
            setPassportCount(response.data.passport_count || 0)
        } catch (error) {
            console.error("Failed to fetch batch:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPassports = async () => {
        try {
            const response = await api.get(`/batches/${params.id}/passports`)
            setPassports(response.data.passports || [])
        } catch (error) {
            console.error("Failed to fetch passports:", error)
        }
    }

    useEffect(() => {
        fetchBatch()
        fetchPassports()
    }, [params.id])

    const handleUploadComplete = () => {
        fetchBatch()
        fetchPassports()
    }

    const handleDownloadQR = () => {
        const download = async () => {
            try {
                const response = await api.get(`/batches/${params.id}/download`, {
                    responseType: 'blob'
                })

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
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
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
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                                <div>
                                    <dt className="text-muted-foreground mb-1">Manufacturer</dt>
                                    <dd className="font-medium">{batch.specs.manufacturer || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Chemistry</dt>
                                    <dd className="font-medium">{batch.specs.chemistry || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Capacity</dt>
                                    <dd className="font-medium">{batch.specs.capacity || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Voltage</dt>
                                    <dd className="font-medium">{batch.specs.voltage || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Weight</dt>
                                    <dd className="font-medium">{batch.specs.weight || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Carbon Footprint</dt>
                                    <dd className="font-medium">{batch.specs.carbon_footprint || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Country of Origin</dt>
                                    <dd className="font-medium">{batch.specs.country_of_origin || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground mb-1">Recyclable</dt>
                                    <dd className="font-medium">
                                        {batch.specs.recyclable ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                No
                                            </span>
                                        )}
                                    </dd>
                                </div>
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
                            <UploadCSV batchId={batch.id} onUploadComplete={handleUploadComplete} />
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
                                {passportCount}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">Total Passports Generated</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Passports List Table */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold tracking-tight mb-4">Generated Passports</h2>
                <PassportList passports={passports} />
            </div>
        </div>
    )
}
