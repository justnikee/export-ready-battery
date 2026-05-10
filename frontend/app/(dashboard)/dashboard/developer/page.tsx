"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toApiError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Key,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Cpu,
  Radio,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  scope: string;
  role: string;
  rate_limit_tier: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface DeviceToken {
  id: string;
  name: string;
  token_prefix: string;
  batch_id: string | null;
  permissions: string;
  rate_limit: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface NewKeyResponse extends APIKey {
  key: string;
}

export default function DeveloperPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [deviceTokens, setDeviceTokens] = useState<DeviceToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateTokenDialog, setShowCreateTokenDialog] = useState(false);
  const [showKeyReveal, setShowKeyReveal] = useState(false);
  const [showTokenReveal, setShowTokenReveal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<NewKeyResponse | null>(null);
  const [newTokenRaw, setNewTokenRaw] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<APIKey | null>(null);
  const [deleteTokenTarget, setDeleteTokenTarget] =
    useState<DeviceToken | null>(null);

  // API Key form state
  const [keyName, setKeyName] = useState("");
  const [keyScope, setKeyScope] = useState("read");
  const [keyRole, setKeyRole] = useState("");
  const [keyTier, setKeyTier] = useState("starter");

  // Device Token form state
  const [tokenName, setTokenName] = useState("");
  const [tokenBatchId, setTokenBatchId] = useState("");

  useEffect(() => {
    fetchAPIKeys();
    fetchDeviceTokens();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const response = await api.get("/api-keys");
      setApiKeys(response.data.api_keys || []);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error("Name is required");
      return;
    }

    setCreating(true);
    try {
      const response = await api.post("/api-keys", {
        name: keyName,
        scope: keyScope,
        role: keyRole || undefined,
        rate_limit_tier: keyTier,
      });

      setNewKeyData(response.data);
      setShowCreateDialog(false);
      setShowKeyReveal(true);
      fetchAPIKeys();

      // Reset form
      setKeyName("");
      setKeyScope("read");
      setKeyRole("");
      setKeyTier("starter");
    } catch (error: unknown) {
      const apiError = toApiError(error);
      toast.error(apiError.response?.data?.error || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!deleteTarget) return;

    try {
      await api.delete(`/api-keys/${deleteTarget.id}`);
      toast.success("API key deleted");
      fetchAPIKeys();
    } catch (error: unknown) {
      const apiError = toApiError(error);
      toast.error(apiError.response?.data?.error || "Failed to delete API key");
    } finally {
      setDeleteTarget(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Device Token functions
  const fetchDeviceTokens = async () => {
    try {
      const response = await api.get("/device-tokens");
      setDeviceTokens(response.data.tokens || []);
    } catch (error) {
      console.error("Failed to fetch device tokens:", error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreatingToken(true);
    try {
      const response = await api.post("/device-tokens", {
        name: tokenName,
        batch_id: tokenBatchId || undefined,
      });
      setNewTokenRaw(response.data.raw_token || response.data.token?.id || "");
      setShowCreateTokenDialog(false);
      setShowTokenReveal(true);
      fetchDeviceTokens();
      setTokenName("");
      setTokenBatchId("");
    } catch (error: unknown) {
      const apiError = toApiError(error);
      toast.error(
        apiError.response?.data?.error || "Failed to create device token",
      );
    } finally {
      setCreatingToken(false);
    }
  };

  const handleDeleteToken = async () => {
    if (!deleteTokenTarget) return;
    try {
      await api.delete(`/device-tokens/${deleteTokenTarget.id}`);
      toast.success("Device token revoked");
      fetchDeviceTokens();
    } catch (error: unknown) {
      const apiError = toApiError(error);
      toast.error(apiError.response?.data?.error || "Failed to revoke token");
    } finally {
      setDeleteTokenTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-foreground tracking-tight">
              Developer Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage API keys for external integrations
            </p>
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            <DialogContent className="bg-background border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Generate API Key
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create a new API key for ERP integrations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., SAP Integration"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Scope</Label>
                  <Select value={keyScope} onValueChange={setKeyScope}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem
                        value="read"
                        className="text-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        Read Only - Can only fetch data
                      </SelectItem>
                      <SelectItem
                        value="write"
                        className="text-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        Read &amp; Write - Full access
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Lifecycle Role{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      (optional â€” required for supply-chain transitions)
                    </span>
                  </Label>
                  <Select value={keyRole} onValueChange={setKeyRole}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="None (read/write only)" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem
                        value=""
                        className="text-muted-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        None â€” no lifecycle transitions
                      </SelectItem>
                      <SelectItem
                        value="LOGISTICS"
                        className="text-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        LOGISTICS â€” can ship passports
                      </SelectItem>
                      <SelectItem
                        value="TECHNICIAN"
                        className="text-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        TECHNICIAN â€” can mark as installed
                      </SelectItem>
                      <SelectItem
                        value="RECYCLER"
                        className="text-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        RECYCLER â€” can close recycling loop
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Rate Limit Tier</Label>
                  <Select value={keyTier} onValueChange={setKeyTier}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem
                        value="starter"
                        className="text-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        Starter - 100 req/hour
                      </SelectItem>
                      <SelectItem
                        value="production"
                        className="text-foreground focus:bg-accent focus:text-accent-foreground"
                      >
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
                  className="text-muted-foreground"
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
          <DialogContent className="bg-background border-border sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Key className="w-5 h-5 text-green-600" />
                API Key Created
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-amber-500 text-sm">
                  Copy this key now. It will only be shown once!
                </p>
              </div>
              <div className="relative">
                <code className="block w-full p-4 bg-muted border border-border font-mono text-sm text-green-700 break-all">
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
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowKeyReveal(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                I&apos;ve Saved My Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* API Keys List */}
        <Card className="bg-popover border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your API keys for external integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No API keys yet</p>
                <p className="text-sm mt-1">
                  Create one to integrate with your ERP
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-muted border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {key.name}
                        </span>
                        <Badge
                          variant={
                            key.scope === "write" ? "default" : "secondary"
                          }
                          className={
                            key.scope === "write"
                              ? "bg-teal-600 text-white"
                              : "bg-muted text-foreground"
                          }
                        >
                          {key.scope === "write" ? "Read & Write" : "Read Only"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-border text-muted-foreground"
                        >
                          {key.rate_limit_tier}
                        </Badge>
                        {key.role && (
                          <Badge
                            variant="outline"
                            className="border-blue-500/40 text-blue-400"
                          >
                            {key.role}
                          </Badge>
                        )}
                        {!key.is_active && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <code className="font-mono">{key.key_prefix}</code>
                        <span>
                          Created{" "}
                          {formatDistanceToNow(new Date(key.created_at))} ago
                        </span>
                        {key.last_used_at && (
                          <span>
                            Last used{" "}
                            {formatDistanceToNow(new Date(key.last_used_at))}{" "}
                            ago
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(key)}
                      className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
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
        <div className="relative bg-transparent border border-border overflow-visible">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Quick Start</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Example API request using your key
            </p>
          </div>
          <div className="p-4 bg-[#0a0a0a] rounded-b-lg">
            <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap overflow-x-auto">
              {`curl -H "Authorization: Bearer YOUR_API_KEY" \\
 -H "Content-Type: application/json" \\
 ${typeof window !== "undefined" ? window.location.origin : "https://api.exportready.io"}/api/v1/batches`}
            </pre>
          </div>
        </div>

        {/* Device Token Management */}
        <Card className="bg-popover border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Device Tokens
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Authenticate BMS devices for telemetry ingestion
              </CardDescription>
            </div>
            <Dialog
              open={showCreateTokenDialog}
              onOpenChange={setShowCreateTokenDialog}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> New Token
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-popover border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    Create Device Token
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Generate a token for BMS device telemetry. Scope it to a
                    specific batch for security.
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
                    <p className="text-xs text-muted-foreground">
                      Leave empty to allow telemetry for any passport
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateTokenDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateToken}
                    disabled={creatingToken}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {creatingToken ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Radio className="w-4 h-4 mr-1" />
                    )}
                    Create Token
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingTokens ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : deviceTokens.length === 0 ? (
              <div className="text-center py-8">
                <Cpu className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No device tokens yet
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Create a token to start sending BMS telemetry data
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deviceTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-3 bg-muted border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Cpu className="h-4 w-4 text-teal-600" />
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {token.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {!token.is_active && (
                            <Badge
                              variant="outline"
                              className="text-red-500 border-red-300"
                            >
                              Revoked
                            </Badge>
                          )}
                          {token.batch_id && (
                            <span className="text-xs text-muted-foreground">
                              Batch: {token.batch_id.slice(0, 8)}â€¦
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Created{" "}
                            {formatDistanceToNow(new Date(token.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => setDeleteTokenTarget(token)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Sample payload */}
            <div className="mt-4 p-3 bg-background">
              <p className="text-xs text-muted-foreground mb-2">
                Sample telemetry request:
              </p>
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
          <DialogContent className="bg-popover border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Device Token Created
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Flash this token into your BMS firmware. It will not be shown
                again.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-amber-500/10 border border-amber-500/20 p-3">
              <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                Copy this token now â€” it will only be shown once!
              </div>
            </div>
            <div className="p-3 bg-background flex items-center justify-between">
              <code className="text-green-400 text-sm break-all">
                {newTokenRaw}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(newTokenRaw)}
                className="text-muted-foreground hover:text-white shrink-0 ml-2"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Token Confirmation */}
        <AlertDialog
          open={!!deleteTokenTarget}
          onOpenChange={() => setDeleteTokenTarget(null)}
        >
          <AlertDialogContent className="bg-popover border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Revoke Device Token?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently revoke &quot;{deleteTokenTarget?.name}
                &quot;. Any devices using this token will stop sending
                telemetry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-accent">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteToken}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Revoke Token
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* External API Documentation Link */}
        <Card className="bg-popover border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              External API Endpoints
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Use these endpoints with your API key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="p-3 bg-muted border border-border">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Badge className="bg-green-600 text-white">POST</Badge>
                  <code className="text-foreground">
                    /api/v1/external/batches
                  </code>
                  <Badge
                    variant="outline"
                    className="border-teal-500 text-teal-600"
                  >
                    write
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">Create a new batch</p>
              </div>
              <div className="p-3 bg-muted border border-border">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Badge className="bg-green-600 text-white">POST</Badge>
                  <code className="text-foreground">
                    /api/v1/external/batches/&#123;id&#125;/passports
                  </code>
                  <Badge
                    variant="outline"
                    className="border-teal-500 text-teal-600"
                  >
                    write
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Add passports via JSON (up to 500 per request)
                </p>
              </div>
              <div className="p-3 bg-muted border border-border">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Badge className="bg-blue-600 text-white">GET</Badge>
                  <code className="text-foreground">
                    /api/v1/external/batches/&#123;id&#125;/labels
                  </code>
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground"
                  >
                    read
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Download PDF labels for printing
                </p>
              </div>
              <div className="p-3 bg-muted border border-border">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Badge className="bg-blue-600 text-white">GET</Badge>
                  <code className="text-foreground">
                    /api/v1/external/passports/&#123;uuid&#125;
                  </code>
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground"
                  >
                    read
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Get passport details
                </p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-muted-foreground text-sm">
                Include your API key in the{" "}
                <code className="text-foreground bg-muted px-1 rounded">
                  X-API-Key
                </code>{" "}
                header.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent className="bg-popover border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Delete API Key?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently revoke the key &quot;{deleteTarget?.name}
                &quot;. Any integrations using this key will stop working.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-accent">
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
  );
}
