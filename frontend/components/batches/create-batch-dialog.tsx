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
                }
            })

            toast.success("Batch created successfully")
            setOpen(false)
            onBatchCreated()

            // Reset form
            setBatchName("")
            setCapacity("")
            setVoltage("")
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Batch</DialogTitle>
                    <DialogDescription>
                        Enter the specifications for this batch of batteries.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Batch Name
                            </Label>
                            <Input
                                id="name"
                                value={batchName}
                                onChange={(e) => setBatchName(e.target.value)}
                                placeholder="e.g. Q1-2024-Pro"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="chemistry" className="text-right">
                                Chemistry
                            </Label>
                            <Input
                                id="chemistry"
                                value={chemistry}
                                onChange={(e) => setChemistry(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="capacity" className="text-right">
                                Capacity
                            </Label>
                            <Input
                                id="capacity"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                placeholder="e.g. 5000mAh"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="voltage" className="text-right">
                                Voltage
                            </Label>
                            <Input
                                id="voltage"
                                value={voltage}
                                onChange={(e) => setVoltage(e.target.value)}
                                placeholder="e.g. 3.7V"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="manufacturer" className="text-right">
                                Manufacturer
                            </Label>
                            <Input
                                id="manufacturer"
                                value={manufacturer}
                                onChange={(e) => setManufacturer(e.target.value)}
                                className="col-span-3"
                                required
                            />
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
