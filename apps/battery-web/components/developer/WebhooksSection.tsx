"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Loader2,
  Radio,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  retryWebhookDelivery,
  WEBHOOK_EVENT_OPTIONS,
  type OutboundWebhook,
  type WebhookDelivery,
} from "@/lib/api/webhooks";

function DeliveryStatusBadge({ delivery }: { delivery: WebhookDelivery }) {
  if (delivery.response_status && delivery.response_status >= 200 && delivery.response_status < 300) {
    return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">Delivered ({delivery.response_status})</Badge>;
  }
  if (delivery.response_status) {
    return <Badge variant="outline" className="text-red-500 border-red-500/30 text-[10px]">Failed ({delivery.response_status})</Badge>;
  }
  return <Badge variant="outline" className="text-red-500 border-red-500/30 text-[10px]">Failed (network error)</Badge>;
}

function DeliveryLog({ webhookId }: { webhookId: string }) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchDeliveries = useCallback(() => {
    setLoading(true);
    getWebhookDeliveries(webhookId)
      .then(setDeliveries)
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false));
  }, [webhookId]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleRetry = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    try {
      await retryWebhookDelivery(deliveryId);
      toast.success("Delivery retried");
      fetchDeliveries();
    } catch {
      toast.error("Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  if (loading) {
    return <div className="py-4 text-center text-xs text-muted-foreground">Loading deliveries...</div>;
  }
  if (deliveries.length === 0) {
    return <div className="py-4 text-center text-xs text-muted-foreground">No deliveries logged yet.</div>;
  }

  return (
    <div className="divide-y divide-border">
      {deliveries.map((d) => (
        <div key={d.id} className="py-2 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-foreground">{d.event_type}</span>
              <DeliveryStatusBadge delivery={d} />
              {d.retry_count > 0 && (
                <span className="text-muted-foreground">retried {d.retry_count}x</span>
              )}
            </div>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
            </span>
          </div>
          {!(d.response_status && d.response_status >= 200 && d.response_status < 300) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              disabled={retryingId === d.id}
              onClick={() => handleRetry(d.id)}
            >
              {retryingId === d.id ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RotateCcw className="h-3 w-3 mr-1" />
              )}
              Retry
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([WEBHOOK_EVENT_OPTIONS[0]]);
  const [creating, setCreating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OutboundWebhook | null>(null);

  const fetchWebhooks = () => {
    setLoading(true);
    listWebhooks()
      .then(setWebhooks)
      .catch(() => toast.error("Failed to load webhooks"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async () => {
    if (!newUrl.trim()) {
      toast.error("Webhook URL is required");
      return;
    }
    if (newEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }
    setCreating(true);
    try {
      const created = await createWebhook(newUrl.trim(), newEvents);
      setShowAddDialog(false);
      setNewUrl("");
      setNewEvents([WEBHOOK_EVENT_OPTIONS[0]]);
      setRevealedSecret(created.secret);
      fetchWebhooks();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to register webhook";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWebhook(deleteTarget.id);
      setDeleteTarget(null);
      fetchWebhooks();
    } catch {
      toast.error("Failed to delete webhook");
    }
  };

  const copySecret = async () => {
    if (!revealedSecret) return;
    await navigator.clipboard.writeText(revealedSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className="bg-popover border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Get notified by HTTP POST when lifecycle events occur on your passports
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Register Webhook</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Events will be POSTed to this URL with an X-Webhook-Signature HMAC-SHA256 header.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://your-server.com/webhook"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Events to subscribe</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEBHOOK_EVENT_OPTIONS.map((evt) => (
                      <button
                        key={evt}
                        type="button"
                        onClick={() =>
                          setNewEvents((prev) =>
                            prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt],
                          )
                        }
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          newEvents.includes(evt)
                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-300"
                            : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                        }`}
                      >
                        {evt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  Register Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Radio className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No outbound webhooks configured</p>
              <p className="text-muted-foreground text-xs mt-1">
                Add a webhook to receive event notifications via HTTP POST
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div key={wh.id} className="bg-muted border border-border">
                  <div className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <code className="text-sm text-foreground font-mono break-all">{wh.url}</code>
                      <div className="flex gap-1 mt-1 flex-wrap items-center">
                        {wh.event_types.map((evt) => (
                          <span
                            key={evt}
                            className="text-[10px] px-1.5 py-0.5 bg-background text-muted-foreground rounded"
                          >
                            {evt}
                          </span>
                        ))}
                        {!wh.is_active && (
                          <Badge variant="outline" className="text-red-500 border-red-300 text-[10px]">
                            Deactivated (too many failures)
                          </Badge>
                        )}
                        {wh.failure_count > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {wh.failure_count} recent failures
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setExpandedId(expandedId === wh.id ? null : wh.id)}
                      >
                        {expandedId === wh.id ? (
                          <ChevronUp className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        )}
                        Deliveries
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => setDeleteTarget(wh)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {expandedId === wh.id && (
                    <div className="px-3 pb-3 border-t border-border">
                      <DeliveryLog webhookId={wh.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secret reveal dialog */}
      <Dialog open={!!revealedSecret} onOpenChange={(open) => !open && setRevealedSecret(null)}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Webhook Registered</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Use this signing secret to verify the X-Webhook-Signature header on incoming requests. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-500/10 border border-amber-500/20 p-3">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Copy this secret now — it will only be shown once!
            </div>
          </div>
          <div className="p-3 bg-background flex items-center justify-between">
            <code className="text-green-400 text-sm break-all">{revealedSecret}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copySecret}
              className="text-muted-foreground hover:text-white shrink-0 ml-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete this webhook?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This cannot be undone. Events will stop being sent to this URL immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
