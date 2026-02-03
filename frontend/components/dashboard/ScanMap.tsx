"use client"

import { memo, useMemo } from "react"
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
} from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"

interface ScanLocation {
    city: string
    country: string
    latitude: number
    longitude: number
    scanned_at?: string
}

interface ScanMapProps {
    scans: ScanLocation[]
    height?: number
}

function ScanMapComponent({ scans, height = 280 }: ScanMapProps) {
    // Filter out invalid coordinates and create unique markers
    const markers = useMemo(() => {
        const validScans = scans.filter(
            (s) => s.latitude !== 0 && s.longitude !== 0
        )

        // Group by rough location to avoid overlapping markers
        const locationMap = new Map<string, ScanLocation & { count: number }>()
        validScans.forEach((scan) => {
            const key = `${Math.round(scan.latitude)},${Math.round(scan.longitude)}`
            if (!locationMap.has(key)) {
                locationMap.set(key, { ...scan, count: 1 })
            } else {
                const existing = locationMap.get(key)!
                existing.count++
            }
        })

        return Array.from(locationMap.values())
    }, [scans])

    return (
        <div
            className="relative overflow-hidden rounded-lg"
            style={{ height }}
        >
            {/* Light gradient background */}
            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
                }}
            />

            {/* Subtle grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: "30px 30px",
                }}
            />

            {/* Outer vignette effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 40%, rgba(241, 245, 249, 0.6) 100%)",
                }}
            />

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 120,
                    center: [30, 20],
                }}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            >
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#cbd5e1"
                                stroke="#94a3b8"
                                strokeWidth={0.4}
                                style={{
                                    default: { outline: "none" },
                                    hover: { outline: "none", fill: "#94a3b8" },
                                    pressed: { outline: "none" },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {/* Animated scan markers */}
                {markers.map((marker, i) => (
                    <Marker
                        key={`${marker.latitude}-${marker.longitude}-${i}`}
                        coordinates={[marker.longitude, marker.latitude]}
                    >
                        {/* Outer pulse ring */}
                        <circle
                            r={12}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={1.5}
                            opacity={0.4}
                            className="animate-ping"
                            style={{
                                transformOrigin: "center",
                                animationDuration: "2s",
                                animationDelay: `${i * 0.2}s`,
                            }}
                        />
                        {/* Middle glow ring */}
                        <circle
                            r={7}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth={1}
                            opacity={0.6}
                            className="animate-pulse"
                            style={{
                                animationDelay: `${i * 0.15}s`,
                            }}
                        />
                        {/* Core dot */}
                        <circle
                            r={4}
                            fill="#10b981"
                            stroke="#a7f3d0"
                            strokeWidth={1}
                            style={{
                                filter: "drop-shadow(0 0 6px #10b981)",
                            }}
                        />
                        {/* Count badge for multiple scans */}
                        {marker.count > 1 && (
                            <text
                                textAnchor="middle"
                                y={-12}
                                style={{
                                    fontFamily: "system-ui",
                                    fontSize: "8px",
                                    fontWeight: 600,
                                    fill: "#a7f3d0",
                                    textShadow: "0 0 4px rgba(16, 185, 129, 0.8)",
                                }}
                            >
                                {marker.count}
                            </text>
                        )}
                    </Marker>
                ))}
            </ComposableMap>

            {/* Top-left title badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-slate-700">Live Scans</span>
                </div>
            </div>

            {/* Bottom-right stats */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <div className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm">
                    <span className="text-xs font-medium text-slate-600">
                        {markers.length} {markers.length === 1 ? "location" : "locations"}
                    </span>
                </div>
            </div>

            {/* Empty state */}
            {markers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                            <svg
                                className="w-6 h-6 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-500">No scan locations yet</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export const ScanMap = memo(ScanMapComponent)
