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
import { Printer, Download, FileText, Grid3X3, QrCode } from "lucide-react"

interface DownloadLabelsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    batchName: string
    passportCount: number
    onDownload: () => Promise<void>
}

export function DownloadLabelsDialog({
    open,
    onOpenChange,
    batchName,
    passportCount,
    onDownload,
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Printer className="h-5 w-5 text-purple-400" />
                        Download PDF Labels
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Generate printable label sheets for batch "{batchName}"
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Label Preview */}
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                        <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4 text-zinc-500" />
                            Label Format Preview
                        </h4>

                        {/* Mock A4 sheet with 3x7 grid */}
                        <div className="bg-white rounded-md p-2 aspect-[210/297] max-h-48 mx-auto flex items-center justify-center">
                            <div className="grid grid-cols-3 gap-[2px] p-1 w-full h-full">
                                {[...Array(21)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-zinc-100 border border-zinc-200 rounded-sm flex items-center justify-center"
                                    >
                                        <QrCode className="h-2 w-2 text-zinc-400" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-center text-xs text-zinc-500 mt-2">
                            3 × 7 grid layout per A4 page
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                            <p className="text-2xl font-bold text-white">
                                {passportCount.toLocaleString()}
                            </p>
                            <p className="text-xs text-zinc-500">Total Labels</p>
                        </div>
                        <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-400">
                                {totalPages}
                            </p>
                            <p className="text-xs text-zinc-500">Pages</p>
                        </div>
                        <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                            <p className="text-2xl font-bold text-zinc-300">
                                A4
                            </p>
                            <p className="text-xs text-zinc-500">Paper Size</p>
                        </div>
                    </div>

                    {/* Label Content Info */}
                    <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-800">
                        <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-zinc-500" />
                            Each Label Contains
                        </h4>
                        <ul className="text-xs text-zinc-400 space-y-1 ml-6 list-disc">
                            <li>QR Code (links to digital passport)</li>
                            <li>Batch name: {batchName}</li>
                            <li>Serial number</li>
                            <li>ExportReady branding</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-zinc-400 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={isDownloading || passportCount === 0}
                        className="bg-purple-600 hover:bg-purple-700"
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
