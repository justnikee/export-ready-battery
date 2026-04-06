"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Key, Trash2, Copy, Check, AlertTriangle, Loader2, Cpu, Radio, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface APIKey {
    id: string
    name: string
    key_prefix: string
    scope: string
    rate_limit_tier: string
    last_used_at: string | null
    expires_at: string | null
    is_active: boolean
    created_at: string
}

interface DeviceToken {
    id: string
    name: string
    token_prefix: string
    batch_id: string | null
    permissions: string
    rate_limit: number
    is_active: boolean
    created_at: string
    last_used_at: string | null
}

interface NewKeyResponse extends APIKey {
    key: string
}

export default function DeveloperPage() {
    const [apiKeys, setApiKeys] = useState<APIKey[]>([])
    const [deviceTokens, setDeviceTokens] = useState<DeviceToken[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingTokens, setLoadingTokens] = useState(true)
    const [creating, setCreating] = useState(false)
    const [creatingToken, setCreatingToken] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showCreateTokenDialog, setShowCreateTokenDialog] = useState(false)
    const [showKeyReveal, setShowKeyReveal] = useState(false)
    const [showTokenReveal, setShowTokenReveal] = useState(false)
    const [newKeyData, setNewKeyData] = useState<NewKeyResponse | null>(null)
    const [newTokenRaw, setNewTokenRaw] = useState("")
    const [copied, setCopied] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<APIKey | null>(null)
    const [deleteTokenTarget, setDeleteTokenTarget] = useState<DeviceToken | null>(null)

    // API Key form state
    const [keyName, setKeyName] = useState("")
    const [keyScope, setKeyScope] = useState("read")
    const [keyTier, setKeyTier] = useState("starter")

    // Device Token form state
    const [tokenName, setTokenName] = useState("")
    const [tokenBatchId, setTokenBatchId] = useState("")

    const toApiError = (error: unknown): { response?: { data?: { error?: string } } } => {
        if (typeof error === "object" && error !== null) {
            return error as { response?: { data?: { error?: string } } }
        }
        return {}
    }

    useEffect(() => {
        fetchAPIKeys()
        fetchDeviceTokens()
    }, [])

    const fetchAPIKeys = async () => {
        try {
            const response = await api.get("/api-keys")
            setApiKeys(response.data.api_keys || [])
        } catch (error) {
            console.error("Failed to fetch API keys:", error)
            toast.error("Failed to load API keys")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateKey = async () => {
        if (!keyName.trim()) {
            toast.error("Name is required")
            return
        }

        setCreating(true)
        try {
            const response = await api.post("/api-keys", {
                name: keyName,
                scope: keyScope,
                rate_limit_tier: keyTier,
            })

            setNewKeyData(response.data)
            setShowCreateDialog(false)
            setShowKeyReveal(true)
            fetchAPIKeys()

            // Reset form
            setKeyName("")
            setKeyScope("read")
            setKeyTier("starter")
        } catch (error: unknown) {
            const apiError = toApiError(error)
            toast.error(apiError.response?.data?.error || "Failed to create API key")
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteKey = async () => {
        if (!deleteTarget) return

        try {
            await api.delete(`/api-keys/${deleteTarget.id}`)
            toast.success("API key deleted")
            fetchAPIKeys()
        } catch (error: unknown) {
            const apiError = toApiError(error)
            toast.error(apiError.response?.data?.error || "Failed to delete API key")
        } finally {
            setDeleteTarget(null)
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success("Copied to clipboard")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error("Failed to copy")
        }
    }

    // Device Token functions
    const fetchDeviceTokens = async () => {
        try {
            const response = await api.get("/device-tokens")
            setDeviceTokens(response.data.tokens || [])
        } catch (error) {
            console.error("Failed to fetch device tokens:", error)
        } finally {
            setLoadingTokens(false)
        }
    }

    const handleCreateToken = async () => {
        if (!tokenName.trim()) {
            toast.error("Name is required")
            return
        }
        setCreatingToken(true)
        try {
            const response = await api.post("/device-tokens", {
                name: tokenName,
                batch_id: tokenBatchId || undefined,
            })
            setNewTokenRaw(response.data.raw_token || response.data.token?.id || "")
            setShowCreateTokenDialog(false)
            setShowTokenReveal(true)
            fetchDeviceTokens()
            setTokenName("")
            setTokenBatchId("")
        } catch (error: unknown) {
            const apiError = toApiError(error)
            toast.error(apiError.response?.data?.error || "Failed to create device token")
        } finally {
            setCreatingToken(false)
        }
    }

    const handleDeleteToken = async () => {
        if (!deleteTokenTarget) return
        try {
            await api.delete(`/device-tokens/${deleteTokenTarget.id}`)
            toast.success("Device token revoked")
            fetchDeviceTokens()
        } catch (error: unknown) {
            const apiError = toApiError(error)
            toast.error(apiError.response?.data?.error || "Failed to revoke token")
        } finally {
            setDeleteTokenTarget(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="w-full mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Developer Settings</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage API keys for external integrations</p>
                        <a
                            href="/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <BookOpen className="h-4 w-4" />
                            API Documentation
                        </a>
                    </div>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Plus className="w-4 h-4" />
                                Generate API Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-slate-200 sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-slate-900">Generate API Key</DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    Create a new API key for ERP integrations
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-700">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., SAP Integration"
                                        value={keyName}
                                        onChange={(e) => setKeyName(e.target.value)}
                                        className="bg-white border-slate-200 text-slate-900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Scope</Label>
                                    <Select value={keyScope} onValueChange={setKeyScope}>
                                        <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200">
                                            <SelectItem value="read" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                                                Read Only - Can only fetch data
                                            </SelectItem>
                                            <SelectItem value="write" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                                                Read & Write - Full access
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Rate Limit Tier</Label>
                                    <Select value={keyTier} onValueChange={setKeyTier}>
                                        <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200">
                                            <SelectItem value="starter" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                                                Starter - 100 req/hour
                                            </SelectItem>
                                            <SelectItem value="production" className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                                                Production - 1,000 reads / 500 writes per hour
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowCreateDialog(false)}
                                    className="text-slate-500"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateKey}
                                    disabled={creating}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Generate Key"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Key Reveal Dialog */}
                <Dialog open={showKeyReveal} onOpenChange={setShowKeyReveal}>
                    <DialogContent className="bg-white border-slate-200 sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 flex items-center gap-2">
                                <Key className="w-5 h-5 text-green-600" />
                                API Key Created
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <p className="text-amber-700 text-sm">
                                    Copy this key now. It will only be shown once!
                                </p>
                            </div>
                            <div className="relative">
                                <code className="block w-full p-4 bg-slate-100 border border-slate-200 rounded-lg font-mono text-sm text-green-700 break-all">
                                    {newKeyData?.key}
                                </code>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2"
                                    onClick={() => newKeyData && copyToClipboard(newKeyData.key)}
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-slate-500" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setShowKeyReveal(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                I&apos;ve Saved My Key
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* API Keys List */}
                <Card className="bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-slate-900 flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            API Keys
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Your API keys for external integrations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                            </div>
                        ) : apiKeys.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No API keys yet</p>
                                <p className="text-sm mt-1">Create one to integrate with your ERP</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {apiKeys.map((key) => (
                                    <div
                                        key={key.id}
                                        className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">{key.name}</span>
                                                <Badge
                                                    variant={key.scope === "write" ? "default" : "secondary"}
                                                    className={key.scope === "write" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"}
                                                >
                                                    {key.scope === "write" ? "Read & Write" : "Read Only"}
                                                </Badge>
                                                <Badge variant="outline" className="border-slate-300 text-slate-600">
                                                    {key.rate_limit_tier}
                                                </Badge>
                                                {!key.is_active && (
                                                    <Badge variant="destructive">Inactive</Badge>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                                                <code className="font-mono">{key.key_prefix}</code>
                                                <span>
                                                    Created {formatDistanceToNow(new Date(key.created_at))} ago
                                                </span>
                                                {key.last_used_at && (
                                                    <span>
                                                        Last used {formatDistanceToNow(new Date(key.last_used_at))} ago
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteTarget(key)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Start */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-medium text-slate-900">Quick Start</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Example API request using your key</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-b-lg">
                        <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://api.exportready.io'}/api/v1/batches`}
                        </pre>
                    </div>
                </div>

                {/* Device Token Management */}
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                                <Cpu className="h-5 w-5" />
                                Device Tokens
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Authenticate BMS devices for telemetry ingestion
                            </CardDescription>
                        </div>
                        <Dialog open={showCreateTokenDialog} onOpenChange={setShowCreateTokenDialog}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                                    <Plus className="w-4 h-4 mr-1" /> New Token
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white border-slate-200">
                                <DialogHeader>
                                    <DialogTitle className="text-slate-900">Create Device Token</DialogTitle>
                                    <DialogDescription className="text-slate-500">
                                        Generate a token for BMS device telemetry. Scope it to a specific batch for security.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="tokenName">Token Name</Label>
                                        <Input
                                            id="tokenName"
                                            placeholder="e.g., BMS-Gateway-Factory-A"
                                            value={tokenName}
                                            onChange={(e) => setTokenName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tokenBatchId">Batch ID (optional)</Label>
                                        <Input
                                            id="tokenBatchId"
                                            placeholder="Scope token to a specific batch UUID"
                                            value={tokenBatchId}
                                            onChange={(e) => setTokenBatchId(e.target.value)}
                                        />
                                        <p className="text-xs text-slate-500">Leave empty to allow telemetry for any passport</p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowCreateTokenDialog(false)}>Cancel</Button>
                                    <Button onClick={handleCreateToken} disabled={creatingToken} className="bg-teal-600 hover:bg-teal-700 text-white">
                                        {creatingToken ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Radio className="w-4 h-4 mr-1" />}
                                        Create Token
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {loadingTokens ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : deviceTokens.length === 0 ? (
                            <div className="text-center py-8">
                                <Cpu className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">No device tokens yet</p>
                                <p className="text-slate-400 text-xs mt-1">Create a token to start sending BMS telemetry data</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {deviceTokens.map((token) => (
                                    <div key={token.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Cpu className="h-4 w-4 text-teal-600" />
                                            <div>
                                                <span className="text-sm font-medium text-slate-900">{token.name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {!token.is_active && <Badge variant="outline" className="text-red-500 border-red-300">Revoked</Badge>}
                                                    {token.batch_id && (
                                                        <span className="text-xs text-slate-400">Batch: {token.batch_id.slice(0, 8)}…</span>
                                                    )}
                                                    <span className="text-xs text-slate-400">
                                                        Created {formatDistanceToNow(new Date(token.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setDeleteTokenTarget(token)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sample payload */}
                        <div className="mt-4 p-3 bg-slate-900 rounded-lg">
                            <p className="text-xs text-slate-400 mb-2">Sample telemetry request:</p>
                            <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre">{`curl -X POST /api/v1/telemetry \\
  -H "Authorization: Bearer <device_token>" \\
  -d '{
    "passport_id": "<uuid>",
    "state_of_health": 92.3,
    "cycle_count": 145,
    "temperature": 28.4,
    "voltage": 48.2
  }'`}</pre>
                        </div>
                    </CardContent>
                </Card>

                {/* Token Reveal Dialog */}
                <Dialog open={showTokenReveal} onOpenChange={setShowTokenReveal}>
                    <DialogContent className="bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900">Device Token Created</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Flash this token into your BMS firmware. It will not be shown again.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                Copy this token now — it will only be shown once!
                            </div>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                            <code className="text-green-400 text-sm break-all">{newTokenRaw}</code>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newTokenRaw)}
                                className="text-slate-400 hover:text-white shrink-0 ml-2">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Token Confirmation */}
                <AlertDialog open={!!deleteTokenTarget} onOpenChange={() => setDeleteTokenTarget(null)}>
                    <AlertDialogContent className="bg-white border-slate-200">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-slate-900">Revoke Device Token?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500">
                                This will permanently revoke &quot;{deleteTokenTarget?.name}&quot;. Any devices using this token will stop sending telemetry.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteToken} className="bg-red-600 hover:bg-red-700 text-white">
                                Revoke Token
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* External API Documentation Link */}
                <Card className="bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-slate-900">External API Endpoints</CardTitle>
                        <CardDescription className="text-slate-500">
                            Use these endpoints with your API key
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 text-sm">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                    <Badge className="bg-green-600 text-white">POST</Badge>
                                    <code className="text-slate-700">/api/v1/external/batches</code>
                                    <Badge variant="outline" className="border-teal-500 text-teal-600">write</Badge>
                                </div>
                                <p className="text-slate-500 mt-1">Create a new batch</p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                    <Badge className="bg-green-600 text-white">POST</Badge>
                                    <code className="text-slate-700">/api/v1/external/batches/&#123;id&#125;/passports</code>
                                    <Badge variant="outline" className="border-teal-500 text-teal-600">write</Badge>
                                </div>
                                <p className="text-slate-500 mt-1">Add passports via JSON (up to 500 per request)</p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                    <Badge className="bg-blue-600 text-white">GET</Badge>
                                    <code className="text-slate-700">/api/v1/external/batches/&#123;id&#125;/labels</code>
                                    <Badge variant="outline" className="border-slate-400 text-slate-600">read</Badge>
                                </div>
                                <p className="text-slate-500 mt-1">Download PDF labels for printing</p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-2 text-slate-900 font-medium">
                                    <Badge className="bg-blue-600 text-white">GET</Badge>
                                    <code className="text-slate-700">/api/v1/external/passports/&#123;uuid&#125;</code>
                                    <Badge variant="outline" className="border-slate-400 text-slate-600">read</Badge>
                                </div>
                                <p className="text-slate-500 mt-1">Get passport details</p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <p className="text-slate-500 text-sm">
                                Include your API key in the <code className="text-slate-700 bg-slate-100 px-1 rounded">X-API-Key</code> header.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Delete Confirmation */}
                <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                    <AlertDialogContent className="bg-white border-slate-200">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-slate-900">Delete API Key?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500">
                                This will permanently revoke the key &quot;{deleteTarget?.name}&quot;. Any integrations
                                using this key will stop working.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteKey}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Delete Key
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
