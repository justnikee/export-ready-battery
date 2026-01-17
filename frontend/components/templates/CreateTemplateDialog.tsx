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
        } catch (error: any) {
            console.error("Failed to create template:", error)
            toast.error(error.response?.data?.error || "Failed to create template")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                        Create New Template
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Save battery specifications as a reusable template for faster batch creation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-5 py-4">
                        {/* Template Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-zinc-300">
                                Template Name <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., E-Bike Standard Pack"
                                className="bg-zinc-800 border-zinc-700 text-white"
                                required
                            />
                        </div>

                        {/* Chemistry & Voltage */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="chemistry" className="text-zinc-300">
                                    Chemistry
                                </Label>
                                <Input
                                    id="chemistry"
                                    value={chemistry}
                                    onChange={(e) => setChemistry(e.target.value)}
                                    placeholder="e.g., Li-ion NMC"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voltage" className="text-zinc-300">
                                    Voltage
                                </Label>
                                <Input
                                    id="voltage"
                                    value={voltage}
                                    onChange={(e) => setVoltage(e.target.value)}
                                    placeholder="e.g., 48V"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                        </div>

                        {/* Capacity & Weight */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="capacity" className="text-zinc-300">
                                    Capacity
                                </Label>
                                <Input
                                    id="capacity"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    placeholder="e.g., 20Ah"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="weight" className="text-zinc-300">
                                    Weight
                                </Label>
                                <Input
                                    id="weight"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="e.g., 12kg"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                        </div>

                        {/* Manufacturer & Country */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="manufacturer" className="text-zinc-300">
                                    Manufacturer
                                </Label>
                                <Input
                                    id="manufacturer"
                                    value={manufacturer}
                                    onChange={(e) => setManufacturer(e.target.value)}
                                    placeholder={user?.company_name || "Company name"}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country" className="text-zinc-300">
                                    Country of Origin
                                </Label>
                                <Input
                                    id="country"
                                    value={countryOfOrigin}
                                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                                    placeholder="e.g., India"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                        </div>

                        {/* EU Compliance Section */}
                        <div className="p-4 rounded-lg border border-blue-800/50 bg-blue-950/20">
                            <h4 className="text-sm font-medium text-blue-300 mb-3">
                                EU Compliance Fields (Optional)
                            </h4>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="carbon" className="text-zinc-300">
                                        Carbon Footprint
                                    </Label>
                                    <Input
                                        id="carbon"
                                        value={carbonFootprint}
                                        onChange={(e) => setCarbonFootprint(e.target.value)}
                                        placeholder="e.g., 85 kg CO₂e"
                                        className="bg-zinc-800 border-zinc-700 text-white"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="recyclable"
                                        checked={recyclable}
                                        onChange={(e) => setRecyclable(e.target.checked)}
                                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-purple-600 focus:ring-purple-500"
                                    />
                                    <Label htmlFor="recyclable" className="text-zinc-300 cursor-pointer">
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
                            className="text-zinc-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isLoading ? "Creating..." : "Create Template"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
