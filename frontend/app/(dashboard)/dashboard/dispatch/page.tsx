"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"
import { Scan, Trash2, Truck, CheckCircle, AlertCircle, RefreshCw, Volume2, VolumeX, Target, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { DispatchSkeleton } from "@/components/dispatch/DispatchSkeleton"

// Types
interface ScannedItem {
    id: string // UUID
    rawValue: string // What was scanned
    timestamp: Date
    error?: string // Error message if dispatch failed
    failed?: boolean // Mark as failed after partial dispatch
}

const STORAGE_KEY = 'dispatch_pending_items'

export default function DispatchPage() {
    const router = useRouter()
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
    const [inputValue, setInputValue] = useState("")
    const [shipmentReference, setShipmentReference] = useState("")
    const [shipmentDate, setShipmentDate] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [isFocused, setIsFocused] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Audio Context Ref
    const audioContextRef = useRef<AudioContext | null>(null)

    // Initialize Audio Context on first user interaction
    useEffect(() => {
        const initAudio = () => {
            if (!audioContextRef.current) {
                const audioConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
                if (audioConstructor) {
                    audioContextRef.current = new audioConstructor()
                }
            }
        }
        window.addEventListener('click', initAudio)
        window.addEventListener('keydown', initAudio)
        return () => {
            window.removeEventListener('click', initAudio)
            window.removeEventListener('keydown', initAudio)
        }
    }, [])

    // Sound Generator
    const playSound = (type: 'success' | 'error' | 'duplicate') => {
        if (!soundEnabled || !audioContextRef.current) return

        const ctx = audioContextRef.current
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        if (type === 'success') {
            // High pitch beep
            osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
            osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1) // A6
            gain.gain.setValueAtTime(0.1, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.1)
        } else if (type === 'error') {
            // Low buzz
            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(150, ctx.currentTime)
            gain.gain.setValueAtTime(0.2, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.3)
        } else if (type === 'duplicate') {
            // Double low beep
            osc.type = 'square'
            osc.frequency.setValueAtTime(300, ctx.currentTime)
            gain.gain.setValueAtTime(0.1, ctx.currentTime)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.1)
        }
    }

    // Safety Net #1: LocalStorage Persistence
    useEffect(() => {
        // Restore pending items on mount (crash recovery)
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Restore timestamps as Date objects
                    const restored = parsed.map(item => ({
                        ...item,
                        timestamp: new Date(item.timestamp)
                    }))
                    setScannedItems(restored)
                    toast.success(`Recovered ${restored.length} pending items from previous session`, {
                        description: 'Your scans were safely restored'
                    })
                }
            } catch (e) {
                console.error('Failed to restore pending items:', e)
                localStorage.removeItem(STORAGE_KEY)
            }
        }
        setIsInitialized(true)
    }, [])

    // Persist to localStorage whenever items change
    useEffect(() => {
        if (scannedItems.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scannedItems))
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [scannedItems])

    // Auto-focus input on mount and retain focus
    useEffect(() => {
        const focusInput = () => inputRef.current?.focus()
        focusInput()
    }, [])

    const extractUUID = (input: string): string | null => {
        // Regex for UUID
        const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
        const match = input.match(uuidRegex)
        return match ? match[0] : null
    }

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault()
        const raw = inputValue.trim()
        if (!raw) return

        // Validate
        const uuid = extractUUID(raw)
        if (!uuid) {
            playSound('error')
            toast.error("Invalid Scan: Could not find valid Passport UUID")
            setInputValue("")
            return
        }

        // Check duplicate
        if (scannedItems.some(item => item.id === uuid)) {
            playSound('duplicate')
            toast.warning("Duplicate: Item already in pending list")
            setInputValue("")
            return
        }

        // Add to list
        const newItem: ScannedItem = {
            id: uuid,
            rawValue: raw,
            timestamp: new Date()
        }

        setScannedItems(prev => [newItem, ...prev])
        playSound('success')
        setInputValue("")
    }

    const handleRemove = (idToRemove: string) => {
        setScannedItems(prev => prev.filter(item => item.id !== idToRemove))
    }

    const handleConfirmDispatch = async () => {
        if (scannedItems.length === 0) return
        if (!shipmentReference.trim()) {
            toast.error("Please enter a shipment reference")
            return
        }
        if (!shipmentDate.trim()) {
            toast.error("Please enter a shipment date")
            return
        }

        setIsSubmitting(true)
        try {
            const passportIds = scannedItems.map(item => item.id)

            const bulkTransition = async (action: string, evidence?: Record<string, unknown>) => {
                const response = await api.post("/passports/bulk/transition", {
                    passport_ids: passportIds,
                    action: action,
                    evidence: evidence || {}
                })
                return response.data as {
                    total: number
                    succeeded: number
                    failed: number
                    failed_ids?: string[]
                    errors?: string[]
                }
            }

            // Phase 2 action flow: ACTIVATE (if needed), then SHIP
            await bulkTransition("ACTIVATE")

            const result = await bulkTransition("SHIP", {
                shipment_reference: shipmentReference,
                shipment_date: shipmentDate
            })

            // Safety Net #2: Partial Failure Handling
            const successCount = result.succeeded || 0
            const failedCount = result.failed || 0

            if (failedCount === 0) {
                // Complete success
                toast.success(`Successfully dispatched ${successCount} units!`)
                setScannedItems([])
                setShipmentReference("")
                setShipmentDate("")
                localStorage.removeItem(STORAGE_KEY) // Clear storage on success
            } else {
                // Partial failure: Keep only failed items
                const failedIds = new Set(result.failed_ids || [])
                const errorsById = new Map<string, string>()
                if (result.errors && result.failed_ids && result.errors.length === result.failed_ids.length) {
                    result.failed_ids.forEach((id, idx) => {
                        errorsById.set(id, result.errors![idx])
                    })
                }

                const updatedItems = scannedItems
                    .filter(item => failedIds.has(item.id))
                    .map(item => ({
                        ...item,
                        failed: true,
                        error: errorsById.get(item.id) || 'Transition failed'
                    }))

                setScannedItems(updatedItems)
                toast.warning(
                    `Dispatched ${successCount} units. ${failedCount} failed - see list for details`,
                    { duration: 5000 }
                )
                playSound('error')
            }

            inputRef.current?.focus()
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { error?: string } } }
            console.error("Dispatch failed:", error)
            toast.error(apiError.response?.data?.error || "Failed to process dispatch")
            playSound('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Show skeleton during hydration
    if (!isInitialized) {
        return <DispatchSkeleton />
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-8">
            <div className="w-full mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Truck className="h-5 w-5 text-white" />
                            </div>
                            Rapid Dispatch
                        </h1>
                        <p className="text-muted-foreground mt-1 ml-[52px]">
                            High-volume scanning • Keyboard-first • Auto-dispatch
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard')}
                            className="border-border text-foreground hover:bg-muted"
                        >
                            Exit Mode
                        </Button>
                    </div>
                </div>

                {/* Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Col: Scanning Area */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Scanner Input - THE HERO */}
                        <div className="relative">
                            {/* Animated glow effect when focused */}
                            <div className={`absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 rounded-xl blur-lg transition-opacity duration-500 ${isFocused ? 'opacity-20' : 'opacity-0'}`} />

                            <Card className={`relative p-6 bg-card border-2 transition-colors duration-300 shadow-none ${isFocused ? 'border-amber-500' : 'border-border'}`}>
                                {/* Targeting corners */}
                                <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-amber-500/40" />
                                <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-amber-500/40" />
                                <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-amber-500/40" />
                                <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-amber-500/40" />

                                <form onSubmit={handleScan} className="flex flex-col gap-3">
                                    <Label htmlFor="scannerInput" className="text-sm font-semibold text-amber-500 flex items-center gap-2 uppercase tracking-wider">
                                        <Scan className="h-4 w-4" />
                                        Scanner Input
                                        {isFocused && (
                                            <>
                                                <span className="w-2 h-2 bg-amber-500/100 rounded-full animate-pulse" />
                                                <span className="text-xs text-amber-500/70 font-normal normal-case">Ready</span>
                                            </>
                                        )}
                                    </Label>
                                    <Input
                                        id="scannerInput"
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        placeholder="Waiting to scan..."
                                        className="h-20 text-2xl font-mono bg-muted border-border text-foreground focus-visible:border-amber-500 focus-visible:ring-amber-500/30 placeholder:text-muted-foreground"
                                        autoComplete="off"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono text-muted-foreground">Enter</kbd>
                                            to submit scan
                                        </span>
                                        <span>Supported: UUIDs, QR URLs</span>
                                    </div>
                                </form>
                            </Card>
                        </div>

                        {/* Pending List */}
                        <div className="flex-1 flex flex-col bg-card rounded-xl border border-border p-5 min-h-[300px] shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                                    <Package className="h-5 w-5 text-amber-500" />
                                    Pending Scans
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-mono font-bold transition-all duration-300 ${scannedItems.length > 0
                                    ? 'bg-amber-100 text-amber-500 shadow-none'
                                    : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {scannedItems.length} units
                                </span>
                            </div>

                            {scannedItems.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/50">
                                    {/* Animated target icon */}
                                    <div className="relative mb-4">
                                        <Target className="h-16 w-16 text-muted-foreground" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-amber-500/50 rounded-full animate-ping" />
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground font-medium">Scan items to build list</p>
                                    <p className="text-muted-foreground text-sm mt-1">Items appear here after scanning</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                    {scannedItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-lg border flex items-center justify-between group animate-in slide-in-from-top-2 duration-200 ${item.failed
                                                ? 'bg-red-500/10 border-red-500/20'
                                                : 'bg-muted border-border hover:border-border'
                                                }`}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono font-bold ${item.failed
                                                    ? 'bg-red-100 text-red-500'
                                                    : 'bg-amber-100 text-amber-500 border border-amber-500/20'
                                                    }`}>
                                                    {item.failed ? '!' : scannedItems.length - idx}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-mono text-sm font-medium truncate ${item.failed ? 'text-red-500' : 'text-foreground'
                                                        }`}>
                                                        {item.id.split('-')[0]}...{item.id.split('-').pop()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.timestamp.toLocaleTimeString()}
                                                    </div>
                                                    {item.failed && item.error && (
                                                        <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {item.error}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemove(item.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Action Panel */}
                    <div className="flex flex-col">
                        <Card className="p-6 flex flex-col gap-6 h-full bg-card border-border shadow-none">
                            <div className="space-y-2">
                                <h2 className="font-bold text-xl text-foreground flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-500/20 flex items-center justify-center">
                                        <Truck className="h-4 w-4 text-amber-500" />
                                    </div>
                                    Dispatch Details
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Applied to all <span className="text-amber-500 font-mono font-medium">{scannedItems.length}</span> items in the current batch.
                                </p>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="grid gap-2">
                                    <Label htmlFor="shipment-reference" className="text-foreground font-medium">Shipment Reference</Label>
                                    <Input
                                        id="shipment-reference"
                                        value={shipmentReference}
                                        onChange={(e) => setShipmentReference(e.target.value)}
                                        placeholder="e.g. AWB-12345678"
                                        className="bg-muted border-border text-foreground focus-visible:border-amber-500 focus-visible:ring-amber-500/30 placeholder:text-muted-foreground"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="shipment-date" className="text-foreground font-medium">Shipment Date</Label>
                                    <Input
                                        id="shipment-date"
                                        type="date"
                                        value={shipmentDate}
                                        onChange={(e) => setShipmentDate(e.target.value)}
                                        className="bg-muted border-border text-foreground focus-visible:border-amber-500 focus-visible:ring-amber-500/30 placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border">
                                {/* 3D Tactile Button */}
                                <Button
                                    className={`w-full h-16 text-lg font-bold transition-all duration-200 ${scannedItems.length > 0 && !isSubmitting
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }`}
                                    onClick={handleConfirmDispatch}
                                    disabled={scannedItems.length === 0 || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle className="h-6 w-6 mr-2" />
                                    )}
                                    {isSubmitting ? "PROCESSING..." : `CONFIRM DISPATCH (${scannedItems.length})`}
                                </Button>

                                <p className="text-center text-xs text-muted-foreground mt-4">
                                    This will activate (if needed) and mark {scannedItems.length} passports as
                                    <span className="text-amber-500 font-mono mx-1 font-medium">SHIPPED</span>
                                    and record dispatch evidence.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
