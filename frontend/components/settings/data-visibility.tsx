"use client"

import { useState } from "react"
import { Eye, EyeOff, ShieldAlert, Globe } from "lucide-react"

interface DataVisibilityProps {
 dataVisibility: Record<string, string>;
 onChange: (newVisibility: Record<string, string>) => void;
}

const VISIBILITY_LEVELS = [
 { value: "REGULATOR", label: "Regulators Only", icon: ShieldAlert, color: "text-red-500" },
 { value: "PARTNER", label: "Partners & Regulators", icon: EyeOff, color: "text-amber-500" },
 { value: "PUBLIC", label: "Public (Everyone)", icon: Globe, color: "text-emerald-500" }
];

const FIELDS_TO_CONFIGURE = [
 { key: "battery_composition", label: "Battery Chemistry & Composition", desc: "Detailed breakdown of cell materials" },
 { key: "lifecycle_metrics", label: "Lifecycle & Performance Metrics", desc: "Cycle life, capacity fade, internal resistance" },
 { key: "supply_chain", label: "Supply Chain & Origin Data", desc: "Supplier details, sourcing locations" },
 { key: "compliance_docs", label: "Compliance Certificates", desc: "EPR, BIS, and PLI documentation" }
];

export function DataVisibility({ dataVisibility, onChange }: DataVisibilityProps) {
 const handleLevelChange = (fieldKey: string, level: string) => {
 onChange({
 ...dataVisibility,
 [fieldKey]: level
 });
 };

 return (
 <div className="bg-card border border-border rounded-lg overflow-hidden mt-6">
 <div className="border-b border-border px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-100">
 <Eye className="h-5 w-5 text-blue-500" />
 </div>
 <div>
 <h3 className="text-base font-medium text-foreground">Data Visibility Configuration</h3>
 <p className="text-xs text-muted-foreground">Control who can access different categories of data on your Battery Passports</p>
 </div>
 </div>
 </div>

 <div className="p-0">
 <table className="w-full text-sm text-left text-muted-foreground">
 <thead className="text-xs text-foreground uppercase bg-background border-b border-border">
 <tr>
 <th scope="col" className="px-6 py-3 font-medium">Data Category</th>
 <th scope="col" className="px-6 py-3 font-medium">Visibility Level</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {FIELDS_TO_CONFIGURE.map(field => {
 const currentLevel = dataVisibility?.[field.key] || "PARTNER";

 return (
 <tr key={field.key} className="bg-card hover:bg-background/50">
 <td className="px-6 py-4">
 <div className="font-medium text-foreground">{field.label}</div>
 <div className="text-xs text-muted-foreground mt-1">{field.desc}</div>
 </td>
 <td className="px-6 py-4">
 <select
 className="bg-card border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 border-border text-foreground shadow-none"
 value={currentLevel}
 onChange={(e) => handleLevelChange(field.key, e.target.value)}
 >
 {VISIBILITY_LEVELS.map(level => (
 <option key={level.value} value={level.value}>
 {level.label}
 </option>
 ))}
 </select>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 <div className="px-6 py-3 bg-background/50 border-t border-border">
 <p className="text-xs text-muted-foreground">
 <strong>Note:</strong> Public data is visible to anyone scanning the passport QR code. Partner data requires a valid Data Access Token.
 </p>
 </div>
 </div>
 );
}
