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
import { PlusCircle, Sparkles, Save, Globe, Leaf, Flag, FileText, Calendar, Calculator, Recycle, Shield, Activity, Users, FileCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"

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
    // New EU Compliance Fields
    const [materialComposition, setMaterialComposition] = useState({
        cobalt: "",
        lithium: "",
        nickel: "",
        manganese: "",
        graphite: "",
        lead: ""
    })
    const [recycledContent, setRecycledContent] = useState("")
    const [hazardousSubstances, setHazardousSubstances] = useState({
        lead: false,
        mercury: false,
        cadmium: false
    })
    const [euRepresentative, setEuRepresentative] = useState("")
    const [euRepresentativeEmail, setEuRepresentativeEmail] = useState("")
    const [expectedLifetime, setExpectedLifetime] = useState("")
    const [warrantyMonths, setWarrantyMonths] = useState("")

    // Form states - India Specific
    const [pliCompliant, setPliCompliant] = useState(false)
    // New Enterprise Fields for India
    const [hsnCode, setHsnCode] = useState("")
    const [salePrice, setSalePrice] = useState("")
    const [importCost, setImportCost] = useState("")

    const [cellSource, setCellSource] = useState<"IMPORTED" | "DOMESTIC" | "">("")
    // Form states - India Import/Customs Declaration
    const [billOfEntryNo, setBillOfEntryNo] = useState("")
    const [cellCountryOfOrigin, setCellCountryOfOrigin] = useState("")
    const [customsDate, setCustomsDate] = useState("")

    // DVA Audit Compliance
    const [dvaSource, setDvaSource] = useState<"ESTIMATED" | "AUDITED">("ESTIMATED")
    const [auditedDva, setAuditedDva] = useState("")

    // File Upload State
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // IEC Validation State
    const [iecError, setIecError] = useState(false)

    // Fetch templates when dialog opens
    useEffect(() => {
        if (open && user) {
            fetchTemplates()
        }
    }, [open, user])

    // Auto-disable PLI and validate IEC for IMPORTED cells
    useEffect(() => {
        if (cellSource === "IMPORTED") {
            // Auto-disable PLI compliance for imported cells
            setPliCompliant(false)

            // Check IEC code
            if (!user?.iec_code) {
                setIecError(true)
            } else {
                setIecError(false)
            }
        } else {
            setIecError(false)
        }
    }, [cellSource, user?.iec_code])

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

    const handleCertificateUpload = async (file: File) => {
        if (!user) return

        setIsUploading(true)
        setUploadProgress(0)

        try {
            // Generate unique file path
            const timestamp = Date.now()
            const sanitizedBatchName = batchName.replace(/[^a-zA-Z0-9-]/g, '_') || 'unnamed'
            const filePath = `certificates/${user.tenant_id}/${sanitizedBatchName}_${timestamp}.pdf`

            // Simulate progress (Supabase doesn't provide real-time progress)
            setUploadProgress(30)

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('compliance-docs')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false  // Prevent overwriting
                })

            if (error) throw error

            setUploadProgress(70)

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('compliance-docs')
                .getPublicUrl(filePath)

            setUploadProgress(100)
            setUploadedFileUrl(publicUrl)
            toast.success('Certificate uploaded successfully')

        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Upload failed')
        } finally {
            setIsUploading(false)
            setTimeout(() => setUploadProgress(0), 1000)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        // ===== DUAL-MODE VALIDATION =====

        // India Mode: Cell Source is MANDATORY
        if (marketRegion === "INDIA" && !cellSource) {
            toast.error("Please specify Cell Source (Domestic/Imported) for India compliance")
            return
        }

        // India Mode + IMPORTED: IEC Code is MANDATORY
        if (marketRegion === "INDIA" && cellSource === "IMPORTED") {
            if (!user.iec_code) {
                toast.error("IEC Code is required for importing battery cells. Please add it in Organization Settings.")
                return
            }
        }

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
                    country_of_origin: countryOfOrigin,
                    recyclable,
                }
            }

            // Add EU specific fields
            if (marketRegion === "EU" || marketRegion === "GLOBAL") {
                payload.specs.carbon_footprint = carbonFootprint
                payload.specs.certifications = certifications

                // Add new EU fields
                payload.specs.material_composition = {
                    cobalt_pct: parseFloat(materialComposition.cobalt) || 0,
                    lithium_pct: parseFloat(materialComposition.lithium) || 0,
                    nickel_pct: parseFloat(materialComposition.nickel) || 0,
                    manganese_pct: parseFloat(materialComposition.manganese) || 0,
                    graphite_pct: parseFloat((materialComposition as any).graphite) || 0,
                    lead_pct: parseFloat(materialComposition.lead) || 0,
                }

                payload.specs.recycled_content_pct = parseFloat(recycledContent) || 0

                payload.specs.hazardous_substances = {
                    lead_present: hazardousSubstances.lead,
                    mercury_present: hazardousSubstances.mercury,
                    cadmium_present: hazardousSubstances.cadmium,
                    declaration: "Compliant with Battery Regulation 2023/1542"
                }

                payload.specs.eu_representative = euRepresentative
                payload.specs.eu_representative_email = euRepresentativeEmail
                payload.specs.expected_lifetime_cycles = parseInt(expectedLifetime) || 0
                payload.specs.warranty_months = parseInt(warrantyMonths) || 0
            }

            // Add India-specific fields
            if (marketRegion === "INDIA") {
                // PLI Compliant flag
                payload.pli_compliant = pliCompliant
                payload.hsn_code = hsnCode
                payload.dva_source = dvaSource

                if (dvaSource === "AUDITED") {
                    // Audited Mode - require certificate upload
                    if (!uploadedFileUrl) {
                        toast.error("Please upload the CA certificate before submitting")
                        setIsLoading(false)
                        return
                    }

                    const auditedVal = parseFloat(auditedDva) || 0
                    payload.audited_domestic_value_add = auditedVal
                    payload.pli_certificate_url = uploadedFileUrl
                } else {
                    // Estimated Mode (Legacy DVA)
                    const sale = parseFloat(salePrice) || 0
                    const cost = parseFloat(importCost) || 0
                    // Add Financials to Specs (Backend JSONB)
                    payload.specs.sale_price_inr = sale
                    payload.specs.import_cost_inr = cost

                    // We still send domestic_value_add but backend recalculates it for security in Estimated mode
                    const calculatedDva = sale > 0 ? ((sale - cost) / sale * 100) : 0
                    payload.domestic_value_add = Math.max(0, calculatedDva)
                }

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
        // Reset India Enterprise Fields
        setHsnCode("")
        setSalePrice("")
        setImportCost("")
        setCellSource("")
        setCertifications(["CE"])
        setManufacturerAddress("")
        setManufacturerEmail("")
        // Reset customs fields
        setBillOfEntryNo("")
        setCellCountryOfOrigin("")
        setCustomsDate("")
        // Reset Audit fields
        setDvaSource("ESTIMATED")
        setAuditedDva("")
        setUploadedFileUrl(null)
        setUploadProgress(0)
        setIsUploading(false)
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

                                    {/* Material Composition */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs border-b border-blue-500/20 pb-1">
                                            <Activity className="h-3.5 w-3.5" />
                                            Chemistry Breakdown (%)
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {["lithium", "cobalt", "graphite", "nickel", "manganese"].map((key) => (
                                                <div key={key} className="grid gap-1">
                                                    <Label htmlFor={key} className="text-xs capitalize text-zinc-400">{key} %</Label>
                                                    <Input
                                                        id={key}
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        value={(materialComposition as any)[key]}
                                                        onChange={(e) => setMaterialComposition(prev => ({ ...prev, [key]: e.target.value }))}
                                                        placeholder="0.0"
                                                        className="h-8 text-xs bg-zinc-800 border-zinc-700"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Responsible Supply Chain */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs border-b border-blue-500/20 pb-1">
                                            <Users className="h-3.5 w-3.5" />
                                            Responsible Supply Chain
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1">
                                                <Label htmlFor="euRep" className="text-xs text-zinc-400">EU Representative</Label>
                                                <Input
                                                    id="euRep"
                                                    value={euRepresentative}
                                                    onChange={(e) => setEuRepresentative(e.target.value)}
                                                    placeholder="Company Name"
                                                    className="h-8 text-xs bg-zinc-800 border-zinc-700"
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label htmlFor="euRepEmail" className="text-xs text-zinc-400">Rep Email</Label>
                                                <Input
                                                    id="euRepEmail"
                                                    value={euRepresentativeEmail}
                                                    onChange={(e) => setEuRepresentativeEmail(e.target.value)}
                                                    placeholder="email@eu-rep.com"
                                                    className="h-8 text-xs bg-zinc-800 border-zinc-700"
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label htmlFor="recycled" className="text-xs text-zinc-400">Recycled Content (%)</Label>
                                                <Input
                                                    id="recycled"
                                                    type="number"
                                                    value={recycledContent}
                                                    onChange={(e) => setRecycledContent(e.target.value)}
                                                    placeholder="0.0"
                                                    className="h-8 text-xs bg-zinc-800 border-zinc-700"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sustainability & Safety */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs border-b border-blue-500/20 pb-1">
                                            <Shield className="h-3.5 w-3.5" />
                                            Sustainability & Safety
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1">
                                                <Label htmlFor="lifecycle" className="text-xs text-zinc-400">Lifetime (Cycles)</Label>
                                                <Input
                                                    id="lifecycle"
                                                    type="number"
                                                    value={expectedLifetime}
                                                    onChange={(e) => setExpectedLifetime(e.target.value)}
                                                    placeholder="e.g. 1000"
                                                    className="h-8 text-xs bg-zinc-800 border-zinc-700"
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label htmlFor="warranty" className="text-xs text-zinc-400">Warranty (Months)</Label>
                                                <Input
                                                    id="warranty"
                                                    type="number"
                                                    value={warrantyMonths}
                                                    onChange={(e) => setWarrantyMonths(e.target.value)}
                                                    placeholder="e.g. 24"
                                                    className="h-8 text-xs bg-zinc-800 border-zinc-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2 pt-1">
                                            <Label className="text-xs text-zinc-400">Hazardous Substances (Check if present)</Label>
                                            <div className="flex gap-4">
                                                {Object.entries(hazardousSubstances).map(([key, checked]) => (
                                                    <div key={key} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`haz-${key}`}
                                                            checked={checked}
                                                            onChange={(e) => setHazardousSubstances(prev => ({ ...prev, [key]: e.target.checked }))}
                                                            className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                                                        />
                                                        <Label htmlFor={`haz-${key}`} className="text-xs capitalize font-normal cursor-pointer text-zinc-300">
                                                            {key}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2 border-t border-blue-500/20">
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

                                    {/* IEC ERROR BANNER for IMPORTED cells */}
                                    {iecError && cellSource === "IMPORTED" && (
                                        <div className="p-3 rounded-lg border-2 border-red-500/50 bg-red-500/20 space-y-2">
                                            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                                                <Shield className="h-5 w-5" />
                                                ⛔ IEC Code Required
                                            </div>
                                            <p className="text-xs text-red-300">
                                                Your Organization is missing an IEC Code. You cannot create IMPORTED batches until you add it in Settings.
                                            </p>
                                            <a
                                                href="/settings"
                                                target="_blank"
                                                className="inline-block text-xs px-3 py-1.5 bg-red-500/30 text-red-200 rounded hover:bg-red-500/40 transition-colors font-medium"
                                            >
                                                → Go to Organization Settings
                                            </a>
                                        </div>
                                    )}

                                    {/* Compliance Details */}
                                    <div className="grid gap-2 mb-4">
                                        <Label htmlFor="hsnCode" className="text-zinc-300">HSN Code <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="hsnCode"
                                            value={hsnCode}
                                            onChange={(e) => setHsnCode(e.target.value)}
                                            placeholder="e.g. 85076000"
                                            className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                            maxLength={8}
                                        />
                                        <p className="text-[10px] text-zinc-500">Must start with 8507 (Li-ion accumulators)</p>
                                    </div>

                                    {/* DVA Calculation Section - HIDE for IMPORTED cells */}
                                    {cellSource !== "IMPORTED" && (
                                        <>
                                            {/* DVA Calculation Method Selection */}
                                            <div className="flex items-center justify-between mb-4 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                                                <Label htmlFor="auditedMode" className="cursor-pointer flex items-center gap-2">
                                                    <Shield className={`h-4 w-4 ${dvaSource === "AUDITED" ? "text-emerald-400" : "text-zinc-400"}`} />
                                                    <span>I have an Audited CA Certificate</span>
                                                </Label>
                                                <input
                                                    type="checkbox"
                                                    id="auditedMode"
                                                    checked={dvaSource === "AUDITED"}
                                                    onChange={(e) => setDvaSource(e.target.checked ? "AUDITED" : "ESTIMATED")}
                                                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                                                />
                                            </div>

                                            {dvaSource === "AUDITED" ? (
                                                // AUDITED Mode UI
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                                                        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                                                            <Shield className="h-4 w-4" />
                                                            Audited Compliance Mode
                                                        </div>
                                                        <p className="text-xs text-emerald-300/80">
                                                            Enter the final DVA percentage certified by your Chartered Accountant.
                                                            This value overrides estimated calculations.
                                                        </p>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="auditedDva" className="text-zinc-300">
                                                            Audited DVA % <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id="auditedDva"
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                            value={auditedDva}
                                                            onChange={(e) => setAuditedDva(e.target.value)}
                                                            placeholder="e.g. 55.5"
                                                            className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                                        />
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label className="text-zinc-300">Upload CA Certificate (PDF)</Label>

                                                        {/* Upload Zone */}
                                                        {!uploadedFileUrl ? (
                                                            <div className="flex items-center justify-center w-full">
                                                                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploading
                                                                    ? 'border-emerald-500 bg-emerald-500/5'
                                                                    : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
                                                                    }`}>
                                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                        {isUploading ? (
                                                                            <>
                                                                                <div className="w-full px-8 mb-3">
                                                                                    <div className="w-full bg-zinc-700 rounded-full h-2">
                                                                                        <div
                                                                                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                                                                            style={{ width: `${uploadProgress}%` }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <p className="text-sm text-emerald-400">Uploading... ({uploadProgress}%)</p>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <FileText className="w-8 h-8 mb-3 text-zinc-400" />
                                                                                <p className="text-sm text-zinc-400">
                                                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                                                </p>
                                                                                <p className="text-xs text-zinc-500">PDF only (MAX. 5MB)</p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        accept=".pdf"
                                                                        disabled={isUploading}
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0]
                                                                            if (file) {
                                                                                if (file.size > 5242880) {
                                                                                    toast.error('File size must be less than 5MB')
                                                                                    return
                                                                                }
                                                                                if (file.type !== 'application/pdf') {
                                                                                    toast.error('Only PDF files are allowed')
                                                                                    return
                                                                                }
                                                                                handleCertificateUpload(file)
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                            </div>
                                                        ) : (
                                                            /* Uploaded State */
                                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <FileCheck className="h-5 w-5 text-emerald-400" />
                                                                        <div>
                                                                            <p className="text-sm font-medium text-emerald-400">Certificate Uploaded</p>
                                                                            <p className="text-xs text-emerald-300/70">Ready for submission</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <a
                                                                            href={uploadedFileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                                                                        >
                                                                            View File
                                                                        </a>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setUploadedFileUrl(null)}
                                                                            className="text-xs px-3 py-1 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors"
                                                                        >
                                                                            Replace
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                // ESTIMATED Mode UI (Original Calculator)
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                                                        <Calculator className="h-4 w-4 text-indigo-400" />
                                                        Indicative DVA Estimator
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="salePrice" className="text-zinc-300">Sale Price (₹)</Label>
                                                            <Input
                                                                id="salePrice"
                                                                type="number"
                                                                min="0"
                                                                value={salePrice}
                                                                onChange={(e) => setSalePrice(e.target.value)}
                                                                placeholder="0.00"
                                                                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="importCost" className="text-zinc-300">Imp. Material Cost (₹)</Label>
                                                            <Input
                                                                id="importCost"
                                                                type="number"
                                                                min="0"
                                                                value={importCost}
                                                                onChange={(e) => setImportCost(e.target.value)}
                                                                placeholder="0.00"
                                                                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Calculated DVA Display */}
                                                    {(salePrice && importCost) && (
                                                        <div className="space-y-2">
                                                            <div className={`p-3 rounded border text-center text-sm font-semibold ${((parseFloat(salePrice) - parseFloat(importCost)) / parseFloat(salePrice) * 100) >= 50
                                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                                : "bg-red-500/10 border-red-500/30 text-red-400"
                                                                }`}>
                                                                Estimated DVA: {Math.max(0, ((parseFloat(salePrice) - parseFloat(importCost)) / parseFloat(salePrice) * 100)).toFixed(1)}%
                                                                <span className="ml-1 opacity-80">
                                                                    {((parseFloat(salePrice) - parseFloat(importCost)) / parseFloat(salePrice) * 100) >= 50 ? "(Potentially Eligible)" : "(Ineligible)"}
                                                                </span>
                                                            </div>

                                                            {/* Legal Warning Banner */}
                                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200/80 text-xs flex gap-2 items-start">
                                                                <Activity className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                                                <span>
                                                                    <strong>Note:</strong> This is an estimated value based on raw material costs.
                                                                    Final PLI eligibility requires certification by a Chartered Accountant.
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Cell Source Selection */}
                                    <div className="grid gap-2 pt-2">
                                        <Label htmlFor="cellSource" className="text-zinc-300">
                                            Cell Source <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="cellSource"
                                            value={cellSource}
                                            onChange={(e) => setCellSource(e.target.value as any)}
                                            className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 ${!cellSource && marketRegion === "INDIA"
                                                ? "border-red-500/50 bg-zinc-800"
                                                : "border-zinc-700 bg-zinc-800"
                                                }`}
                                            required
                                        >
                                            <option value="">-- Select Cell Source --</option>
                                            <option value="DOMESTIC">🏭 Domestic (Enables DVA Calculator)</option>
                                            <option value="IMPORTED">📦 Imported (Requires IEC Code)</option>
                                        </select>
                                        <p className="text-[10px] text-zinc-500">
                                            Required for India compliance. Determines customs and PLI eligibility.
                                        </p>
                                    </div>

                                    {/* PLI Checkbox with Auto-Disable for IMPORTED */}
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="pliCompliant"
                                                checked={pliCompliant}
                                                onChange={(e) => setPliCompliant(e.target.checked)}
                                                disabled={cellSource === "IMPORTED"}
                                                className={`h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500 ${cellSource === "IMPORTED" ? "opacity-50 cursor-not-allowed" : ""
                                                    }`}
                                            />
                                            <Label
                                                htmlFor="pliCompliant"
                                                className={`font-normal cursor-pointer text-zinc-300 ${cellSource === "IMPORTED" ? "opacity-50" : ""
                                                    }`}
                                            >
                                                PLI Subsidy Eligible
                                            </Label>
                                        </div>

                                        {/* Warning for IMPORTED cells */}
                                        {cellSource === "IMPORTED" && (
                                            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-200/90 text-xs flex gap-2 items-start">
                                                <Activity className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                                <span>
                                                    ⚠️ Imported cells typically constitute &gt;60% of cost, making the batch ineligible for PLI (Requires ≥50% Local Value Add).
                                                </span>
                                            </div>
                                        )}
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

                            {/* ===== CHEMISTRY BREAKDOWN (Global) ===== */}
                            <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10 space-y-4">
                                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                                    <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                                        <Activity className="h-4 w-4" />
                                        🧪 Material Composition (Chemistry Breakdown)
                                    </div>
                                    <div className={`text-xs font-mono font-bold ${Object.values(materialComposition).reduce((a, b) => a + (parseFloat(b) || 0), 0) > 100
                                        ? "text-red-400"
                                        : "text-purple-300"
                                        }`}>
                                        Total: {Object.values(materialComposition).reduce((a, b) => a + (parseFloat(b) || 0), 0).toFixed(1)}%
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { key: "lithium", label: "Lithium" },
                                        { key: "graphite", label: "Graphite" },
                                        { key: "cobalt", label: "Cobalt" },
                                        { key: "nickel", label: "Nickel" },
                                        { key: "manganese", label: "Manganese" }
                                    ].map(({ key, label }) => (
                                        <div key={key} className="grid gap-1">
                                            <Label htmlFor={key} className="text-[10px] uppercase text-zinc-400 truncate" title={label}>
                                                {label} %
                                            </Label>
                                            <Input
                                                id={key}
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={(materialComposition as any)[key]}
                                                onChange={(e) => setMaterialComposition(prev => ({ ...prev, [key]: e.target.value }))}
                                                placeholder="0.0"
                                                className="h-8 text-xs bg-zinc-800 border-zinc-700 px-2"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {Object.values(materialComposition).reduce((a, b) => a + (parseFloat(b) || 0), 0) > 100 && (
                                    <p className="text-[10px] text-red-400 mt-1">
                                        ⚠️ Total percentage cannot exceed 100%. Please adjust values.
                                    </p>
                                )}
                            </div>
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
                        <Button type="submit" disabled={isLoading || iecError}>
                            {isLoading ? "Creating..." : "Create Batch"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
