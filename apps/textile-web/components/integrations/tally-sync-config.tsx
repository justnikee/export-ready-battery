"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Factory, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface SyncConfig {
  id?: string;
  tally_host: string;
  tally_port: number;
  sync_frequency_minutes: number;
  auto_import: boolean;
  enabled: boolean;
  last_sync_at?: string;
}

export default function TallySyncConfig() {
  const [config, setConfig] = useState<SyncConfig>({
    tally_host: "localhost",
    tally_port: 9000,
    sync_frequency_minutes: 5,
    auto_import: false,
    enabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const response = await api.get("/integrations/tally/sync-config");
        if (response.data && response.data.id) {
          setConfig(response.data);
        }
      } catch {
        // No config yet is fine
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.post("/integrations/tally/sync-config", config);
      setConfig(response.data);
      toast.success("Tally sync configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await api.post("/integrations/tally/sync-trigger");
      toast.success("Manual sync triggered. Check staging in a few moments.");
    } catch {
      toast.error("Failed to trigger sync");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Tally Live Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Factory className="w-5 h-5 text-primary" />
              Tally Live Sync
            </CardTitle>
            <CardDescription>
              Automatically sync stock items and purchase vouchers from Tally ERP every {config.sync_frequency_minutes} minutes.
            </CardDescription>
          </div>
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Enabled</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" /> Disabled</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Live Sync</Label>
            <p className="text-sm text-muted-foreground">
              Pull stock items and vouchers from Tally automatically.
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tally-host">Tally Host</Label>
            <Input
              id="tally-host"
              value={config.tally_host}
              onChange={(e) => setConfig((c) => ({ ...c, tally_host: e.target.value }))}
              placeholder="localhost"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tally-port">Tally Port</Label>
            <Input
              id="tally-port"
              type="number"
              value={config.tally_port}
              onChange={(e) => setConfig((c) => ({ ...c, tally_port: parseInt(e.target.value) || 9000 }))}
              placeholder="9000"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Sync Frequency</Label>
            <span className="text-sm font-medium">{config.sync_frequency_minutes} min</span>
          </div>
          <Slider
            value={[config.sync_frequency_minutes]}
            onValueChange={([v]) => setConfig((c) => ({ ...c, sync_frequency_minutes: v }))}
            min={1}
            max={60}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            How often to poll Tally for new stock items and vouchers.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-Import</Label>
            <p className="text-sm text-muted-foreground">
              Automatically create lot drafts from synced items without review.
            </p>
          </div>
          <Switch
            checked={config.auto_import}
            onCheckedChange={(v) => setConfig((c) => ({ ...c, auto_import: v }))}
          />
        </div>

        {config.last_sync_at && (
          <p className="text-xs text-muted-foreground">
            Last sync: {new Date(config.last_sync_at).toLocaleString("en-IN")}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
          <Button
            variant="outline"
            onClick={handleTrigger}
            disabled={triggering || !config.enabled}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${triggering ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
