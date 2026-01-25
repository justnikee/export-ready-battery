"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import api from "@/lib/api"
import { toast } from "sonner"
import { Scan, Trash2, Truck, Hash, CheckCircle, AlertCircle, RefreshCw, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

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
    const { user } = useAuth()
    const router = useRouter()
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([])
    const [inputValue, setInputValue] = useState("")
    const [carrier, setCarrier] = useState("")
    const [trackingNumber, setTrackingNumber] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const inputRef = useRef<HTMLInputElement>(null)

    // Audio Context Ref
    const audioContextRef = useRef<AudioContext | null>(null)

    // Initialize Audio Context on first user interaction
    useEffect(() => {
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
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

            // Second beep logic implies complex timing, simplified to one distinct sound
            // Or use setTimeout for second beep, but keep it simple for now
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

        // Refocus on blur if not editing other fields
        const handleBlur = (e: FocusEvent) => {
            // Only refocus if the target isn't another input
            if ((e.relatedTarget as HTMLElement)?.tagName !== 'INPUT' &&
                (e.relatedTarget as HTMLElement)?.tagName !== 'BUTTON') {
                focusInput()
            }
        }

        // document.addEventListener('blur', handleBlur, true) // Can range be annoying
        return () => {
            // document.removeEventListener('blur', handleBlur, true)
        }
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
        if (!carrier.trim()) {
            toast.error("Please enter a Carrier name")
            return
        }

        setIsSubmitting(true)
        try {
            const passportIds = scannedItems.map(item => item.id)

            const response = await api.post("/passports/bulk/transition", {
                passport_ids: passportIds,
                to_status: "SHIPPED",
                metadata: {
                    carrier: carrier,
                    tracking_number: trackingNumber,
                    dispatched_at: new Date().toISOString()
                }
            })

            // Safety Net #2: Partial Failure Handling
            const result = response.data
            const successCount = result.success_count || 0
            const failedCount = result.failed_count || 0

            if (failedCount === 0) {
                // Complete success
                toast.success(`Successfully dispatched ${successCount} units!`)
                setScannedItems([])
                setCarrier("")
                setTrackingNumber("")
                localStorage.removeItem(STORAGE_KEY) // Clear storage on success
            } else {
                // Partial failure: Keep only failed items
                const failedIds = new Set(
                    result.results
                        ?.filter((r: any) => !r.success)
                        .map((r: any) => r.passport_id) || []
                )

                const updatedItems = scannedItems
                    .filter(item => failedIds.has(item.id))
                    .map(item => {
                        // Find error message from API response
                        const failedResult = result.results?.find(
                            (r: any) => r.passport_id === item.id && !r.success
                        )
                        return {
                            ...item,
                            failed: true,
                            error: failedResult?.error || 'Transition failed'
                        }
                    })

                setScannedItems(updatedItems)
                toast.warning(
                    `Dispatched ${successCount} units. ${failedCount} failed - see list for details`,
                    { duration: 5000 }
                )
                playSound('error')
            }

            inputRef.current?.focus()
        } catch (error: any) {
            console.error("Dispatch failed:", error)
            toast.error(error.response?.data?.error || "Failed to process dispatch")
            playSound('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <span className="text-4xl">🔫</span>
                        Rapid Dispatch Mode
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        High-volume scanning • Keyboard-first • Auto-dispatch
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
                    >
                        {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        Exit Mode
                    </Button>
                </div>
            </div>

            {/* Main Layout - Top Scan, Bottom Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                {/* Left Col: Scanning Area (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* The "Gun" Target */}
                    <Card className="p-6 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <form onSubmit={handleScan} className="flex flex-col gap-2">
                            <Label htmlFor="scannerInput" className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                                <Scan className="h-5 w-5" />
                                SCANNER INPUT
                            </Label>
                            <Input
                                id="scannerInput"
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Waiting to scan..."
                                className="h-16 text-2xl font-mono border-2 ring-offset-2 focus-visible:ring-emerald-500"
                                autoComplete="off"
                            />
                            <p className="text-xs text-muted-foreground flex justify-between">
                                <span>Press Enter to submit scan</span>
                                <span>Supported: UUIDs, QR URLs</span>
                            </p>
                        </form>
                    </Card>

                    {/* Pending List */}
                    <div className="flex-1 min-h-0 flex flex-col bg-slate-950/30 rounded-xl border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-indigo-400" />
                                Pending Scans
                            </h2>
                            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-mono font-bold">
                                {scannedItems.length} units
                            </span>
                        </div>

                        {scannedItems.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50 border-2 border-dashed rounded-lg">
                                <Scan className="h-12 w-12 mb-2" />
                                <p>Scan items to build list</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {scannedItems.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className={`p-3 rounded-lg border flex items-center justify-between group animate-in slide-in-from-top-2 duration-200 ${item.failed
                                                ? 'bg-red-950/30 border-red-500/50'
                                                : 'bg-card'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-mono ${item.failed
                                                    ? 'bg-red-900/50 text-red-400'
                                                    : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                {item.failed ? '⚠️' : scannedItems.length - idx}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-mono text-sm font-medium ${item.failed ? 'text-red-300' : 'text-slate-200'
                                                    }`}>
                                                    {item.id.split('-')[0]}...{item.id.split('-').pop()}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {item.timestamp.toLocaleTimeString()}
                                                </div>
                                                {item.failed && item.error && (
                                                    <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
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
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: Action Panel (1/3) */}
                <div className="flex flex-col gap-6">
                    <Card className="p-6 flex flex-col gap-6 h-full bg-slate-900 border-indigo-500/20">
                        <div className="space-y-2">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <Truck className="h-5 w-5 text-indigo-400" />
                                Dispatch Details
                            </h2>
                            <p className="text-sm text-slate-400">
                                Applied to all {scannedItems.length} items in the current batch.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="carrier">Carrier Name</Label>
                                <Input
                                    id="carrier"
                                    value={carrier}
                                    onChange={(e) => setCarrier(e.target.value)}
                                    placeholder="e.g. DHL, FedEx, Own Fleet"
                                    className="bg-slate-950"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tracking">Tracking / Ref Number</Label>
                                <Input
                                    id="tracking"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="e.g. AWB-12345678"
                                    className="bg-slate-950"
                                />
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-800">
                            <Button
                                className="w-full h-16 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
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

                            <p className="text-center text-xs text-slate-500 mt-4">
                                This will mark {scannedItems.length} passports as
                                <span className="text-indigo-400 font-mono mx-1">SHIPPED</span>
                                and record dispatch metadata.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
