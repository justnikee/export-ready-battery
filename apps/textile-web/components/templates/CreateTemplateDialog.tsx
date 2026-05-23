"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"

interface CreateTemplateDialogProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 onTemplateCreated: () => void
}

export function CreateTemplateDialog({
 open,
 onOpenChange,
 onTemplateCreated,
}: CreateTemplateDialogProps) {
 const { user } = useAuth()
 const [isLoading, setIsLoading] = useState(false)

 // Form states
 const [name, setName] = useState("")
 const [chemistry, setChemistry] = useState("Li-ion")
 const [voltage, setVoltage] = useState("")
 const [capacity, setCapacity] = useState("")
 const [manufacturer, setManufacturer] = useState("")
 const [weight, setWeight] = useState("")
 const [carbonFootprint, setCarbonFootprint] = useState("")
 const [countryOfOrigin, setCountryOfOrigin] = useState("")
 const [recyclable, setRecyclable] = useState(false)

 const resetForm = () => {
 setName("")
 setChemistry("Li-ion")
 setVoltage("")
 setCapacity("")
 setManufacturer("")
 setWeight("")
 setCarbonFootprint("")
 setCountryOfOrigin("")
 setRecyclable(false)
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!user) return

 if (!name.trim()) {
 toast.error("Template name is required")
 return
 }

 setIsLoading(true)
 try {
 await api.post("/templates", {
 tenant_id: user.tenant_id,
 name: name.trim(),
 specs: {
 chemistry,
 voltage,
 capacity,
 manufacturer: manufacturer || user.company_name,
 weight,
 carbon_footprint: carbonFootprint,
 country_of_origin: countryOfOrigin,
 recyclable,
 },
 })

 toast.success(`Template "${name}" created successfully`)
 resetForm()
 onTemplateCreated()
 } catch (error: unknown) {
 console.error("Failed to create template:", error)
 const apiError = error as { response?: { data?: { error?: string } } }
 toast.error(apiError.response?.data?.error || "Failed to create template")
 } finally {
 setIsLoading(false)
 }
 }

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[550px]">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Sparkles className="h-5 w-5 text-emerald-500" />
 Create New Template
 </DialogTitle>
 <DialogDescription>
 Save battery specifications as a reusable template for faster batch creation.
 </DialogDescription>
 </DialogHeader>

 <form onSubmit={handleSubmit}>
 <div className="grid gap-5 py-4">
 {/* Template Name */}
 <div className="grid gap-2">
 <Label htmlFor="name">
 Template Name <span className="text-red-500">*</span>
 </Label>
 <Input
 id="name"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="e.g., E-Bike Standard Pack"
 required
 />
 </div>

 {/* Chemistry & Voltage */}
 <div className="grid grid-cols-2 gap-4">
 <div className="grid gap-2">
 <Label htmlFor="chemistry">
 Chemistry
 </Label>
 <Input
 id="chemistry"
 value={chemistry}
 onChange={(e) => setChemistry(e.target.value)}
 placeholder="e.g., Li-ion NMC"
 />
 </div>
 <div className="grid gap-2">
 <Label htmlFor="voltage">
 Voltage
 </Label>
 <Input
 id="voltage"
 value={voltage}
 onChange={(e) => setVoltage(e.target.value)}
 placeholder="e.g., 48V"
 />
 </div>
 </div>

 {/* Capacity & Weight */}
 <div className="grid grid-cols-2 gap-4">
 <div className="grid gap-2">
 <Label htmlFor="capacity">
 Capacity
 </Label>
 <Input
 id="capacity"
 value={capacity}
 onChange={(e) => setCapacity(e.target.value)}
 placeholder="e.g., 20Ah"
 />
 </div>
 <div className="grid gap-2">
 <Label htmlFor="weight">
 Weight
 </Label>
 <Input
 id="weight"
 value={weight}
 onChange={(e) => setWeight(e.target.value)}
 placeholder="e.g., 12kg"
 />
 </div>
 </div>

 {/* Manufacturer & Country */}
 <div className="grid grid-cols-2 gap-4">
 <div className="grid gap-2">
 <Label htmlFor="manufacturer">
 Manufacturer
 </Label>
 <Input
 id="manufacturer"
 value={manufacturer}
 onChange={(e) => setManufacturer(e.target.value)}
 placeholder={user?.company_name || "Company name"}
 />
 </div>
 <div className="grid gap-2">
 <Label htmlFor="country">
 Country of Origin
 </Label>
 <Input
 id="country"
 value={countryOfOrigin}
 onChange={(e) => setCountryOfOrigin(e.target.value)}
 placeholder="e.g., India"
 />
 </div>
 </div>

 {/* EU Compliance Section */}
 <div className="p-4 rounded-lg border border-blue-200 bg-blue-500/10">
 <h4 className="text-sm font-medium text-blue-800 mb-3">
 EU Compliance Fields (Optional)
 </h4>
 <div className="grid gap-4">
 <div className="grid gap-2">
 <Label htmlFor="carbon">
 Carbon Footprint
 </Label>
 <Input
 id="carbon"
 value={carbonFootprint}
 onChange={(e) => setCarbonFootprint(e.target.value)}
 placeholder="e.g., 85 kg CO₂e"
 />
 </div>
 <div className="flex items-center space-x-2">
 <input
 type="checkbox"
 id="recyclable"
 checked={recyclable}
 onChange={(e) => setRecyclable(e.target.checked)}
 className="h-4 w-4 rounded border-border text-emerald-500 focus:ring-emerald-500"
 />
 <Label htmlFor="recyclable" className="cursor-pointer">
 Recyclable materials
 </Label>
 </div>
 </div>
 </div>
 </div>

 <DialogFooter>
 <Button
 type="button"
 variant="ghost"
 onClick={() => onOpenChange(false)}
 >
 Cancel
 </Button>
 <Button
 type="submit"
 disabled={isLoading}
 className="bg-background hover:bg-primary/90 text-white"
 >
 {isLoading ? "Creating..." : "Create Template"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 )
}
