"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Globe,
  Database,
  FlaskConical,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Zap,
  Info,
} from "lucide-react";
import { verifyBatchRegistry, autoVerifyBatch } from "@/lib/api/registry";
import { toast } from "sonner";
import type { RegistryVerification, RegistryType, TrustTier } from "@/lib/types";

interface RegistryVerificationsTabProps {
  batchId: string;
  verifications: RegistryVerification[];
  verificationsLoading: boolean;
  onRefresh: () => Promise<void>;
}

const REGISTRY_META: Record<
  RegistryType,
  { label: string; description: string; icon: React.ReactNode }
> = {
  bis: {
    label: "BIS",
    description: "Bureau of Indian Standards",
    icon: <Shield className="h-4 w-4" />,
  },
  cpcb: {
    label: "CPCB EPR",
    description: "Central Pollution Control Board",
    icon: <Database className="h-4 w-4" />,
  },
  eu_nando: {
    label: "EU NANDO",
    description: "EU Notified Bodies Database",
    icon: <Globe className="h-4 w-4" />,
  },
  un38_3: {
    label: "UN38.3",
    description: "UN Transport Safety Testing",
    icon: <FlaskConical className="h-4 w-4" />,
  },
  custom: {
    label: "Custom",
    description: "Custom registry adapter",
    icon: <Search className="h-4 w-4" />,
  },
};

function TrustTierBadge({ tier }: { tier: TrustTier }) {
  const styles: Record<TrustTier, string> = {
    self_declared:
      "bg-amber-500/10 text-amber-500 border-amber-500/30",
    registry_verified:
      "bg-blue-500/10 text-blue-500 border-blue-500/30",
    official_api:
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  };
  const labels: Record<TrustTier, string> = {
    self_declared: "Self Declared",
    registry_verified: "Registry Verified",
    official_api: "Official API",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs ${styles[tier] || styles.self_declared}`}
    >
      {labels[tier] || tier}
    </Badge>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "verified":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "failed":
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "not_found":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "pending":
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function VerificationCard({
  v,
  batchId,
  onRefresh,
}: {
  v: RegistryVerification;
  batchId: string;
  onRefresh: () => Promise<void>;
}) {
  const [verifying, setVerifying] = useState(false);
  const meta = REGISTRY_META[v.registry_type as RegistryType] || REGISTRY_META.custom;

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await verifyBatchRegistry(batchId, {
        registry_type: v.registry_type as RegistryType,
        certificate_no: v.certificate_no,
      });
      toast.success(`${meta.label} verification refreshed`);
      await onRefresh();
    } catch {
      toast.error(`${meta.label} verification failed`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="border border-border bg-transparent relative p-4 space-y-3">
      <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
      <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-muted border border-border">
            {meta.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              {meta.label}
            </div>
            <div className="text-xs text-muted-foreground">
              {meta.description}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusIcon status={v.status} />
          <TrustTierBadge tier={v.trust_tier} />
        </div>
      </div>

      {v.certificate_no && (
        <div className="text-xs text-muted-foreground">
          Certificate: <span className="font-mono text-foreground">{v.certificate_no}</span>
        </div>
      )}

      {v.error_message && (
        <div className="text-xs text-red-500 bg-red-500/5 border border-red-500/20 p-2">
          {v.error_message}
        </div>
      )}

      {v.verified_at && (
        <div className="text-xs text-muted-foreground">
          Verified: {new Date(v.verified_at).toLocaleString()}
          {v.expires_at && (
            <span className="ml-2">
              · Expires: {new Date(v.expires_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-border hover:bg-accent"
        disabled={verifying}
        onClick={handleVerify}
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${verifying ? "animate-spin" : ""}`} />
        {verifying ? "Verifying..." : "Re-verify"}
      </Button>
    </div>
  );
}

export function RegistryVerificationsTab({
  batchId,
  verifications,
  verificationsLoading,
  onRefresh,
}: RegistryVerificationsTabProps) {
  // Lazy-load verifications when this tab is first mounted and data is empty
  useEffect(() => {
    if (verifications.length === 0 && !verificationsLoading) {
      onRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [autoVerifying, setAutoVerifying] = useState(false);

  const handleAutoVerify = async () => {
    setAutoVerifying(true);
    try {
      const result = await autoVerifyBatch(batchId);
      toast.success(`Auto-verify complete — ${result.count} registry check(s) run`);
      await onRefresh();
    } catch {
      toast.error("Auto-verify failed");
    } finally {
      setAutoVerifying(false);
    }
  };

  // Build a merged list: show all known registry types, filling in missing ones as "not checked"
  const knownTypes: RegistryType[] = ["bis", "cpcb", "eu_nando", "un38_3"];
  const byType = new Map<string, RegistryVerification>();
  for (const v of verifications) {
    byType.set(v.registry_type, v);
  }

  const merged = knownTypes.map((type) => {
    const existing = byType.get(type);
    if (existing) return existing;
    return {
      id: `placeholder-${type}`,
      tenant_id: "",
      batch_id: batchId,
      registry_type: type,
      status: "not_found" as const,
      trust_tier: "self_declared" as const,
      created_at: "",
      updated_at: "",
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-border bg-transparent relative">
        <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
        <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
        <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            External Registry Verification
          </h3>
          <Badge
            variant="outline"
            className="ml-auto text-xs bg-amber-500/10 text-amber-500 border-amber-500/30"
          >
            Beta
          </Badge>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify batch certificates against official registries. When registry
            API integrations are configured, API-validated trust replaces
            self-declared compliance for BIS, CPCB EPR, EU NANDO, and UN38.3.
          </p>
          <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/5 border border-amber-500/20 p-2.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Registry verification runs against live databases via scraping
              (BIS portal, EU NANDO, CPCB internal ledger) and lab
              accreditation validation (UN38.3). Results are cached for 7 days.
              If a registry portal is down, the check falls back to
              self-declared status.
            </span>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={autoVerifying}
            onClick={handleAutoVerify}
          >
            <Zap className={`h-3.5 w-3.5 ${autoVerifying ? "animate-pulse" : ""}`} />
            {autoVerifying ? "Running checks..." : "Auto-Verify All Registries"}
          </Button>
        </div>
      </div>

      {/* Verification cards */}
      {verificationsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {merged.map((v) => (
            <VerificationCard
              key={v.id}
              v={v}
              batchId={batchId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
