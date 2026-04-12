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
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Delete Template
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the template{" "}
                        <span className="font-semibold text-foreground">&quot;{templateName}&quot;</span>?
                        <br /><br />
                        <span className="text-muted-foreground">
                            This action cannot be undone. Existing batches created with this template
                            will not be affected.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
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
