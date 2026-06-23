"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { FileText, Trash2, Globe, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { useTemplates, queryKeys, type Template } from "@/hooks/use-queries"
import { useQueryClient } from "@tanstack/react-query"

type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface TemplatesDialogProps {
 onTemplateDeleted?: () => void
}

export function TemplatesDialog({ onTemplateDeleted }: TemplatesDialogProps) {
 const { user } = useAuth()
 const [open, setOpen] = useState(false)
 const [deletingId, setDeletingId] = useState<string | null>(null)
 const [pendingDelete, setPendingDelete] = useState<{ id: string, name: string } | null>(null)

 const queryClient = useQueryClient();
 const { data: templates = [], isLoading: loading } = useTemplates(user?.tenant_id, "BATTERY");

 const handleDelete = async (id: string, name: string) => {
 setPendingDelete(null)

 setDeletingId(id)
 try {
 await api.delete(`/templates/${id}`)
 toast.success(`Template "${name}" deleted`)
 queryClient.invalidateQueries({ queryKey: queryKeys.templates(user?.tenant_id || '', 'BATTERY') });
 onTemplateDeleted?.()
 } catch (error) {
 toast.error("Failed to delete template")
 } finally {
 setDeletingId(null)
 }
 }

 const getMarketIcon = (region: MarketRegion) => {
 switch (region) {
 case "INDIA":
 return <span className="w-3 h-3 rounded-full bg-linear-to-br from-orange-400 to-green-500 shrink-0" />
 case "EU":
 return <span className="w-3 h-3 rounded-full bg-linear-to-br from-blue-400 to-blue-600 shrink-0" />
 default:
 return <Globe className="h-3.5 w-3.5" />
 }
 }

 const getMarketColor = (region: MarketRegion) => {
 switch (region) {
 case "INDIA":
 return "bg-orange-100 text-orange-700 border-orange-200"
 case "EU":
 return "bg-blue-100 text-blue-500 border-blue-200"
 default:
 return "bg-muted text-foreground border-border"
 }
 }

 return (
 <>
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 <Button variant="outline" className="gap-2 h-10 px-4">
 <FileText className="h-4 w-4" />
 Templates
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5 text-muted-foreground" />
 Product SKU Templates
 </DialogTitle>
 <DialogDescription>
 Saved templates with market-specific compliance data. Load these when creating new batches.
 </DialogDescription>
 </DialogHeader>

 <div className="flex-1 overflow-y-auto mt-4">
 {loading ? (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
 </div>
 ) : templates.length === 0 ? (
 <div className="text-center py-12">
 <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
 <p className="text-muted-foreground">No templates saved yet</p>
 <p className="text-sm text-muted-foreground mt-1">
 Create a batch and check &quot;Save as Template&quot; to save your first template
 </p>
 </div>
 ) : (
 <div className="space-y-3">
 {templates.map((template) => (
 <div
 key={template.id}
 className="relative border border-border p-4 hover:border-border transition-colors bg-transparent"
 ><div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <h3 className="font-medium text-foreground">{template.name}</h3>
 <Badge
 variant="outline"
 className={`text-xs flex items-center gap-1 ${getMarketColor((template.market_region || "GLOBAL") as MarketRegion)}`}
 >
 {getMarketIcon((template.market_region || "GLOBAL") as MarketRegion)}
 {template.market_region || "GLOBAL"}
 </Badge>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
 {(template.specs.chemistry as string) && (
 <span>Chemistry: <span className="text-foreground">{template.specs.chemistry as string}</span></span>
 )}
 {(template.specs.capacity as string) && (
 <span>Capacity: <span className="text-foreground">{template.specs.capacity as string}</span></span>
 )}
 {(template.specs.voltage as string) && (
 <span>Voltage: <span className="text-foreground">{template.specs.voltage as string}</span></span>
 )}
 {(template.specs.manufacturer as string) && (
 <span>Mfr: <span className="text-foreground">{template.specs.manufacturer as string}</span></span>
 )}
 </div>

 {/* India compliance badges */}
 {template.market_region === "INDIA" && (
 <div className="flex gap-2 mt-2 flex-wrap">
 {(template.specs.hsn_code as string) && (
 <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-200 text-orange-700">
 HSN: {template.specs.hsn_code as string}
 </Badge>
 )}
 {(template.specs.bis_number as string) && (
 <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-200 text-orange-700">
 BIS: {template.specs.bis_number as string}
 </Badge>
 )}
 {(template.specs.epr_number as string) && (
 <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-200 text-orange-700">
 EPR: {template.specs.epr_number as string}
 </Badge>
 )}
 </div>
 )}

 <p className="text-xs text-muted-foreground mt-2">
 Created {new Date(template.created_at).toLocaleDateString()}
 </p>
 </div>

 <Button
 variant="ghost"
 size="sm"
 className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
 onClick={() => setPendingDelete({ id: template.id, name: template.name })}
 disabled={deletingId === template.id}
 >
 {deletingId === template.id ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Trash2 className="h-4 w-4" />
 )}
 </Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="border-t border-border pt-4 mt-4">
 <p className="text-xs text-muted-foreground text-center">
 💡 Tip: To use a template, open &quot;Create New Batch&quot; and select it from the template dropdown
 </p>
 </div>
 </DialogContent>
 </Dialog>

 {/* Confirmation Dialog */}
 <ConfirmDialog
 open={!!pendingDelete}
 onOpenChange={(open) => !open && setPendingDelete(null)}
 title="Delete template?"
 description={pendingDelete ? `Delete template "${pendingDelete.name}"? This cannot be undone.` : ""}
 confirmText="Delete"
 variant="destructive"
 onConfirm={() => pendingDelete && handleDelete(pendingDelete.id, pendingDelete.name)}
 />
 </>
 )
}

