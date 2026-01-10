import { Battery, Calendar, CheckCircle, Smartphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PassportViewProps {
    passport: any
}

export function PassportView({ passport }: PassportViewProps) {
    const specs = passport.specs || {}

    return (
        <div className="space-y-6">
            {/* Header Status Card */}
            <Card className="border-t-4 border-t-green-500 shadow-md">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 text-sm">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verified Passport
                        </Badge>
                        <span className="text-xs text-muted-foreground">ID: {passport.uuid.substring(0, 8)}...</span>
                    </div>
                    <CardTitle className="text-2xl mt-2">{specs.manufacturer || "Unknown Manufacturer"}</CardTitle>
                    <p className="text-muted-foreground">{passport.batch_name}</p>
                </CardHeader>
            </Card>

            {/* Technical Specs */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Battery className="h-5 w-5 text-blue-500" />
                        Technical Specifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                        <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Capacity</span>
                            <span className="font-semibold">{specs.capacity || "-"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Voltage</span>
                            <span className="font-semibold">{specs.voltage || "-"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Chemistry</span>
                            <span className="font-semibold">{specs.chemistry || "-"}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">Serial No.</span>
                            <span className="font-mono">{passport.serial_number}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* History / Dates */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        Lifecycle Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6 py-2">
                        <div className="relative">
                            <span className="absolute -left-[31px] bg-green-500 h-4 w-4 rounded-full border-2 border-white"></span>
                            <p className="font-medium text-sm">Manufactured</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(passport.manufacture_date).toLocaleDateString(undefined, {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[31px] bg-blue-500 h-4 w-4 rounded-full border-2 border-white"></span>
                            <p className="font-medium text-sm">Passport Issued</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(passport.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
                <p className="flex items-center justify-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    Scan to verify authenticity
                </p>
                <p className="mt-1">© 2024 ExportReady Battery Passport</p>
            </div>
        </div>
    )
}
