"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, RefreshCw, X, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface BulkActionToolbarProps {
    selectedIds: string[]
    onClearSelection: () => void
    onActionComplete: () => void
    batchId?: string
}

const STATUSES = [
    { value: "ACTIVE", label: "Active", color: "text-green-500" },
    { value: "RECALLED", label: "Recalled", color: "text-red-500" },
    { value: "RECYCLED", label: "Recycled", color: "text-blue-500" },
    { value: "END_OF_LIFE", label: "End of Life", color: "text-gray-500" },
]

export function BulkActionToolbar({
    selectedIds,
    onClearSelection,
    onActionComplete,
}: BulkActionToolbarProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [pendingStatus, setPendingStatus] = useState<string | null>(null)

    const handleStatusChange = async (newStatus: string) => {
        setPendingStatus(newStatus)
    }

    const confirmStatusChange = async () => {
        if (!pendingStatus) return

        setIsUpdating(true)
        try {
            const response = await api.post("/passports/bulk/status", {
                passport_ids: selectedIds,
                status: pendingStatus,
            })

            toast.success(`${response.data.updated} passports updated to ${pendingStatus}`)
            onActionComplete()
            onClearSelection()
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update passports")
        } finally {
            setIsUpdating(false)
            setPendingStatus(null)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const response = await api.post("/passports/bulk/delete", {
                passport_ids: selectedIds,
            })

            toast.success(`${response.data.deleted} passports deleted`)
            onActionComplete()
            onClearSelection()
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to delete passports")
        } finally {
            setIsDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    if (selectedIds.length === 0) return null

    return (
        <>
            {/* Floating Toolbar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4">
                    {/* Selection Count */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {selectedIds.length}
                        </div>
                        <span className="text-zinc-300 text-sm">selected</span>
                    </div>

                    <div className="w-px h-8 bg-zinc-700" />

                    {/* Status Change */}
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-sm">Change status:</span>
                        <Select onValueChange={handleStatusChange} disabled={isUpdating}>
                            <SelectTrigger className="w-36 bg-zinc-800 border-zinc-600 text-white">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                {STATUSES.map((status) => (
                                    <SelectItem
                                        key={status.value}
                                        value={status.value}
                                        className="text-white hover:bg-zinc-700"
                                    >
                                        <span className={status.color}>{status.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-px h-8 bg-zinc-700" />

                    {/* Delete Button */}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="gap-2"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                    </Button>

                    {/* Clear Selection */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="text-zinc-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Status Change Confirmation */}
            <AlertDialog open={!!pendingStatus} onOpenChange={() => setPendingStatus(null)}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                            Update {selectedIds.length} Passports?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            This will change the status of {selectedIds.length} passport
                            {selectedIds.length > 1 ? "s" : ""} to{" "}
                            <span className="font-semibold text-white">{pendingStatus}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmStatusChange}
                            disabled={isUpdating}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Update Status
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                            Delete {selectedIds.length} Passports?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            This action cannot be undone. {selectedIds.length} passport
                            {selectedIds.length > 1 ? "s" : ""} will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Permanently
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
