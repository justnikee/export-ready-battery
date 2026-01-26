"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import api from "@/lib/api"
import {
    Upload,
    X,
    FileText,
    CheckCircle,
    AlertTriangle,
    Download,
    Zap,
    AlertCircle
} from "lucide-react"

interface UploadCSVProps {
    batchId: string
    marketRegion?: 'INDIA' | 'EU' | 'GLOBAL'
    onUploadComplete: () => void
}

interface ValidationResult {
    valid_count: number
    total_rows: number
    duplicates: Array<{
        serial_number: string
        existing_batch: string
    }>
    duplicate_count: number
    errors: Array<{
        row: number
        message: string
    }>
    error_count: number
    ready_to_import: boolean
}

export function UploadCSV({ batchId, marketRegion = 'GLOBAL', onUploadComplete }: UploadCSVProps) {
    // CSV Upload State
    const [file, setFile] = useState<File | null>(null)
    const [isValidating, setIsValidating] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
    const [uploadResult, setUploadResult] = useState<any>(null)

    // Auto-Generate State - Default prefix based on market region
    const defaultPrefix = marketRegion === 'INDIA' ? 'IN-MFG-LFP-2026-' : marketRegion === 'EU' ? 'EU-BAT-2026-' : 'BAT-2026-'
    const [quantity, setQuantity] = useState("100")
    const [prefix, setPrefix] = useState(defaultPrefix)
    const [startNumber, setStartNumber] = useState("1")
    const [manufactureDate, setManufactureDate] = useState(new Date().toISOString().split('T')[0])
    const [isGenerating, setIsGenerating] = useState(false)
    const [generateResult, setGenerateResult] = useState<any>(null)

    // Computed preview
    const previewStart = `${prefix}${String(parseInt(startNumber) || 1).padStart(3, '0')}`
    const previewEnd = `${prefix}${String((parseInt(startNumber) || 1) + (parseInt(quantity) || 1) - 1).padStart(3, '0')}`

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setValidationResult(null)
            setUploadResult(null)
            setProgress(0)
        }
    }

    const handleDownloadSample = async () => {
        try {
            // Pass market region to get appropriate sample format
            const response = await api.get(`/sample-csv?market=${marketRegion}`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `sample_passports_${marketRegion.toLowerCase()}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success(`Sample ${marketRegion} CSV downloaded`)
        } catch (error) {
            toast.error("Failed to download sample CSV")
        }
    }

    const handleValidate = async () => {
        if (!file) return

        setIsValidating(true)
        setProgress(20)

        const formData = new FormData()
        formData.append("file", file)

        try {
            setProgress(50)
            const response = await api.post(`/batches/${batchId}/validate`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            setProgress(100)
            setValidationResult(response.data)
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Validation failed")
            setFile(null)
        } finally {
            setIsValidating(false)
        }
    }

    const handleConfirmUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setProgress(10)

        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await api.post(`/batches/${batchId}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100))
                    setProgress(Math.min(percentCompleted, 90))
                }
            })

            setProgress(100)
            setUploadResult(response.data)
            toast.success("Passports imported successfully")
            onUploadComplete()
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const handleAutoGenerate = async () => {
        const count = parseInt(quantity)
        const start = parseInt(startNumber)

        if (isNaN(count) || count <= 0 || count > 10000) {
            toast.error("Quantity must be between 1 and 10,000")
            return
        }

        setIsGenerating(true)
        try {
            const response = await api.post(`/batches/${batchId}/auto-generate`, {
                count,
                prefix,
                start_number: start,
                manufacture_date: manufactureDate
            })

            setGenerateResult(response.data)
            toast.success(`Generated ${response.data.passports_created} passports`)
            onUploadComplete()
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Generation failed")
        } finally {
            setIsGenerating(false)
        }
    }

    const resetCSV = () => {
        setFile(null)
        setValidationResult(null)
        setUploadResult(null)
        setProgress(0)
    }

    const resetAutoGen = () => {
        setGenerateResult(null)
        setQuantity("100")
        setPrefix("BAT-2026-")
        setStartNumber("1")
    }

    return (
        <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                </TabsTrigger>
                <TabsTrigger value="auto">
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-Generate
                </TabsTrigger>
            </TabsList>

            {/* CSV Upload Tab */}
            <TabsContent value="csv">
                <div className="space-y-4 rounded-lg border border-dashed p-6">
                    {!file ? (
                        <div className="flex flex-col items-center gap-2 text-center">
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

                            {/* Sample CSV Download Link */}
                            <button
                                onClick={handleDownloadSample}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3"
                            >
                                <Download className="h-4 w-4" />
                                Download Sample CSV Template
                            </button>
                        </div>
                    ) : !validationResult && !uploadResult ? (
                        <div className="flex flex-col gap-4">
                            {/* File Info */}
                            <div className="flex items-center justify-between rounded-md border p-3">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-blue-500" />
                                    <div className="text-left">
                                        <p className="font-medium text-sm">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                                {!isValidating && (
                                    <Button variant="ghost" size="icon" onClick={resetCSV}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {isValidating && (
                                <div className="space-y-2">
                                    <Progress value={progress} />
                                    <p className="text-sm text-muted-foreground text-center">
                                        Validating records...
                                    </p>
                                </div>
                            )}

                            {!isValidating && (
                                <Button onClick={handleValidate} className="w-full">
                                    Validate & Preview
                                </Button>
                            )}
                        </div>
                    ) : validationResult && !uploadResult ? (
                        // Validation Summary Card
                        <div className="space-y-4">
                            {validationResult.ready_to_import ? (
                                // Success State
                                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="font-semibold text-green-800">Ready to Import</p>
                                            <p className="text-sm text-green-700">
                                                {validationResult.valid_count} valid passports found
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleConfirmUpload} disabled={isUploading} className="flex-1">
                                            {isUploading ? "Importing..." : "Confirm & Import"}
                                        </Button>
                                        <Button variant="outline" onClick={resetCSV}>
                                            Cancel
                                        </Button>
                                    </div>
                                    {isUploading && <Progress value={progress} className="mt-3" />}
                                </div>
                            ) : (
                                // Issues Found State
                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                                        <div>
                                            <p className="font-semibold text-amber-800">Issues Found</p>
                                            <p className="text-sm text-amber-700">
                                                {validationResult.duplicate_count} duplicates, {validationResult.error_count} errors
                                            </p>
                                        </div>
                                    </div>

                                    {/* Error Table */}
                                    <div className="max-h-40 overflow-y-auto bg-white rounded border text-sm mb-3">
                                        {validationResult.errors.map((err, i) => (
                                            <div key={`err-${i}`} className="flex items-center gap-2 p-2 border-b last:border-0">
                                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                                <span className="text-muted-foreground">Row {err.row}:</span>
                                                <span>{err.message}</span>
                                            </div>
                                        ))}
                                        {validationResult.duplicates.map((dup, i) => (
                                            <div key={`dup-${i}`} className="flex items-center gap-2 p-2 border-b last:border-0">
                                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                                <span className="text-muted-foreground">Duplicate:</span>
                                                <span>{dup.serial_number} (exists in {dup.existing_batch})</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={resetCSV} className="flex-1">
                                            Upload Fixed File
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : uploadResult && (
                        // Upload Complete State
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-800">Import Complete!</p>
                                    <p className="text-sm text-green-700">
                                        {uploadResult.passports_count || uploadResult.result?.passports_count} passports created
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={resetCSV} className="w-full">
                                Upload Another
                            </Button>
                        </div>
                    )}
                </div>
            </TabsContent>

            {/* Auto-Generate Tab */}
            <TabsContent value="auto">
                <div className="space-y-4 rounded-lg border p-6">
                    {!generateResult ? (
                        <>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            max="10000"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="e.g. 500"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="startNumber">Start Number</Label>
                                        <Input
                                            id="startNumber"
                                            type="number"
                                            min="1"
                                            value={startNumber}
                                            onChange={(e) => setStartNumber(e.target.value)}
                                            placeholder="e.g. 1"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="prefix">Serial Prefix</Label>
                                    <Input
                                        id="prefix"
                                        value={prefix}
                                        onChange={(e) => setPrefix(e.target.value)}
                                        placeholder="e.g. BAT-2026-"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="mfgDate">Manufacture Date</Label>
                                    <Input
                                        id="mfgDate"
                                        type="date"
                                        value={manufactureDate}
                                        onChange={(e) => setManufactureDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="rounded-md bg-slate-100 p-4 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                                <p className="font-mono text-sm">
                                    Generates <span className="font-bold text-blue-600">{previewStart}</span> to{" "}
                                    <span className="font-bold text-blue-600">{previewEnd}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    ({quantity || 0} passports)
                                </p>
                            </div>

                            <Button
                                onClick={handleAutoGenerate}
                                disabled={isGenerating}
                                className="w-full"
                            >
                                {isGenerating ? "Generating..." : "Generate Passports"}
                            </Button>
                        </>
                    ) : (
                        // Generation Complete
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-800">Generation Complete!</p>
                                    <p className="text-sm text-green-700">
                                        {generateResult.passports_created} passports created
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                                        {generateResult.serial_range}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={resetAutoGen} className="w-full">
                                Generate More
                            </Button>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    )
}
