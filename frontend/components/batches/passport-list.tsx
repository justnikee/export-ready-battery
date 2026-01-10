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

interface Passport {
    uuid: string
    serial_number: string
    status: string
    created_at: string
}

interface PassportListProps {
    passports: Passport[]
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
                        <TableHead>Created At</TableHead>
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
                                <Badge variant={passport.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                    {passport.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {new Date(passport.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <Link
                                    href={`/p/${passport.uuid}`}
                                    className="inline-flex items-center text-blue-600 hover:underline"
                                    target="_blank"
                                >
                                    View
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
