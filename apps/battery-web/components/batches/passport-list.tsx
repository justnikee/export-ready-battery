"use client"

import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { PassportVCActions } from "@/components/batches/passport-vc-actions"

interface Passport {
 uuid: string
 serial_number: string
 status: string
 created_at: string
 manufacture_date?: string
 current_owner_identifier?: string
}

interface PassportListProps {
 passports: Passport[]
}

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "SHIPPED": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "IN_SERVICE": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    case "RECYCLED": return "bg-teal-500/20 text-teal-400 border-teal-500/30"
    case "END_OF_LIFE": return "bg-red-500/20 text-red-400 border-red-500/30"
    case "RECALLED": return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    default: return "bg-muted text-muted-foreground"
  }
}

export function PassportList({ passports }: PassportListProps) {
 if (!passports || passports.length === 0) {
 return <div className="text-center py-6 text-muted-foreground">No passports generated yet.</div>
 }

 return (
 <div className="border rounded-md">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Serial Number</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Mfg. Date</TableHead>
 <TableHead>Current Owner</TableHead>
 <TableHead className="text-right">Action</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {passports.map((passport) => (
 <TableRow key={passport.uuid}>
 <TableCell className="font-medium font-mono">
 {passport.serial_number}
 </TableCell>
 <TableCell>
 <Badge variant="outline" className={getStatusColor(passport.status)}>
 {passport.status}
 </Badge>
 </TableCell>
 <TableCell className="text-muted-foreground text-xs">
 {passport.manufacture_date
   ? new Date(passport.manufacture_date).toLocaleDateString()
   : new Date(passport.created_at).toLocaleDateString()}
 </TableCell>
 <TableCell className="text-muted-foreground text-xs">
 {passport.current_owner_identifier || "—"}
 </TableCell>
 <TableCell className="text-right">
 <div className="inline-flex items-center justify-end gap-3">
 <Link
 href={`/p/${passport.uuid}`}
 className="inline-flex items-center text-(--brand-link) hover:underline"
 target="_blank"
 >
 View
 <ExternalLink className="ml-1 h-3 w-3" />
 </Link>
 <PassportVCActions
 uuid={passport.uuid}
 serialNumber={passport.serial_number}
 />
 </div>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 )
}
