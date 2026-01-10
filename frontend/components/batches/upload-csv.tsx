"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import api from "@/lib/api"
import { Upload, X, FileText, CheckCircle, AlertTriangle } from "lucide-react"

interface UploadCSVProps {
    batchId: string
    onUploadComplete: () => void
}

export function UploadCSV({ batchId, onUploadComplete }: UploadCSVProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<any>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
            setProgress(0)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setProgress(10) // Start progress

        const formData = new FormData()
        formData.append("file", file)

        try {
            setProgress(40) // Reading file
            const response = await api.post(`/batches/${batchId}/upload`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
                    setProgress(Math.min(percentCompleted, 90)); // Cap at 90 until server responds
                }
            })

            setProgress(100)
            setResult(response.data)
            toast.success("CSV processed successfully")
            onUploadComplete()
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.error || "Failed to upload CSV")
            setResult({ error: error.response?.data?.error })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-4 rounded-lg border border-dashed p-6 text-center">
            {!file ? (
                <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Upload Passports CSV</h3>
                    <p className="text-sm text-muted-foreground">
                        Drag and drop your CSV file here, or click to browse
                    </p>
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id="csv-upload"
                        onChange={handleFileChange}
                    />
                    <Button asChild variant="secondary" className="mt-2">
                        <label htmlFor="csv-upload" className="cursor-pointer">
                            Select File
                        </label>
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div className="text-left">
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        {!isUploading && !result && (
                            <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {isUploading && (
                        <div className="space-y-2">
                            <Progress value={progress} />
                            <p className="text-xs text-muted-foreground text-center">Processing...</p>
                        </div>
                    )}

                    {!isUploading && !result && (
                        <Button onClick={handleUpload} className="w-full">
                            Upload and Process
                        </Button>
                    )}

                    {result && (
                        <div className="text-left rounded-md bg-slate-50 p-4 mt-2">
                            {result.error ? (
                                <div className="flex items-start gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Upload Failed</p>
                                        <p className="text-sm">{result.error}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-green-600 mb-2">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="font-medium">Processed Successfuly!</span>
                                    </div>
                                    <div className="text-sm grid grid-cols-2 gap-2 text-muted-foreground">
                                        <span>Passports Created:</span>
                                        <span className="font-mono text-black">{result.passports_count || result.result?.passports_count}</span>
                                        <span>Processing Time:</span>
                                        <span className="font-mono text-black">{result.processing_time || result.result?.processing_time}</span>
                                    </div>
                                    {result.warnings && result.warnings.length > 0 && (
                                        <div className="mt-3 border-t pt-2">
                                            <p className="text-xs font-semibold text-yellow-600 mb-1">Warnings ({result.warnings.length}):</p>
                                            <div className="max-h-24 overflow-y-auto text-xs text-slate-500 bg-white p-2 border rounded">
                                                {result.warnings.map((w: any, i: number) => (
                                                    <div key={i}>Row {w.row}: {w.error}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => setFile(null)} className="w-full mt-2">
                                        Upload Another
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
