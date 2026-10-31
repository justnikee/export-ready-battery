"use client"

import { useState } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BatchCombobox } from "@/components/batches/batch-combobox"
import { toast } from "sonner"
import { Calculator, Leaf, Save, ChevronDown, ChevronUp, Factory, Truck, Atom, Zap, Info, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Types matching backend CarbonInput / CarbonResult
interface CarbonInput {
 chemistry: string
 capacity_kwh: number
 cell_source_country: string
 factory_country: string
 assembly_energy_kwh: number
 transport_mode: string
 transport_distance_km: number
 battery_weight_kg: number
}

interface CarbonBreakdown {
 cell_production_kg_co2e: number
 cell_energy_kg_co2e: number
 assembly_kg_co2e: number
 transport_kg_co2e: number
}

interface FactorUsed {
 category: string
 subcategory: string
 value: number
 unit: string
 source: string
}

interface CarbonResult {
 total_kg_co2e: number
 per_kwh_kg_co2e: number
 carbon_class: string
 breakdown: CarbonBreakdown
 methodology: string
 calculation_date: string
 declaration_text: string
 factors_used: FactorUsed[]
}

interface CarbonCalculatorProps {
 // Omit batchId to run standalone (e.g. /dashboard/carbon-calculator): shows a
 // batch picker for "Apply to Batch" instead of saving straight to one batch,
 // plus a session history of recent calculations.
 batchId?: string
 chemistry?: string
 capacity?: string
 weight?: string
 existingResult?: CarbonResult | null
 onResultSaved?: () => void
}

const HISTORY_STORAGE_KEY = "carbon-calculator-history"
const HISTORY_LIMIT = 5

interface HistoryEntry {
 input: CarbonInput
 result: CarbonResult
 calculatedAt: string
}

function loadHistory(): HistoryEntry[] {
 if (typeof window === "undefined") return []
 try {
 const raw = window.sessionStorage.getItem(HISTORY_STORAGE_KEY)
 return raw ? JSON.parse(raw) : []
 } catch {
 return []
 }
}

function saveHistory(entries: HistoryEntry[]) {
 if (typeof window === "undefined") return
 window.sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
}

const CHEMISTRIES = [
 { value: "LFP", label: "LFP (Lithium Iron Phosphate)" },
 { value: "NMC_622", label: "NMC 622" },
 { value: "NMC_811", label: "NMC 811" },
 { value: "NCA", label: "NCA (Nickel Cobalt Aluminium)" },
 { value: "LCO", label: "LCO (Lithium Cobalt Oxide)" },
 { value: "SODIUM", label: "Sodium-Ion" },
]

const TRANSPORT_MODES = [
 { value: "SHIP", label: "Ship (Sea freight)" },
 { value: "RAIL", label: "Rail" },
 { value: "TRUCK", label: "Truck" },
 { value: "AIR", label: "Air freight" },
]

// Every country here must have a seeded ENERGY_MIX factor in the backend
// (services/battery-api/internal/db/migrations/000031 and 000042) — the
// calculator falls back to a GLOBAL average for anything else, but keeping
// this list backend-backed means the displayed factor is always country-specific.
const COUNTRIES = [
 // Asia-Pacific battery manufacturing hubs
 { value: "CN", label: "🇨🇳 China" },
 { value: "IN", label: "🇮🇳 India" },
 { value: "KR", label: "🇰🇷 South Korea" },
 { value: "JP", label: "🇯🇵 Japan" },
 { value: "VN", label: "🇻🇳 Vietnam" },
 { value: "MY", label: "🇲🇾 Malaysia" },
 { value: "ID", label: "🇮🇩 Indonesia" },
 { value: "TH", label: "🇹🇭 Thailand" },
 { value: "TW", label: "🇹🇼 Taiwan" },
 { value: "AU", label: "🇦🇺 Australia" },
 // Europe
 { value: "DE", label: "🇩🇪 Germany" },
 { value: "GB", label: "🇬🇧 United Kingdom" },
 { value: "FR", label: "🇫🇷 France" },
 { value: "IT", label: "🇮🇹 Italy" },
 { value: "ES", label: "🇪🇸 Spain" },
 { value: "NL", label: "🇳🇱 Netherlands" },
 { value: "BE", label: "🇧🇪 Belgium" },
 { value: "AT", label: "🇦🇹 Austria" },
 { value: "PT", label: "🇵🇹 Portugal" },
 { value: "PL", label: "🇵🇱 Poland" },
 { value: "HU", label: "🇭🇺 Hungary" },
 { value: "CZ", label: "🇨🇿 Czech Republic" },
 { value: "RO", label: "🇷🇴 Romania" },
 { value: "SK", label: "🇸🇰 Slovakia" },
 { value: "FI", label: "🇫🇮 Finland" },
 { value: "DK", label: "🇩🇰 Denmark" },
 { value: "NO", label: "🇳🇴 Norway" },
 { value: "SE", label: "🇸🇪 Sweden" },
 { value: "CH", label: "🇨🇭 Switzerland" },
 // Americas & rest of world
 { value: "US", label: "🇺🇸 United States" },
 { value: "MX", label: "🇲🇽 Mexico" },
 { value: "BR", label: "🇧🇷 Brazil" },
 { value: "ZA", label: "🇿🇦 South Africa" },
 { value: "TR", label: "🇹🇷 Turkey" },
]

// Nominal cell voltage by chemistry, used to convert Ah capacity to kWh.
// 3.7V (generic Li-ion) is wrong for LFP (3.2V) and others — overstates
// LFP carbon footprint by ~15% since kWh is the input to the carbon model.
const NOMINAL_VOLTAGE_BY_CHEMISTRY: Record<string, number> = {
 LFP: 3.2,
 SODIUM: 3.1,
 NMC_622: 3.6,
 NMC_811: 3.65,
 NCA: 3.65,
 LCO: 3.7,
}

// Helper to parse a capacity string like "50 Ah" or "3.7 kWh" into kWh
function parseCapacity(raw?: string, chemistry?: string): number {
 if (!raw) return 0
 const num = parseFloat(raw)
 if (isNaN(num)) return 0
 const lower = raw.toLowerCase()
 if (lower.includes("kwh")) return num
 if (lower.includes("ah")) {
 const voltage = NOMINAL_VOLTAGE_BY_CHEMISTRY[chemistry?.toUpperCase() ?? ""] ?? 3.6
 return (num * voltage) / 1000
 }
 return num
}

function parseWeight(raw?: string): number {
 if (!raw) return 0
 const num = parseFloat(raw)
 if (isNaN(num)) return 0
 const lower = raw.toLowerCase()
 if (lower.includes("g") && !lower.includes("kg")) return num / 1000
 return num
}

export function CarbonCalculator({ batchId, chemistry, capacity, weight, existingResult, onResultSaved }: CarbonCalculatorProps) {
 const standalone = !batchId
 const [expanded, setExpanded] = useState(!existingResult)
 const [calculating, setCalculating] = useState(false)
 const [saving, setSaving] = useState(false)
 const [result, setResult] = useState<CarbonResult | null>(existingResult || null)
 const [showFactors, setShowFactors] = useState(false)
 const [history, setHistory] = useState<HistoryEntry[]>(() => (standalone ? loadHistory() : []))

 // Standalone mode only: batch picker for "Apply to Batch"
 const [selectedBatchId, setSelectedBatchId] = useState("")

 // Form state — pre-fill from batch specs where possible
 const [form, setForm] = useState<CarbonInput>({
 chemistry: chemistry || "LFP",
 capacity_kwh: parseCapacity(capacity, chemistry) || 50,
 cell_source_country: "CN",
 factory_country: "IN",
 assembly_energy_kwh: 25,
 transport_mode: "SHIP",
 transport_distance_km: 5000,
 battery_weight_kg: parseWeight(weight) || 25,
 })

 const updateField = <K extends keyof CarbonInput>(field: K, value: CarbonInput[K]) => {
 setForm(prev => ({ ...prev, [field]: value }))
 }

 const handleCalculate = async () => {
 setCalculating(true)
 try {
 const response = await api.post<CarbonResult>("/carbon/calculate", form)
 setResult(response.data)
 toast.success("Carbon footprint calculated", {
 description: `${response.data.total_kg_co2e.toFixed(1)} kg CO₂e total (${response.data.per_kwh_kg_co2e.toFixed(1)} kg/kWh)`,
 })
 if (standalone) {
 const next = [
 { input: form, result: response.data, calculatedAt: new Date().toISOString() },
 ...history,
 ].slice(0, HISTORY_LIMIT)
 setHistory(next)
 saveHistory(next)
 }
 } catch (error: unknown) {
 const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Calculation failed"
 toast.error(msg)
 } finally {
 setCalculating(false)
 }
 }

 const handleSaveToBatch = async () => {
 if (!result) return
 const targetBatchId = batchId || selectedBatchId
 if (!targetBatchId) {
 toast.error("Select a batch first")
 return
 }
 setSaving(true)
 try {
 await api.post(`/batches/${targetBatchId}/carbon`, result)
 toast.success("Carbon footprint saved to batch", {
 description: `Internal band ${result.carbon_class} · screening estimate, not a PEFCR Art. 7 declaration.`,
 })
 onResultSaved?.()
 } catch (error: unknown) {
 const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save"
 toast.error(msg)
 } finally {
 setSaving(false)
 }
 }

 const handleLoadHistoryEntry = (entry: HistoryEntry) => {
 setForm(entry.input)
 setResult(entry.result)
 setExpanded(true)
 }

 // Breakdown bar chart data
 const breakdownItems = result ? [
 { label: "Cell Production", value: result.breakdown.cell_production_kg_co2e, color: "bg-blue-500/100", icon: Atom },
 { label: "Cell Energy", value: result.breakdown.cell_energy_kg_co2e, color: "bg-cyan-500", icon: Zap },
 { label: "Assembly", value: result.breakdown.assembly_kg_co2e, color: "bg-amber-500/100", icon: Factory },
 { label: "Transport", value: result.breakdown.transport_kg_co2e, color: "bg-rose-500", icon: Truck },
 ] : []

 const maxBreakdownValue = breakdownItems.length > 0 ? Math.max(...breakdownItems.map(i => i.value)) : 1

 return (
 <>
 <Card className="border border-border">
 <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
 <div className="flex items-center justify-between">
 <CardTitle className="flex items-center gap-3 text-foreground">
 <div className="p-2 bg-emerald-500/10">
 <Leaf className="h-5 w-5 text-emerald-500" />
 </div>
 Carbon Footprint Calculator
 {result && (
 <Badge className="bg-emerald-100 text-emerald-500 border-emerald-200 ml-2">
 {result.total_kg_co2e.toFixed(1)} kg CO₂e
 </Badge>
 )}
 </CardTitle>
 <Button variant="ghost" size="icon" className="text-muted-foreground">
 {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
 </Button>
 </div>
 <CardDescription className="text-muted-foreground">
 Screening estimate for pack carbon. Not PEFCR, not an Article 7 declaration, not a Commission class.
 </CardDescription>
 </CardHeader>

 {expanded && (
 <CardContent className="space-y-6">
 {/* Input Form */}
 <div className="grid grid-cols-2 gap-4">
 {/* Chemistry */}
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
 <Atom className="h-3.5 w-3.5" /> Chemistry
 </Label>
 <Select value={form.chemistry} onValueChange={v => updateField("chemistry", v)}>
 <SelectTrigger className="bg-background border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {CHEMISTRIES.map(c => (
 <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Capacity */}
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
 <Zap className="h-3.5 w-3.5" /> Capacity (kWh)
 </Label>
 <Input
 type="number"
 step="0.1"
 value={form.capacity_kwh}
 onChange={e => updateField("capacity_kwh", parseFloat(e.target.value) || 0)}
 className="bg-background border-border"
 />
 </div>

 {/* Cell Source Country */}
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cell Source Country</Label>
 <Select value={form.cell_source_country} onValueChange={v => updateField("cell_source_country", v)}>
 <SelectTrigger className="bg-background border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {COUNTRIES.map(c => (
 <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Factory Country */}
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
 <Factory className="h-3.5 w-3.5" /> Assembly Factory Country
 </Label>
 <Select value={form.factory_country} onValueChange={v => updateField("factory_country", v)}>
 <SelectTrigger className="bg-background border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {COUNTRIES.map(c => (
 <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Assembly Energy */}
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assembly Energy (kWh / pack)</Label>
 <Input
 type="number"
 step="0.1"
 value={form.assembly_energy_kwh}
 onChange={e => updateField("assembly_energy_kwh", parseFloat(e.target.value) || 0)}
 className="bg-background border-border"
 />
 </div>

 {/* Battery Weight */}
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Battery Weight (kg)</Label>
 <Input
 type="number"
 step="0.1"
 value={form.battery_weight_kg}
 onChange={e => updateField("battery_weight_kg", parseFloat(e.target.value) || 0)}
 className="bg-background border-border"
 />
 </div>

 {/* Transport Mode */}
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
 <Truck className="h-3.5 w-3.5" /> Transport Mode
 </Label>
 <Select value={form.transport_mode} onValueChange={v => updateField("transport_mode", v)}>
 <SelectTrigger className="bg-background border-border">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {TRANSPORT_MODES.map(m => (
 <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Transport Distance */}
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Transport Distance (km)</Label>
 <Input
 type="number"
 step="100"
 value={form.transport_distance_km}
 onChange={e => updateField("transport_distance_km", parseFloat(e.target.value) || 0)}
 className="bg-background border-border"
 />
 </div>
 </div>

 {/* Calculate Button */}
 <Button
 onClick={handleCalculate}
 disabled={calculating}
 className="w-full bg-emerald-600 hover:bg-emerald-500/100 text-white shadow-none shadow-emerald-500/20"
 >
 {calculating ? (
 <>
 <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
 Calculating...
 </>
 ) : (
 <>
 <Calculator className="mr-2 h-4 w-4" />
 Calculate Carbon Footprint
 </>
 )}
 </Button>

 {/* Results */}
 {result && (
 <div className="space-y-4 pt-2">
 {/* Summary Row */}
 <div className="grid grid-cols-3 gap-4">
 <div className="p-4 bg-emerald-500/10 rounded-lg">
 <div className="text-xs text-emerald-500 uppercase tracking-wider mb-1">Total Carbon Footprint</div>
 <div className="text-2xl text-emerald-500">{result.total_kg_co2e.toFixed(1)} <span className="text-sm font-normal">kg CO₂e</span></div>
 </div>
 <div className="p-4 bg-blue-500/10 rounded-lg">
 <div className="text-xs text-blue-500 uppercase tracking-wider mb-1">Per kWh</div>
 <div className="text-2xl text-blue-500">{result.per_kwh_kg_co2e.toFixed(2)} <span className="text-sm font-normal">kg CO₂e / kWh</span></div>
 </div>
 <div className="p-4 bg-amber-500/10 rounded-lg">
 <div className="text-xs text-amber-600 uppercase tracking-wider mb-1">Performance Class</div>
 <div className="text-2xl text-amber-600">{result.carbon_class} <span className="text-sm font-normal">/ G</span></div>
 </div>
 </div>

 {/* Breakdown Bar Chart */}
 <div className="p-4 bg-background border border-border space-y-3">
 <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Breakdown</div>
 {breakdownItems.map(item => (
 <div key={item.label} className="space-y-1">
 <div className="flex items-center justify-between text-sm">
 <span className="flex items-center gap-2 text-foreground">
 <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
 {item.label}
 </span>
 <span className="font-mono text-foreground">{item.value.toFixed(1)} kg</span>
 </div>
 <div className="h-2 bg-muted rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full ${item.color} transition-all duration-500`}
 style={{ width: `${(item.value / maxBreakdownValue) * 100}%` }}
 />
 </div>
 </div>
 ))}
 </div>

 {/* Declaration */}
 <div className="p-4 bg-background border border-border">
 <div className="flex items-start gap-2">
 <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
 <div>
 <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Declaration</div>
 <p className="text-sm text-foreground leading-relaxed">{result.declaration_text}</p>
 <p className="text-xs text-muted-foreground mt-2">Methodology: {result.methodology} · Calculated: {new Date(result.calculation_date).toLocaleDateString()}</p>
 </div>
 </div>
 </div>

 {/* Factors Used (collapsible) */}
 {result.factors_used && result.factors_used.length > 0 && (
 <div>
 <button
 onClick={() => setShowFactors(!showFactors)}
 className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
 >
 {showFactors ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
 {showFactors ? "Hide" : "Show"} factors used ({result.factors_used.length})
 </button>
 {showFactors && (
 <div className="mt-2 border border-border overflow-hidden">
 <table className="w-full text-xs">
 <thead className="bg-background text-muted-foreground">
 <tr>
 <th className="text-left px-3 py-2">Category</th>
 <th className="text-left px-3 py-2">Subcategory</th>
 <th className="text-right px-3 py-2">Value</th>
 <th className="text-left px-3 py-2">Unit</th>
 <th className="text-left px-3 py-2">Source</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {result.factors_used.map((f, i) => (
 <tr key={i} className="text-foreground">
 <td className="px-3 py-2">{f.category}</td>
 <td className="px-3 py-2">{f.subcategory}</td>
 <td className="px-3 py-2 text-right font-mono">{f.value.toFixed(4)}</td>
 <td className="px-3 py-2">{f.unit}</td>
 <td className="px-3 py-2 text-muted-foreground">{f.source}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {/* Save / Apply to Batch */}
 {standalone && (
 <div className="space-y-2">
 <Label className="text-xs uppercase tracking-wider text-muted-foreground">Apply to Batch</Label>
 <BatchCombobox
 value={selectedBatchId}
 onChange={setSelectedBatchId}
 status="ACTIVE"
 placeholder="Select a batch..."
 className="w-full"
 />
 </div>
 )}
 <Button
 onClick={handleSaveToBatch}
 disabled={saving || (standalone && !selectedBatchId)}
 className="w-full bg-blue-600 hover:bg-blue-500/100 text-white"
 >
 {saving ? (
 <>
 <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
 Saving...
 </>
 ) : (
 <>
 <Save className="mr-2 h-4 w-4" />
 {standalone ? "Apply to Batch" : "Save Result to Batch"}
 </>
 )}
 </Button>
 </div>
 )}
 </CardContent>
 )}
 </Card>

 {standalone && history.length > 0 && (
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="flex items-center gap-2 text-sm text-foreground">
 <History className="h-4 w-4 text-muted-foreground" />
 Recent Calculations (this session)
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-2">
 {history.map((entry, i) => (
 <button
 key={i}
 onClick={() => handleLoadHistoryEntry(entry)}
 className="w-full flex items-center justify-between p-3 bg-background border border-border hover:border-emerald-500/40 transition-colors text-left"
 >
 <div className="text-xs text-foreground">
 {entry.input.chemistry} · {entry.input.capacity_kwh} kWh · {entry.input.cell_source_country} → {entry.input.factory_country}
 </div>
 <div className="flex items-center gap-3 shrink-0">
 <Badge className="bg-emerald-100 text-emerald-500 border-emerald-200 text-[10px]">
 Class {entry.result.carbon_class}
 </Badge>
 <span className="text-[10px] text-muted-foreground">
 {new Date(entry.calculatedAt).toLocaleTimeString()}
 </span>
 </div>
 </button>
 ))}
 </CardContent>
 </Card>
 )}
 </>
 )
}
