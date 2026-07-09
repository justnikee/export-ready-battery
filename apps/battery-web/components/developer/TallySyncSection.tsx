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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  RefreshCw,
  Factory,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  getTallySyncConfig,
  saveTallySyncConfig,
  getTallyStaging,
  applyTallyStaging,
  discardTallyStaging,
  triggerTallySync,
  type TallySyncConfig,
  type TallySyncStagingItem,
} from "@/lib/api/tally";

const DEFAULT_CONFIG: TallySyncConfig = {
  tally_host: "localhost",
  tally_port: 9000,
  sync_frequency_minutes: 5,
  auto_import: false,
  enabled: false,
};

function StagingRow({
  item,
  onApply,
  onDiscard,
  busy,
}: {
  item: TallySyncStagingItem;
  onApply: (id: string) => void;
  onDiscard: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-md bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{item.tally_name}</span>
            {item.detected_category && (
              <Badge variant="outline" className="text-[10px]">{item.detected_category}</Badge>
            )}
            {item.detected_chemistry && (
              <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30">
                {item.detected_chemistry}
              </Badge>
            )}
          </div>
          <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {item.tally_qty !== undefined && <span>Qty: {item.tally_qty}</span>}
            {item.tally_rate !== undefined && <span>Rate: {item.tally_rate}</span>}
            {item.tally_amount !== undefined && <span>Amount: ₹{item.tally_amount.toLocaleString()}</span>}
            {item.tally_gst !== undefined && <span>GST: {item.tally_gst}%</span>}
            {item.tally_hsn && <span>HSN: {item.tally_hsn}</span>}
            {item.tally_party && <span>Party: {item.tally_party}</span>}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Synced {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </span>
        </div>
        {item.status === "pending" ? (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              disabled={busy}
              onClick={() => onApply(item.id)}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-red-500 hover:bg-red-500/10"
              disabled={busy}
              onClick={() => onDiscard(item.id)}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Discard
            </Button>
          </div>
        ) : (
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${
              item.status === "applied"
                ? "text-emerald-500 border-emerald-500/30"
                : "text-muted-foreground"
            }`}
          >
            {item.status}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function TallySyncSection() {
  const [config, setConfig] = useState<TallySyncConfig>(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [items, setItems] = useState<TallySyncStagingItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"pending" | "applied" | "discarded">("pending");
  const [loadingStaging, setLoadingStaging] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchConfig = useCallback(() => {
    getTallySyncConfig()
      .then((res) => {
        if (res.config) setConfig(res.config);
      })
      .catch(() => toast.error("Failed to load Tally sync configuration"))
      .finally(() => setConfigLoaded(true));
  }, []);

  const fetchStaging = useCallback(() => {
    setLoadingStaging(true);
    getTallyStaging(statusFilter)
      .then((res) => setItems(res.items || []))
      .catch(() => toast.error("Failed to load Tally staging items"))
      .finally(() => setLoadingStaging(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchStaging();
  }, [fetchStaging]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const saved = await saveTallySyncConfig(config);
      setConfig(saved);
      toast.success("Tally sync configuration saved");
    } catch {
      toast.error("Failed to save Tally sync configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await triggerTallySync();
      toast.success("Sync triggered — staged items will appear shortly");
      setTimeout(fetchStaging, 3000);
    } catch {
      toast.error("Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleApply = async (id: string) => {
    setBusyId(id);
    try {
      await applyTallyStaging(id);
      toast.success("Marked applied — create the battery batch from this data in New Batch");
      fetchStaging();
    } catch {
      toast.error("Failed to apply staged item");
    } finally {
      setBusyId(null);
    }
  };

  const handleDiscard = async (id: string) => {
    setBusyId(id);
    try {
      await discardTallyStaging(id);
      toast.success("Staged item discarded");
      fetchStaging();
    } catch {
      toast.error("Failed to discard staged item");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Tally ERP Sync
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Pull stock items and vouchers from Tally Prime, review them, then apply or discard before they become battery batches
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={syncing || !config.enabled}
          onClick={handleSyncNow}
          title={!config.enabled ? "Enable sync below first" : undefined}
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Sync Now
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="tally-enabled" className="text-sm">Enable Tally sync</Label>
            <Switch
              id="tally-enabled"
              checked={config.enabled}
              disabled={!configLoaded}
              onCheckedChange={(checked) => setConfig((c) => ({ ...c, enabled: checked }))}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tally-host" className="text-xs text-muted-foreground">Tally Host</Label>
              <Input
                id="tally-host"
                value={config.tally_host}
                onChange={(e) => setConfig((c) => ({ ...c, tally_host: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tally-port" className="text-xs text-muted-foreground">Port</Label>
              <Input
                id="tally-port"
                type="number"
                value={config.tally_port}
                onChange={(e) => setConfig((c) => ({ ...c, tally_port: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tally-freq" className="text-xs text-muted-foreground">Sync every (min)</Label>
              <Input
                id="tally-freq"
                type="number"
                min={1}
                max={60}
                value={config.sync_frequency_minutes}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, sync_frequency_minutes: Number(e.target.value) || 5 }))
                }
              />
            </div>
            <div className="flex items-end justify-between gap-2 pb-1.5">
              <Label htmlFor="tally-auto" className="text-xs text-muted-foreground">Auto-import</Label>
              <Switch
                id="tally-auto"
                checked={config.auto_import}
                onCheckedChange={(checked) => setConfig((c) => ({ ...c, auto_import: checked }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={saving} onClick={handleSaveConfig}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Staging review */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            {(["pending", "applied", "discarded"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-300"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loadingStaging ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Factory className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No {statusFilter} items</p>
              <p className="text-muted-foreground text-xs mt-1">
                {statusFilter === "pending"
                  ? "Run a sync to pull stock items and vouchers from Tally"
                  : `Items you ${statusFilter === "applied" ? "apply" : "discard"} will appear here`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <StagingRow
                  key={item.id}
                  item={item}
                  onApply={handleApply}
                  onDiscard={handleDiscard}
                  busy={busyId === item.id}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
