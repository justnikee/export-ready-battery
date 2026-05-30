"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Printer, Download, FileText, Grid3X3, QrCode, Globe, Leaf } from "lucide-react"

interface DownloadLabelsDialogProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 batchName: string
 passportCount: number
 onDownload: () => Promise<void>
 /** Market region of the batch (INDIA, EU, GLOBAL) */
 marketRegion?: string
 /** Chemistry code for BPAN display */
 chemistry?: string
 /** Whether a carbon footprint has been calculated for this batch */
 hasCarbonFootprint?: boolean
 productType?: string;
}

export function DownloadLabelsDialog({
 open,
 onOpenChange,
 batchName,
 passportCount,
 onDownload,
 marketRegion = "INDIA",
 chemistry = "",
 hasCarbonFootprint = false,
 productType = "BATTERY",
}: DownloadLabelsDialogProps) {
 const [isDownloading, setIsDownloading] = useState(false)

 // Calculate pages (21 labels per A4 page in 3x7 grid)
 const labelsPerPage = 21
 const totalPages = Math.ceil(passportCount / labelsPerPage)

 const handleDownload = async () => {
 setIsDownloading(true)
 try {
 await onDownload()
 onOpenChange(false)
 } finally {
 setIsDownloading(false)
 }
 }

 // Region display config
 const regionConfig: Record<string, { label: string; color: string; bgColor: string }> = {
 INDIA: { label: "🇮🇳 India", color: "text-orange-400", bgColor: "bg-orange-500/10" },
 EU: { label: "🇪🇺 EU", color: "text-blue-400", bgColor: "bg-blue-500/10" },
 GLOBAL: { label: "🌍 Global", color: "text-green-400", bgColor: "bg-green-500/10" },
 }
 const region = regionConfig[marketRegion] || regionConfig["GLOBAL"]

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-white">
 <Printer className="h-5 w-5 text-teal-400" />
 Download PDF Labels
 </DialogTitle>
 <DialogDescription className="text-muted-foreground">
 Generate printable label sheets for batch &quot;{batchName}&quot;
 </DialogDescription>
 </DialogHeader>

 <div className="py-4 space-y-6">
 {/* Label Preview */}
 <div className="bg-secondary/50 p-4 border border-border">
 <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
 <Grid3X3 className="h-4 w-4 text-muted-foreground" />
 Label Format Preview
 </h4>

 {/* Mock A4 sheet with 3x7 grid */}
 <div className="bg-transparent p-2 aspect-[210/297] max-h-48 mx-auto flex items-center justify-center">
 <div className="grid grid-cols-3 gap-[2px] p-1 w-full h-full">
 {[...Array(21)].map((_, i) => (
 <div
 key={i}
 className="bg-muted border border-border flex items-center justify-center"
 >
 <QrCode className="h-2 w-2 text-muted-foreground" />
 </div>
 ))}
 </div>
 </div>

 <p className="text-center text-xs text-muted-foreground mt-2">
 3 × 7 grid layout per A4 page
 </p>
 </div>

 {/* Stats + Region Badge */}
 <div className="grid grid-cols-4 gap-3">
 <div className="text-center p-3 bg-secondary/50">
 <p className="text-2xl text-white">
 {passportCount.toLocaleString()}
 </p>
 <p className="text-xs text-muted-foreground">Total Labels</p>
 </div>
 <div className="text-center p-3 bg-secondary/50">
 <p className="text-2xl text-teal-400">
 {totalPages}
 </p>
 <p className="text-xs text-muted-foreground">Pages</p>
 </div>
 <div className="text-center p-3 bg-secondary/50">
 <p className="text-2xl text-muted-foreground">
 A4
 </p>
 <p className="text-xs text-muted-foreground">Paper Size</p>
 </div>
 <div className={`text-center p-3 ${region.bgColor}`}>
 <p className={`text-lg ${region.color}`}>
 {region.label}
 </p>
 <p className="text-xs text-muted-foreground">Region</p>
 </div>
 </div>

 {/* Label Content Info */}
 <div className="bg-secondary/30 p-3 border border-border">
 <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
 <FileText className="h-4 w-4 text-muted-foreground" />
 Each Label Contains
 </h4>
 <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
 <>
 <li>QR Code (links to digital passport with BPAN data)</li>
 <li className="flex items-center gap-1">
 BPAN V2 serial number
 {chemistry && (
 <span className="text-teal-400 font-mono text-[10px]">
 ({chemistry})
 </span>
 )}
 </li>
 <li>Decoded battery descriptor (chemistry, year, sequence)</li>
 <li>Battery specs (voltage, capacity, manufacturer)</li>
 <li className="flex items-center gap-1">
 <Globe className="h-3 w-3 text-muted-foreground" />
 Market region badge
 <span className={`text-[10px] font-medium ${region.color}`}>
 {region.label}
 </span>
 </li>
 {(marketRegion === "EU" || hasCarbonFootprint) && (
 <li className="flex items-center gap-1 text-green-400">
 <Leaf className="h-3 w-3" />
 Carbon footprint (kgCO₂e/kWh)
 </li>
 )}
 <li>Compliance info (EPR, BIS, cell source)</li>
 {marketRegion === "INDIA" && (
 <li className="text-orange-400">AIS-156 compliance mark</li>
 )}
 </>
 </ul>
 </div>

 {/* BPAN Serial Format Preview */}
 {marketRegion === "INDIA" && (
 <div className="bg-orange-500/5 p-3 border border-orange-500/20">
 <h4 className="text-sm font-medium text-orange-400 mb-2">
 BPAN Serial Format (21-char)
 </h4>
 <div className="font-mono text-sm text-white bg-background rounded px-3 py-2 tracking-wider text-center">
 IN-XXX-{chemistry || "LFP"}-{new Date().getFullYear()}-00001
 </div>
 <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-1">
 <span>Region</span>
 <span>Mfr</span>
 <span>Chem</span>
 <span>Year</span>
 <span>Seq</span>
 </div>
 </div>
 )}
 </div>

 <DialogFooter>
 <Button
 variant="ghost"
 onClick={() => onOpenChange(false)}
 className="text-muted-foreground hover:text-white"
 >
 Cancel
 </Button>
 <Button
 onClick={handleDownload}
 disabled={isDownloading || passportCount === 0}
 className="bg-teal-600 hover:bg-teal-700"
 >
 {isDownloading ? (
 <>
 <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
 Generating...
 </>
 ) : (
 <>
 <Download className="h-4 w-4 mr-2" />
 Download PDF ({totalPages} {totalPages === 1 ? "page" : "pages"})
 </>
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 )
}
