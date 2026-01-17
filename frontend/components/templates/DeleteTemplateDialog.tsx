"use client"

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
import { AlertTriangle } from "lucide-react"

interface DeleteTemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    templateName: string
    onConfirm: () => void
}

export function DeleteTemplateDialog({
    open,
    onOpenChange,
    templateName,
    onConfirm,
}: DeleteTemplateDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-white">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        Delete Template
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                        Are you sure you want to delete the template{" "}
                        <span className="font-semibold text-zinc-200">"{templateName}"</span>?
                        <br /><br />
                        <span className="text-zinc-500">
                            This action cannot be undone. Existing batches created with this template
                            will not be affected.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete Template
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
