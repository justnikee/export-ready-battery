"use client"

import { useState } from "react"
import { Activity, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface ManualSoHEntryProps {
    passportUuid: string
    currentSoH: number | null
    onUpdated?: () => void
}

export function ManualSoHEntry({ passportUuid, currentSoH, onUpdated }: ManualSoHEntryProps) {
    const [soh, setSoh] = useState("")
    const [cycleCount, setCycleCount] = useState("")
    const [method, setMethod] = useState("MANUAL")
    const [notes, setNotes] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [expanded, setExpanded] = useState(false)

    const handleSubmit = async () => {
        const sohVal = parseFloat(soh)
        if (isNaN(sohVal) || sohVal < 0 || sohVal > 100) {
            toast.error("SoH must be between 0 and 100")
            return
        }

        setSubmitting(true)
        try {
            await api.post(`/passports/${passportUuid}/soh`, {
                state_of_health: sohVal,
                cycle_count: cycleCount ? parseInt(cycleCount) : undefined,
                measurement_method: method,
                notes: notes || undefined,
            })
            toast.success("SoH updated successfully")
            setSoh("")
            setCycleCount("")
            setNotes("")
            setExpanded(false)
            onUpdated?.()
        } catch (error: unknown) {
            const apiErr = error as { response?: { data?: { error?: string } } }
            toast.error(apiErr?.response?.data?.error || "Failed to update SoH")
        } finally {
            setSubmitting(false)
        }
    }

    if (!expanded) {
        return (
            <button
                onClick={() => setExpanded(true)}
                className="w-full text-left p-3 border border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Activity className="h-4 w-4" />
                    <span>Update SoH manually</span>
                    {currentSoH != null && (
                        <span className="text-xs text-slate-400 ml-auto">Current: {currentSoH}%</span>
                    )}
                </div>
            </button>
        )
    }

    return (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-blue-600" />
                    Manual SoH Update
                </h4>
                <button onClick={() => setExpanded(false)} className="text-xs text-slate-400 hover:text-slate-600">
                    Cancel
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">SoH % *</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g., 92.5"
                        value={soh}
                        onChange={(e) => setSoh(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Cycle Count</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="e.g., 145"
                        value={cycleCount}
                        onChange={(e) => setCycleCount(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs text-slate-500 mb-1">Measurement Method</label>
                <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                    <option value="MANUAL">Manual Entry</option>
                    <option value="LAB_TEST">Lab Capacity Test</option>
                    <option value="BMS">BMS Reading</option>
                </select>
            </div>

            <div>
                <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
                <input
                    type="text"
                    placeholder="e.g., Annual capacity test"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={submitting || !soh}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                Submit SoH Update
            </button>
        </div>
    )
}
