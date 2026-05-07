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
 chemistry?: string // For dynamic BPAN prefix (e.g., 'LFP', 'NMC')
 morthCode?: string // Tenant's MoRTH manufacturer code (e.g., 'NKY', 'TBC')
 isDraft?: boolean  // When true, passport generation is blocked until batch is activated
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

interface UploadResult {
 passports_count?: number
 result?: {
 passports_count?: number
 }
}

interface AutoGenerateResult {
 passports_created: number
 serial_range?: string
}

export function UploadCSV({ batchId, marketRegion = 'GLOBAL', chemistry, morthCode, isDraft = false, onUploadComplete }: UploadCSVProps) {
 // CSV Upload State
 const [file, setFile] = useState<File | null>(null)
 const [isValidating, setIsValidating] = useState(false)
 const [isUploading, setIsUploading] = useState(false)
 const [progress, setProgress] = useState(0)
 const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
 const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

 // Auto-Generate State - Default prefix based on market region and chemistry
 const currentYear = new Date().getFullYear()
 const chemistryCode = chemistry?.toUpperCase() || 'LFP'
 const morthTrimmed = morthCode?.trim() ?? ''
 const morthMissing = marketRegion === 'INDIA' && (morthTrimmed === '' || morthTrimmed === 'TBC')
 const morthSegment = morthTrimmed && morthTrimmed !== 'TBC' ? morthTrimmed : '{MoRTH}'
 const defaultPrefix = marketRegion === 'INDIA'
  ? `IN-${morthSegment}-${chemistryCode}-${currentYear}-`
  : marketRegion === 'EU'
  ? `EU-BAT-${currentYear}-`
  : `BAT-${currentYear}-`
 const [quantity, setQuantity] = useState("100")
 const [prefix, setPrefix] = useState(defaultPrefix)
 const [startNumber, setStartNumber] = useState("1")
 const [manufactureDate, setManufactureDate] = useState(new Date().toISOString().split('T')[0])
 const [isGenerating, setIsGenerating] = useState(false)
 const [generateResult, setGenerateResult] = useState<AutoGenerateResult | null>(null)

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
 } catch {
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
 } catch (error: unknown) {
 const apiError = error as { response?: { data?: { error?: string } } }
 toast.error(apiError.response?.data?.error || "Validation failed")
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
 } catch (error: unknown) {
 const apiError = error as { response?: { data?: { error?: string } } }
 toast.error(apiError.response?.data?.error || "Upload failed")
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
 if (!manufactureDate) {
 toast.error("Manufacture date is required")
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
 } catch (error: unknown) {
 const apiError = error as { response?: { data?: { error?: string } } }
 toast.error(apiError.response?.data?.error || "Generation failed")
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
 <div className="space-y-4 border border-dashed p-6">
 {!file ? (
 <div className="flex flex-col items-center gap-2 text-center">
 <Upload className="h-10 w-10 text-muted-foreground" />
 <h3 className="text-lg ">Upload Passports CSV</h3>
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
 className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-800 mt-3"
 >
 <Download className="h-4 w-4" />
 Download Sample CSV Template
 </button>
 </div>
 ) : !validationResult && !uploadResult ? (
 <div className="flex flex-col gap-4">
 {/* File Info */}
 <div className="flex items-center justify-between border p-3">
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
 <p className=" text-green-800">Ready to Import</p>
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
 <div className="rounded-lg bg-amber-500/10 border border-amber-200 p-4">
 <div className="flex items-center gap-3 mb-3">
 <AlertTriangle className="h-8 w-8 text-amber-500" />
 <div>
 <p className=" text-amber-800">Issues Found</p>
 <p className="text-sm text-amber-500">
 {validationResult.duplicate_count} duplicates, {validationResult.error_count} errors
 </p>
 </div>
 </div>

 {/* Error Table */}
 <div className="max-h-40 overflow-y-auto bg-transparent rounded border text-sm mb-3">
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
 <p className=" text-green-800">Import Complete!</p>
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
 <div className="space-y-4 border p-6">
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
 <div className="rounded-md bg-muted p-4 text-center">
 <p className="text-xs text-muted-foreground mb-1">Preview</p>
 <p className="font-mono text-sm">
 Generates <span className=" text-blue-500">{previewStart}</span> to{" "}
 <span className=" text-blue-500">{previewEnd}</span>
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 ({quantity || 0} passports)
 </p>
 </div>

 {morthMissing && (
 <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-2 text-sm text-amber-400">
 <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
 <span>
 <span className="font-medium">MoRTH Manufacturer Code not configured.</span>{" "}
 Go to{" "}
 <a href="/settings?tab=compliance" className="underline hover:text-amber-300">Settings → India Compliance</a>{" "}
 and enter your 3-character MoRTH-registered code before generating passports.
 </span>
 </div>
 )}

 <Button
 onClick={handleAutoGenerate}
 disabled={isGenerating || isDraft || morthMissing}
 className="w-full"
 >
 {isGenerating ? "Generating..." : "Generate Passports"}
 </Button>
  {isDraft && (
  <p className="text-xs text-amber-500 flex items-center gap-1.5 justify-center">
  <AlertTriangle className="h-3.5 w-3.5" />
  Batch must be activated before generating passports
  </p>
  )}
 </>
 ) : (
 // Generation Complete
 <div className="rounded-lg bg-green-50 border border-green-200 p-4">
 <div className="flex items-center gap-3 mb-3">
 <CheckCircle className="h-8 w-8 text-green-600" />
 <div>
 <p className=" text-green-800">Generation Complete!</p>
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
