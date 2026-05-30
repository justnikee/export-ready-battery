"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Globe,
  AlertTriangle,
} from "lucide-react";
import type { Batch } from "@/lib/types";
import type { MarketRegion, ActivationBlockers } from "./types";

interface BatchHeaderProps {
  batch: Batch;
  passportCount: number;
  isDraft: boolean;
  activationResult: ActivationBlockers;
  activating: boolean;
  deletingDraft: boolean;
  batchesHref: string;
  onActivate: () => void;
  onDeleteDraft: () => void;
  onPrintLabels: () => void;
  onArchive: () => void;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-xs px-2 py-0.5 font-medium">
        <Unlock className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  }
  if (status === "ARCHIVED") {
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 border-border text-xs px-2 py-0.5 font-medium">
        Archived
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 text-xs px-2 py-0.5 font-medium">
      <Lock className="h-3 w-3 mr-1" />
      Draft
    </Badge>
  );
}

function MarketBadge({ region }: { region: MarketRegion }) {
  if (region === "INDIA") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-orange-500/10 text-orange-700 border border-orange-200">
        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
        India
      </span>
    );
  }
  if (region === "EU") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
        EU
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border">
      <Globe className="h-3 w-3" />
      Global
    </span>
  );
}

function ProductChip({ batch }: { batch: Batch }) {
  const product = batch.product_type || "BATTERY";
  const chemistry = batch.specs?.chemistry || "Unknown";
  return (
    <span className="text-xs font-medium px-2 py-1 bg-muted border border-border text-muted-foreground">
      {product}: {chemistry}
    </span>
  );
}

export function BatchHeader({
  batch,
  isDraft,
  activationResult,
  activating,
  deletingDraft,
  batchesHref,
  onActivate,
  onDeleteDraft,
  onPrintLabels,
  onArchive,
}: BatchHeaderProps) {
  const router = useRouter();
  const region = (batch.market_region || "GLOBAL") as MarketRegion;
  const hasBlockers = activationResult.blocking.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(batchesHref)}
        className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-2 w-fit"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Batches
      </Button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left: Title + meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl text-foreground tracking-tight">
              {batch.batch_name}
            </h1>
            <StatusBadge status={batch.status} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <MarketBadge region={region} />
            <ProductChip batch={batch} />
            <span className="text-sm text-muted-foreground">
              Created {new Date(batch.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isDraft && (
            <>
              <Button
                onClick={onActivate}
                disabled={activating || hasBlockers}
                className={
                  hasBlockers
                    ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
                }
                title={
                  hasBlockers
                    ? `${activationResult.blocking.length} requirement(s) missing`
                    : "Activate this batch"
                }
              >
                {activating ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Activate Batch
                  </>
                )}
              </Button>
              {batch.total_passports === 0 && (
                <Button
                  variant="outline"
                  onClick={onDeleteDraft}
                  disabled={deletingDraft}
                  className="border-red-200 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                >
                  {deletingDraft ? "Deleting..." : "Delete Draft"}
                </Button>
              )}
            </>
          )}

          {batch.status === "ACTIVE" && (
            <>
              <Button
                variant="outline"
                onClick={onPrintLabels}
                className="border-border text-foreground hover:bg-muted"
              >
                Print Labels
              </Button>
              <Button
                variant="outline"
                onClick={onArchive}
                className="border-amber-200 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
              >
                Archive Batch
              </Button>
            </>
          )}

          {batch.status === "ARCHIVED" && (
            <Button
              variant="outline"
              disabled
              className="border-border text-muted-foreground cursor-not-allowed"
            >
              <Lock className="mr-2 h-4 w-4" />
              Archived (Read Only)
            </Button>
          )}
        </div>
      </div>

      {/* Blocker hint */}
      {isDraft && hasBlockers && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {activationResult.blocking.length} requirement
            {activationResult.blocking.length > 1 ? "s" : ""} missing —
            see checklist below
          </span>
        </div>
      )}
    </div>
  );
}
