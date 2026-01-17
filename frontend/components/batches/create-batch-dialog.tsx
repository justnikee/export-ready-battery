"use client"

import { useState, useEffect } from "react"
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
import { PlusCircle, Sparkles, Save, Globe, Leaf, Flag, FileText, Calendar, Calculator } from "lucide-react"
import { DVACalculator } from "./dva-calculator"

// Market region type
type MarketRegion = "INDIA" | "EU" | "GLOBAL"

interface Template {
    id: string
    name: string
    specs: {
        capacity: string
        voltage: string
        chemistry: string
        manufacturer: string
        weight: string
        carbon_footprint: string
        country_of_origin: string
        recyclable: boolean
    }
}

interface CreateBatchDialogProps {
    onBatchCreated: () => void
}

export function CreateBatchDialog({ onBatchCreated }: CreateBatchDialogProps) {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Templates state
    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState("")
    const [saveAsTemplate, setSaveAsTemplate] = useState(false)
    const [templateName, setTemplateName] = useState("")
    const [fieldsAnimating, setFieldsAnimating] = useState(false)

    // ===== DUAL-MODE: Market Region =====
    const [marketRegion, setMarketRegion] = useState<MarketRegion>("GLOBAL")

    // Form states - Common
    const [batchName, setBatchName] = useState("")
    const [capacity, setCapacity] = useState("")
    const [voltage, setVoltage] = useState("")
    const [chemistry, setChemistry] = useState("Li-ion")
    const [manufacturer, setManufacturer] = useState(user?.company_name || "")
    const [manufacturerAddress, setManufacturerAddress] = useState("")
    const [manufacturerEmail, setManufacturerEmail] = useState("")
    const [weight, setWeight] = useState("")
    const [countryOfOrigin, setCountryOfOrigin] = useState("")
    const [recyclable, setRecyclable] = useState(false)

    // Form states - EU Specific
    const [carbonFootprint, setCarbonFootprint] = useState("")
    const [certifications, setCertifications] = useState<string[]>(["CE"])

    // Form states - India Specific
    const [pliCompliant, setPliCompliant] = useState(false)
    const [domesticValueAdd, setDomesticValueAdd] = useState("")
    const [cellSource, setCellSource] = useState<"IMPORTED" | "DOMESTIC" | "">("")    // Form states - India Import/Customs Declaration
    const [billOfEntryNo, setBillOfEntryNo] = useState("")
    const [cellCountryOfOrigin, setCellCountryOfOrigin] = useState("")
    const [customsDate, setCustomsDate] = useState("")

    // Fetch templates when dialog opens
    useEffect(() => {
        if (open && user) {
            fetchTemplates()
        }
    }, [open, user])

    const fetchTemplates = async () => {
        if (!user) return
        try {
            const response = await api.get(`/templates?tenant_id=${user.tenant_id}`)
            setTemplates(response.data.templates || [])
        } catch (error) {
            console.error("Failed to fetch templates:", error)
        }
    }

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)

        if (!templateId) return

        const template = templates.find(t => t.id === templateId)
        if (template) {
            setFieldsAnimating(true)
            setTimeout(() => setFieldsAnimating(false), 300)

            setCapacity(template.specs.capacity || "")
            setVoltage(template.specs.voltage || "")
            setChemistry(template.specs.chemistry || "Li-ion")
            setManufacturer(template.specs.manufacturer || user?.company_name || "")
            setWeight(template.specs.weight || "")
            setCarbonFootprint(template.specs.carbon_footprint || "")
            setCountryOfOrigin(template.specs.country_of_origin || "")
            setRecyclable(template.specs.recyclable || false)

            toast.success(`Loaded "${template.name}" template`)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        // ===== DUAL-MODE VALIDATION =====
        if (marketRegion === "EU" && !carbonFootprint) {
            toast.error("Carbon Footprint is required for EU exports")
            return
        }

        // India Import Validation
        if (marketRegion === "INDIA" && cellSource === "IMPORTED") {
            if (!billOfEntryNo || !cellCountryOfOrigin || !customsDate) {
                toast.error("Imported batches require Bill of Entry, Country of Origin, and Customs Date")
                return
            }
        }

        setIsLoading(true)
        try {
            // Build the request payload
            const payload: any = {
                tenant_id: user.tenant_id,
                batch_name: batchName,
                market_region: marketRegion,
                specs: {
                    capacity,
                    voltage,
                    chemistry,
                    manufacturer,
                    manufacturer_address: manufacturerAddress,
                    manufacturer_email: manufacturerEmail,
                    weight,
                    carbon_footprint: carbonFootprint,
                    country_of_origin: countryOfOrigin,
                    recyclable,
                    certifications: marketRegion === "EU" ? certifications : undefined,
                }
            }

            // Add India-specific fields
            if (marketRegion === "INDIA") {
                payload.pli_compliant = pliCompliant
                payload.domestic_value_add = domesticValueAdd ? parseFloat(domesticValueAdd) : 0
                payload.cell_source = cellSource || undefined
                // Customs declaration for imported cells
                if (cellSource === "IMPORTED") {
                    payload.bill_of_entry_no = billOfEntryNo
                    payload.country_of_origin = cellCountryOfOrigin
                    payload.customs_date = customsDate
                }
            }

            await api.post("/batches", payload)

            // Save as template if checkbox is checked
            if (saveAsTemplate && templateName.trim()) {
                try {
                    await api.post("/templates", {
                        tenant_id: user.tenant_id,
                        name: templateName.trim(),
                        specs: payload.specs
                    })
                    toast.success(`Template "${templateName}" saved`)
                } catch (error) {
                    console.error("Failed to save template:", error)
                }
            }

            toast.success("Batch created successfully")
            setOpen(false)
            onBatchCreated()
            resetForm()
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create batch")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setBatchName("")
        setCapacity("")
        setVoltage("")
        setWeight("")
        setCarbonFootprint("")
        setCountryOfOrigin("")
        setRecyclable(false)
        setSelectedTemplate("")
        setSaveAsTemplate(false)
        setTemplateName("")
        setMarketRegion("GLOBAL")
        setPliCompliant(false)
        setDomesticValueAdd("")
        setCellSource("")
        setCertifications(["CE"])
        setManufacturerAddress("")
        setManufacturerEmail("")
        // Reset customs fields
        setBillOfEntryNo("")
        setCellCountryOfOrigin("")
        setCustomsDate("")
    }

    // Check if this is EU mode
    const isEUMode = marketRegion === "EU"
    const isIndiaMode = marketRegion === "INDIA"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Batch
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle>Create New Batch</DialogTitle>
                    <DialogDescription>
                        Enter the specifications for this batch of batteries.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 py-4">
                        {/* ===== MARKET REGION TOGGLE ===== */}
                        <div className="grid gap-3 pb-4 border-b border-zinc-700">
                            <Label className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-500" />
                                Target Market <span className="text-red-500">*</span>
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMarketRegion("INDIA")}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${isIndiaMode
                                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                                        : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                        }`}
                                >
                                    <Flag className="h-5 w-5 mx-auto mb-1" />
                                    <div className="font-semibold text-sm">India</div>
                                    <div className="text-xs opacity-70">Battery Aadhaar</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMarketRegion("EU")}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${isEUMode
                                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                        : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                        }`}
                                >
                                    <Leaf className="h-5 w-5 mx-auto mb-1" />
                                    <div className="font-semibold text-sm">EU Export</div>
                                    <div className="text-xs opacity-70">Battery Passport</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMarketRegion("GLOBAL")}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${marketRegion === "GLOBAL"
                                        ? "border-purple-500 bg-purple-500/10 text-purple-400"
                                        : "border-zinc-700 hover:border-zinc-600 text-zinc-400"
                                        }`}
                                >
                                    <Globe className="h-5 w-5 mx-auto mb-1" />
                                    <div className="font-semibold text-sm">Global</div>
                                    <div className="text-xs opacity-70">Both Markets</div>
                                </button>
                            </div>
                        </div>

                        {/* Template Selector */}
                        {templates.length > 0 && (
                            <div className="grid gap-2 pb-2 border-b border-zinc-700">
                                <Label htmlFor="template" className="flex items-center gap-2 text-zinc-300">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    Load Template
                                </Label>
                                <select
                                    id="template"
                                    value={selectedTemplate}
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                >
                                    <option value="">-- Select a template --</option>
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

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

                        {/* Form fields with animation */}
                        <div className={`space-y-6 transition-all duration-300 ${fieldsAnimating ? 'bg-purple-500/10 rounded-lg p-4 -m-4' : ''}`}>
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

                            {/* Row 2b: Manufacturer Address & Email */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="manufacturerAddress">Manufacturer Address</Label>
                                    <Input
                                        id="manufacturerAddress"
                                        value={manufacturerAddress}
                                        onChange={(e) => setManufacturerAddress(e.target.value)}
                                        placeholder="e.g. Industrial Area, New Delhi"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="manufacturerEmail">Compliance Email</Label>
                                    <Input
                                        id="manufacturerEmail"
                                        type="email"
                                        value={manufacturerEmail}
                                        onChange={(e) => setManufacturerEmail(e.target.value)}
                                        placeholder="e.g. compliance@company.com"
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

                            {/* Row 4: Weight & Country */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="weight">Weight</Label>
                                    <Input
                                        id="weight"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="e.g. 500g"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country of Origin</Label>
                                    <Input
                                        id="country"
                                        value={countryOfOrigin}
                                        onChange={(e) => setCountryOfOrigin(e.target.value)}
                                        placeholder={isIndiaMode ? "India" : "e.g. Germany"}
                                    />
                                </div>
                            </div>

                            {/* ===== EU-SPECIFIC FIELDS ===== */}
                            {(isEUMode || marketRegion === "GLOBAL") && (
                                <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10 space-y-4">
                                    <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                                        <Leaf className="h-4 w-4" />
                                        EU Compliance Fields
                                        {isEUMode && <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded">Required</span>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="carbon" className="text-zinc-300">
                                            Carbon Footprint (kg CO₂e)
                                            {isEUMode && <span className="text-red-500">*</span>}
                                        </Label>
                                        <Input
                                            id="carbon"
                                            value={carbonFootprint}
                                            onChange={(e) => setCarbonFootprint(e.target.value)}
                                            placeholder="e.g. 10 kg CO2e"
                                            required={isEUMode}
                                            className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="recyclable"
                                            checked={recyclable}
                                            onChange={(e) => setRecyclable(e.target.checked)}
                                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                                        />
                                        <Label htmlFor="recyclable" className="font-normal cursor-pointer text-zinc-300">
                                            Recyclable materials
                                        </Label>
                                    </div>
                                </div>
                            )}

                            {/* ===== INDIA-SPECIFIC FIELDS ===== */}
                            {isIndiaMode && (
                                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/10 space-y-4">
                                    <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
                                        <Flag className="h-4 w-4" />
                                        India Compliance Fields
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label htmlFor="domesticValue" className="text-zinc-300">Domestic Value Add (%)</Label>
                                                <DVACalculator
                                                    onApply={(val) => setDomesticValueAdd(val.toString())}
                                                    trigger={
                                                        <button type="button" className="text-[10px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                                                            <Calculator className="h-3 w-3" />
                                                            Calculate
                                                        </button>
                                                    }
                                                />
                                            </div>
                                            <Input
                                                id="domesticValue"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={domesticValueAdd}
                                                onChange={(e) => setDomesticValueAdd(e.target.value)}
                                                placeholder="e.g. 45"
                                                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="cellSource" className="text-zinc-300">Cell Source</Label>
                                            <select
                                                id="cellSource"
                                                value={cellSource}
                                                onChange={(e) => setCellSource(e.target.value as any)}
                                                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="DOMESTIC">Domestic</option>
                                                <option value="IMPORTED">Imported</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="pliCompliant"
                                            checked={pliCompliant}
                                            onChange={(e) => setPliCompliant(e.target.checked)}
                                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
                                        />
                                        <Label htmlFor="pliCompliant" className="font-normal cursor-pointer text-zinc-300">
                                            PLI Subsidy Eligible
                                        </Label>
                                    </div>

                                    {/* Customs Declaration for Imported Cells */}
                                    {cellSource === "IMPORTED" && (
                                        <div className="mt-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-4">
                                            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                                                <FileText className="h-4 w-4" />
                                                Customs Declaration
                                                <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded">Required</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="billOfEntry" className="text-zinc-300">
                                                        Bill of Entry No. <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="billOfEntry"
                                                        value={billOfEntryNo}
                                                        onChange={(e) => setBillOfEntryNo(e.target.value)}
                                                        placeholder="e.g. 1234567"
                                                        required
                                                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="cellCountryOfOrigin" className="text-zinc-300">
                                                        Cell Country of Origin <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="cellCountryOfOrigin"
                                                        value={cellCountryOfOrigin}
                                                        onChange={(e) => setCellCountryOfOrigin(e.target.value)}
                                                        placeholder="e.g. China, South Korea"
                                                        required
                                                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="customsDate" className="flex items-center gap-2 text-zinc-300">
                                                    <Calendar className="h-4 w-4 text-amber-400" />
                                                    Import Date <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="customsDate"
                                                    type="date"
                                                    value={customsDate}
                                                    onChange={(e) => setCustomsDate(e.target.value)}
                                                    required
                                                    className="max-w-[200px] bg-zinc-800 border-zinc-700 text-zinc-100"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Save as Template Section */}
                        <div className="border-t border-zinc-700 pt-4 space-y-3">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="saveTemplate"
                                    checked={saveAsTemplate}
                                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                                />
                                <Label htmlFor="saveTemplate" className="font-normal cursor-pointer flex items-center gap-2 text-zinc-300">
                                    <Save className="h-4 w-4 text-zinc-500" />
                                    Save these settings as a new template
                                </Label>
                            </div>
                            {saveAsTemplate && (
                                <div className="pl-6">
                                    <Input
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="Template name (e.g. E-Bike Standard Pack)"
                                        className="max-w-sm bg-zinc-800 border-zinc-700 text-zinc-100"
                                    />
                                </div>
                            )}
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
