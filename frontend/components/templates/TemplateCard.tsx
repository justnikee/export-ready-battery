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
        <Card className="bg-card border-border hover:border-border transition-all group">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Zap className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                                {template.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Created {formatRelativeTime(template.created_at)}
                            </p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onUse}>
                                <Play className="h-4 w-4 mr-2" />
                                Use Template
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
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
                        <Badge variant="secondary" className="text-xs">
                            {specs.chemistry}
                        </Badge>
                    )}
                    {specs.voltage && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-xs">
                            {specs.voltage}
                        </Badge>
                    )}
                    {specs.capacity && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-xs">
                            {specs.capacity}
                        </Badge>
                    )}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {specs.manufacturer && (
                        <div>
                            <span className="text-muted-foreground">Manufacturer:</span>{" "}
                            <span className="text-foreground">{specs.manufacturer}</span>
                        </div>
                    )}
                    {specs.weight && (
                        <div>
                            <span className="text-muted-foreground">Weight:</span>{" "}
                            <span className="text-foreground">{specs.weight}</span>
                        </div>
                    )}
                    {specs.carbon_footprint && (
                        <div className="col-span-2">
                            <span className="text-muted-foreground">Carbon:</span>{" "}
                            <span className="text-emerald-500">{specs.carbon_footprint}</span>
                        </div>
                    )}
                </div>

                {/* Use Template Button */}
                <Button
                    onClick={onUse}
                    variant="outline"
                    className="w-full mt-4"
                >
                    <Play className="h-4 w-4 mr-2" />
                    Use in New Batch
                </Button>
            </CardContent>
        </Card>
    )
}
