"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Zap, Trash2, Play, MoreVertical } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TemplateCardProps {
    template: {
        id: string
        name: string
        specs: {
            chemistry?: string
            voltage?: string
            capacity?: string
            manufacturer?: string
            weight?: string
            carbon_footprint?: string
            country_of_origin?: string
        }
        created_at: string
    }
    onDelete: () => void
    onUse: () => void
}

export function TemplateCard({ template, onDelete, onUse }: TemplateCardProps) {
    const { specs } = template

    // Format relative time
    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return "Today"
        if (diffDays === 1) return "Yesterday"
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        return date.toLocaleDateString()
    }

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all group">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-600/20">
                            <Zap className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                                {template.name}
                            </h3>
                            <p className="text-xs text-zinc-500">
                                Created {formatRelativeTime(template.created_at)}
                            </p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 hover:text-white"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem
                                onClick={onUse}
                                className="text-zinc-300 focus:text-white focus:bg-zinc-800"
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Use Template
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-red-400 focus:text-red-300 focus:bg-red-950/50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {/* Specs Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {specs.chemistry && (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                            {specs.chemistry}
                        </Badge>
                    )}
                    {specs.voltage && (
                        <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 text-xs">
                            {specs.voltage}
                        </Badge>
                    )}
                    {specs.capacity && (
                        <Badge variant="secondary" className="bg-emerald-900/50 text-emerald-300 text-xs">
                            {specs.capacity}
                        </Badge>
                    )}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                    {specs.manufacturer && (
                        <div>
                            <span className="text-zinc-600">Manufacturer:</span>{" "}
                            <span className="text-zinc-400">{specs.manufacturer}</span>
                        </div>
                    )}
                    {specs.weight && (
                        <div>
                            <span className="text-zinc-600">Weight:</span>{" "}
                            <span className="text-zinc-400">{specs.weight}</span>
                        </div>
                    )}
                    {specs.carbon_footprint && (
                        <div className="col-span-2">
                            <span className="text-zinc-600">Carbon:</span>{" "}
                            <span className="text-emerald-400">{specs.carbon_footprint}</span>
                        </div>
                    )}
                </div>

                {/* Use Template Button */}
                <Button
                    onClick={onUse}
                    variant="outline"
                    className="w-full mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                    <Play className="h-4 w-4 mr-2" />
                    Use in New Batch
                </Button>
            </CardContent>
        </Card>
    )
}
