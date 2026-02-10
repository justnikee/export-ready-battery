"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface BulkActionToolbarProps {
    selectedIds: string[]
    onClearSelection: () => void
    onActionComplete: () => void
    batchId?: string
}

export function BulkActionToolbar({
    selectedIds,
    onClearSelection,
}: BulkActionToolbarProps) {
    if (selectedIds.length === 0) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-zinc-900 border border-slate-200 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-slate-900 font-semibold text-sm">
                        {selectedIds.length}
                    </div>
                    <span className="text-zinc-300 text-sm">selected</span>
                </div>

                <div className="w-px h-8 bg-zinc-700" />

                <span className="text-zinc-400 text-sm">
                    Bulk actions are disabled for compliance. Use per-passport transitions.
                </span>

                <div className="w-px h-8 bg-zinc-700" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    className="text-zinc-400 hover:text-slate-900"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
