"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"

interface CreateBatchDialogProps {
    onBatchCreated: () => void
}

export function CreateBatchDialog({ onBatchCreated }: CreateBatchDialogProps) {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form states
    const [batchName, setBatchName] = useState("")
    const [capacity, setCapacity] = useState("")
    const [voltage, setVoltage] = useState("")
    const [chemistry, setChemistry] = useState("Li-ion")
    const [manufacturer, setManufacturer] = useState(user?.company_name || "")
    const [weight, setWeight] = useState("")
    const [carbonFootprint, setCarbonFootprint] = useState("")
    const [countryOfOrigin, setCountryOfOrigin] = useState("")
    const [recyclable, setRecyclable] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsLoading(true)
        try {
            await api.post("/batches", {
                tenant_id: user.tenant_id,
                batch_name: batchName,
                specs: {
                    capacity,
                    voltage,
                    chemistry,
                    manufacturer,
                    weight,
                    carbon_footprint: carbonFootprint,
                    country_of_origin: countryOfOrigin,
                    recyclable,
                }
            })

            toast.success("Batch created successfully")
            setOpen(false)
            onBatchCreated()

            // Reset form
            setBatchName("")
            setCapacity("")
            setVoltage("")
            setWeight("")
            setCarbonFootprint("")
            setCountryOfOrigin("")
            setRecyclable(false)
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create batch")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Batch
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Batch</DialogTitle>
                    <DialogDescription>
                        Enter the specifications for this batch of batteries.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 py-4">
                        {/* Row 1: Batch Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Batch Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={batchName}
                                onChange={(e) => setBatchName(e.target.value)}
                                placeholder="e.g. Q1-2024-Pro"
                                required
                            />
                        </div>

                        {/* Row 2: Manufacturer & Chemistry */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="manufacturer">Manufacturer <span className="text-red-500">*</span></Label>
                                <Input
                                    id="manufacturer"
                                    value={manufacturer}
                                    onChange={(e) => setManufacturer(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="chemistry">Chemistry <span className="text-red-500">*</span></Label>
                                <Input
                                    id="chemistry"
                                    value={chemistry}
                                    onChange={(e) => setChemistry(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 3: Capacity & Voltage */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="capacity">Capacity <span className="text-red-500">*</span></Label>
                                <Input
                                    id="capacity"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    placeholder="e.g. 5000mAh"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="voltage">Voltage <span className="text-red-500">*</span></Label>
                                <Input
                                    id="voltage"
                                    value={voltage}
                                    onChange={(e) => setVoltage(e.target.value)}
                                    placeholder="e.g. 3.7V"
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 4: Weight & Carbon Footprint */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="weight">Weight</Label>
                                <Input
                                    id="weight"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="e.g. 50g"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="carbon">Carbon Footprint (kg CO2e)</Label>
                                <Input
                                    id="carbon"
                                    value={carbonFootprint}
                                    onChange={(e) => setCarbonFootprint(e.target.value)}
                                    placeholder="e.g. 1.2"
                                />
                            </div>
                        </div>

                        {/* Row 5: Country of Origin */}
                        <div className="grid gap-2">
                            <Label htmlFor="country">Country of Origin</Label>
                            <Input
                                id="country"
                                value={countryOfOrigin}
                                onChange={(e) => setCountryOfOrigin(e.target.value)}
                                placeholder="e.g. Germany"
                            />
                        </div>

                        {/* Row 6: Recyclable Checkbox */}
                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="recyclable"
                                checked={recyclable}
                                onChange={(e) => setRecyclable(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor="recyclable" className="font-normal cursor-pointer">
                                This batch contains recyclable materials
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Batch"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
